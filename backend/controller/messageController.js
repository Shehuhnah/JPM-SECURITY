import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/User.model.js"; 
import Guard from "../models/guard.model.js";
import Applicant from "../models/applicant.model.js";

import { io, onlineUsersMap } from "../server.js";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toString) return value.toString();
  return String(value);
};

const GUARD_CONVERSATION_TYPES = ["guard-subadmin", "subadmin-guard", "guard-admin", "admin-guard"];
const APPLICANT_CONVERSATION_TYPES = ["subadmin-applicant", "applicant-subadmin", "admin-applicant", "applicant-admin"];

const isGuardConversationType = (type) => GUARD_CONVERSATION_TYPES.includes(type);

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverRole, text, type } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    if (!receiverRole) {
      return res.status(400).json({ message: "receiverRole is required" });
    }

    let conversation = null;

    // Logic to find or create conversation based on type and participants
    if (isGuardConversationType(type)) {
        const guardParticipantId = senderRole === "Guard" ? senderId : receiverId;
        conversation = await Conversation.findOne({
            type: { $in: GUARD_CONVERSATION_TYPES },
            "participants.userId": guardParticipantId,
        });
    } else if (type === "admin-subadmin" || type === "subadmin-admin") {
        conversation = await Conversation.findOne({
            type: { $in: ["admin-subadmin", "subadmin-admin"] },
            "participants.userId": { $all: [senderId, receiverId] },
        });
    } else if (type.includes("applicant")) { // Covers all applicant-related types
        const applicantParticipantId = senderRole === "Applicant" ? senderId : receiverId;
        conversation = await Conversation.findOne({
            type: { $in: APPLICANT_CONVERSATION_TYPES },
            "participants.userId": applicantParticipantId,
        });
        // If an old type is found, convert it to applicant-subadmin
        if (conversation && (conversation.type === "admin-applicant" || conversation.type === "applicant-admin")) {
            conversation.type = "applicant-subadmin";
            await conversation.save();
        }
    } else {
        conversation = await Conversation.findOne({
            type,
            "participants.userId": { $all: [senderId, receiverId] },
        });
    }
    

    if (!conversation) {
      // Create conversation
      const participantsArray = [{ userId: senderId, role: senderRole }];
      if (receiverId) {
        participantsArray.push({ userId: receiverId, role: receiverRole });
      }

      conversation = await Conversation.create({
        type: type.includes("applicant") ? "applicant-subadmin" : type, // Default to applicant-subadmin for applicant types
        participants: participantsArray,
      });
    }

    // Ensure current participants are present
    const ensureParticipant = async (pId, pRole) => {
      const alreadyExists = conversation.participants.some((p) =>
        p.userId.toString() === pId.toString()
      );
      if (!alreadyExists) {
        conversation.participants.push({ userId: pId, role: pRole });
        await conversation.save(); // Save after adding new participant
      }
    };
    await ensureParticipant(senderId, senderRole);
    await ensureParticipant(receiverId, receiverRole);

    // Map roles to model names for refPath
    const senderModel = (senderRole === 'Admin' || senderRole === 'Subadmin') ? 'Admin' : senderRole;
    const receiverModel = (receiverRole === 'Admin' || receiverRole === 'Subadmin') ? 'Admin' : receiverRole;

    const messageData = {
      conversationId: conversation._id,
      senderId,
      receiverId,
      text: text || "",
      sender: { userId: senderId, role: senderModel },
      receiver: { userId: receiverId, role: receiverModel },
    };

    if (req.file) {
      messageData.file = "/uploads/messages/" + req.file.filename; // Use specific folder for messages
      messageData.fileName = req.file.originalname;
    }

    const message = await Message.create(messageData);
    const roomId = normalizeId(conversation._id);

    // Update last message
    conversation.lastMessage = {
      text: text || (req.file ? "Sent an attachment" : ""),
      senderId,
      senderRole,
      createdAt: new Date(),
      seen: false,
    };

    // If a subadmin sends a message, update the serving subadmin
    if (senderRole === "Subadmin" && isGuardConversationType(conversation.type)) {
      const subadminUser = await User.findById(senderId, "name email role");
      conversation.servingSubadmin = {
        userId: senderId,
        name: subadminUser?.name || "Unknown",
        updatedAt: new Date(),
      };
    }

    await conversation.save();

    // Fetch raw conversation and message
    let rawConversation = await Conversation.findById(conversation._id).lean();
    let rawMessage = await Message.findById(message._id).lean();

    // Manually populate participants for rawConversation
    rawConversation.participants = await Promise.all(rawConversation.participants.map(async (participant) => {
        let userDoc = null;
        if (participant.role === 'Admin' || participant.role === 'Subadmin') {
            userDoc = await User.findById(participant.userId).select('name email role').lean();
        } else if (participant.role === 'Guard') {
            userDoc = await Guard.findById(participant.userId).select('fullName name email role guardId phoneNumber photo').lean();
        } else if (participant.role === 'Applicant') {
            userDoc = await Applicant.findById(participant.userId).select('name email phone status').lean();
        }
        return userDoc ? { ...participant, userId: userDoc } : participant;
    }));

    // Manually populate servingSubadmin for rawConversation
    if (rawConversation.servingSubadmin && rawConversation.servingSubadmin.userId) {
        rawConversation.servingSubadmin.userId = await User.findById(rawConversation.servingSubadmin.userId).select('name email role').lean();
    }

    // Manually populate sender for rawMessage
    if (rawMessage.sender && rawMessage.sender.userId && rawMessage.sender.role) {
        const senderRole = rawMessage.sender.role;
        const senderId = rawMessage.sender.userId;
        let senderDoc = null;

        if (senderRole === 'Admin' || senderRole === 'Subadmin') {
            senderDoc = await User.findById(senderId).select('name email role').lean();
        } else if (senderRole === 'Guard') {
            senderDoc = await Guard.findById(senderId).select('fullName name email role guardId phoneNumber photo').lean();
        } else if (senderRole === 'Applicant') {
            senderDoc = await Applicant.findById(senderId).select('name email phone status').lean();
        }
        rawMessage.sender.userId = senderDoc;
    }

    // Manually populate receiver for rawMessage
    if (rawMessage.receiver && rawMessage.receiver.userId && rawMessage.receiver.role) {
        const receiverRole = rawMessage.receiver.role;
        const receiverId = rawMessage.receiver.userId;
        let receiverDoc = null;

        if (receiverRole === 'Admin' || receiverRole === 'Subadmin') {
            receiverDoc = await User.findById(receiverId).select('name email role').lean();
        } else if (receiverRole === 'Guard') {
            receiverDoc = await Guard.findById(receiverId).select('fullName name email role guardId phoneNumber photo').lean();
        } else if (receiverRole === 'Applicant') {
            receiverDoc = await Applicant.findById(receiverId).select('name email phone status').lean();
        }
        rawMessage.receiver.userId = receiverDoc;
    }
    
    // Dynamically emit updates based on role
    const recipients = [...new Set([senderId.toString(), receiverId.toString()])]; // Ensure unique recipients
    for (const id of recipients) {
      const socketId = onlineUsersMap[id];
      if (!socketId) continue;
      io.to(socketId).emit("receiveMessage", rawMessage);
      io.to(socketId).emit("conversationUpdated", rawConversation);
    }

    io.to(roomId).emit("receiveMessage", rawMessage);
    io.to(roomId).emit("conversationUpdated", rawConversation);
    console.log("[messages] emitted", {
      conversationId: roomId,
      type: conversation.type,
      senderId: normalizeId(senderId),
      receiverId: normalizeId(receiverId),
      recipients,
    });

    // If this is a guard<->subadmin conversation, broadcast to all online subadmins as well
    if (isGuardConversationType(conversation.type)) {
      const allHrUsers = await User.find({ $or: [{ role: "Subadmin" }, { role: "Admin" }] }, "_id");
      for (const hrUser of allHrUsers) {
        const hrId = hrUser._id.toString();
        const socketId = onlineUsersMap[hrId];
        if (socketId && !recipients.includes(hrId)) {
          io.to(socketId).emit("conversationUpdated", rawConversation);
          io.to(socketId).emit("receiveMessage", rawMessage);
        }
      }
    }

    // If this is an applicant conversation, broadcast to all online admins and subadmins
    if (conversation.type.includes("applicant")) {
      const allHrUsers = await User.find({ $or: [{ role: "Subadmin" }, { role: "Admin" }] }, "_id"); // Changed to Admin
      for (const hrUser of allHrUsers) {
        const hrId = hrUser._id.toString();
        const socketId = onlineUsersMap[hrId];
        if (socketId && !recipients.includes(hrId)) { // Avoid double-emitting
          io.to(socketId).emit("conversationUpdated", rawConversation);
          io.to(socketId).emit("receiveMessage", rawMessage);
        }
      }
    }

    res.status(201).json({ message: rawMessage, conversation: rawConversation });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean(); // Fetch raw messages as lean objects

    const userIds = new Set();
    const guardIds = new Set();
    const applicantIds = new Set();

    for (const message of messages) {
      const senderRole = message.sender?.role;
      const senderId = normalizeId(message.sender?.userId);
      const receiverRole = message.receiver?.role;
      const receiverId = normalizeId(message.receiver?.userId);

      if ((senderRole === "Admin" || senderRole === "Subadmin") && senderId) userIds.add(senderId);
      if (senderRole === "Guard" && senderId) guardIds.add(senderId);
      if (senderRole === "Applicant" && senderId) applicantIds.add(senderId);

      if ((receiverRole === "Admin" || receiverRole === "Subadmin") && receiverId) userIds.add(receiverId);
      if (receiverRole === "Guard" && receiverId) guardIds.add(receiverId);
      if (receiverRole === "Applicant" && receiverId) applicantIds.add(receiverId);
    }

    const [users, guards, applicants] = await Promise.all([
      userIds.size ? User.find({ _id: { $in: [...userIds] } }).select("name email role").lean() : [],
      guardIds.size ? Guard.find({ _id: { $in: [...guardIds] } }).select("fullName name email role guardId photo").lean() : [],
      applicantIds.size ? Applicant.find({ _id: { $in: [...applicantIds] } }).select("name email phone status").lean() : [],
    ]);

    const userMap = new Map(users.map((doc) => [normalizeId(doc._id), doc]));
    const guardMap = new Map(guards.map((doc) => [normalizeId(doc._id), doc]));
    const applicantMap = new Map(applicants.map((doc) => [normalizeId(doc._id), doc]));

    const populatedMessages = messages.map((message) => {
      const senderRole = message.sender?.role;
      const senderId = normalizeId(message.sender?.userId);
      const receiverRole = message.receiver?.role;
      const receiverId = normalizeId(message.receiver?.userId);

      if (senderRole === "Admin" || senderRole === "Subadmin") {
        message.sender.userId = userMap.get(senderId) || message.sender.userId;
      } else if (senderRole === "Guard") {
        message.sender.userId = guardMap.get(senderId) || message.sender.userId;
      } else if (senderRole === "Applicant") {
        message.sender.userId = applicantMap.get(senderId) || message.sender.userId;
      }

      if (receiverRole === "Admin" || receiverRole === "Subadmin") {
        message.receiver.userId = userMap.get(receiverId) || message.receiver.userId;
      } else if (receiverRole === "Guard") {
        message.receiver.userId = guardMap.get(receiverId) || message.receiver.userId;
      } else if (receiverRole === "Applicant") {
        message.receiver.userId = applicantMap.get(receiverId) || message.receiver.userId;
      }

      return message;
    });
    
    res.status(200).json(populatedMessages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let conversations = [];

    if (userRole === "Subadmin" || userRole === "Admin") {
      conversations = await Conversation.find({
        $or: [
          { type: { $in: GUARD_CONVERSATION_TYPES } },
          { type: { $in: APPLICANT_CONVERSATION_TYPES } },
          { "participants.userId": userId } // Include conversations where subadmin is a direct participant
        ]
      }).lean();
    } else {
      conversations = await Conversation.find({
        "participants.userId": userId,
      }).lean();
    }

    // Dynamically populate participants, lastMessage.sender, and servingSubadmin.user
    for (let conv of conversations) {
      // Populate participants
      conv.participants = await Promise.all(conv.participants.map(async (participant) => {
        let userDoc = null;
        if (participant.role === "Admin" || participant.role === "Subadmin") {
            userDoc = await User.findById(participant.userId, "name email role");
        } else if (participant.role === "Guard") {
            userDoc = await Guard.findById(participant.userId, "fullName email role guardId photo");
        } else if (participant.role === "Applicant") {
            userDoc = await Applicant.findById(participant.userId, "name email phone isDeleted resume status");
        }
        return userDoc ? { ...participant, user: userDoc } : participant;
      }));


      // Populate lastMessage sender
      if (conv.lastMessage?.senderId) {
        const senderParticipant = conv.participants.find(
          p => p.userId.toString() === conv.lastMessage.senderId.toString()
        );

        if (senderParticipant) {
          if (senderParticipant.role === "Admin" || senderParticipant.role === "Subadmin") {
            conv.lastMessage.sender = await User.findById(conv.lastMessage.senderId, "name email role");
          } else if (senderParticipant.role === "Guard") {
            conv.lastMessage.sender = await Guard.findById(conv.lastMessage.senderId, "fullName email role guardId photo");
          } else if (senderParticipant.role === "Applicant") {
            conv.lastMessage.sender = await Applicant.findById(conv.lastMessage.senderId, "name email phone resume status");
          }
        }
      }

      // Populate servingSubadmin.user if it exists
      if (conv.servingSubadmin?.userId) {
        conv.servingSubadmin.user = await User.findById(conv.servingSubadmin.userId, "name email role");
      }
    }

    // Sort by lastMessage time descending
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt); // Fallback to conversation createdAt
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
      return bTime - aTime;
    });

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: err.message });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id; // Correct way to get user ID

    await Message.updateMany(
      { conversationId, "receiver.userId": userId, seen: false }, // Only mark as seen if the current user is the receiver
      { $set: { seen: true } }
    );

    // Update the last message in conversation to seen if the last message receiver is current user
    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.lastMessage && conversation.lastMessage.senderId.toString() !== userId.toString()) {
      conversation.lastMessage.seen = true;
      await conversation.save();
    }
    
    // Emit event to all participants
    req.io?.to(conversationId).emit("messages_seen", { conversationId, seenBy: userId });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error marking seen:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
