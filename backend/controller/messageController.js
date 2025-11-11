import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { io, onlineUsersMap } from "../server.js";

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverRole, text, type } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    if (!receiverRole) {
      return res.status(400).json({ message: "receiverRole is required" });
    }

    // Determine guardId for guard<->subadmin conversations so a single thread exists per guard
    let conversation = null;
    if (type === "guard-subadmin" || type === "subadmin-guard") {
      const guardId =
        senderRole === "Guard" ? senderId : receiverId;
      conversation = await Conversation.findOne({
        type: { $in: ["guard-subadmin", "subadmin-guard"] },
        "participants.userId": guardId,
      });
    } else if (type === "admin-subadmin" || type === "subadmin-admin") {
      conversation = await Conversation.findOne({
        type: { $in: ["admin-subadmin", "subadmin-admin"] },
        "participants.userId": { $all: [senderId, receiverId] },
      });
    } else if (type === "subadmin-applicant" || type === "applicant-subadmin" || type === "admin-applicant" || type === "applicant-admin") {
      // For applicant conversations, find by applicant ID (single thread per applicant)
      // Check all applicant conversation types, but prioritize applicant-subadmin
      const applicantId = senderRole === "Applicant" ? senderId : receiverId;
      // First try to find applicant-subadmin conversations
      conversation = await Conversation.findOne({
        type: { $in: ["subadmin-applicant", "applicant-subadmin"] },
        "participants.userId": applicantId,
      });
      // If not found, check for old admin-applicant conversations and convert them
      if (!conversation) {
        conversation = await Conversation.findOne({
          type: { $in: ["admin-applicant", "applicant-admin"] },
          "participants.userId": applicantId,
        });
        // Convert old admin-applicant to applicant-subadmin
        if (conversation && (conversation.type === "admin-applicant" || conversation.type === "applicant-admin")) {
          conversation.type = "applicant-subadmin";
          await conversation.save();
        }
      }
    } else {
      // Fallback for other types (e.g., admin-subadmin)
      conversation = await Conversation.findOne({
        type,
        "participants.userId": { $all: [senderId, receiverId] },
      });
    }

    if (!conversation) {
      // Create conversation; for guard<->subadmin, always anchor to the guard participant
      if (type === "guard-subadmin" || type === "subadmin-guard") {
        const guardId =
          senderRole === "Guard" ? senderId : receiverId;
        const subadminId =
          senderRole === "Subadmin" ? senderId : receiverId;
        conversation = await Conversation.create({
          type: "guard-subadmin",
          participants: [
            { userId: guardId, role: "Guard" },
            { userId: subadminId, role: "Subadmin" },
          ],
        });
      } else if (type === "admin-subadmin" || type === "subadmin-admin") {
        conversation = await Conversation.create({
          type: "admin-subadmin",
          participants: [
            { userId: senderId, role: senderRole },
            { userId: receiverId, role: receiverRole },
          ],
        });
      } else if (type === "subadmin-applicant" || type === "applicant-subadmin" || type === "admin-applicant" || type === "applicant-admin") {
        // All applicant conversations should be applicant-subadmin type
        const applicantId = senderRole === "Applicant" ? senderId : receiverId;
        const subadminId = senderRole === "Subadmin" ? senderId : (receiverRole === "Subadmin" ? receiverId : null);
        const adminId = senderRole === "Admin" ? senderId : (receiverRole === "Admin" ? receiverId : null);
        // Prefer subadmin, but if only admin is available, use admin (will be converted later)
        const hrId = subadminId || adminId;
        const hrRole = subadminId ? "Subadmin" : "Admin";
        
        conversation = await Conversation.create({
          type: "applicant-subadmin", // Always create as applicant-subadmin
          participants: [
            { userId: applicantId, role: "Applicant" },
            { userId: hrId, role: hrRole },
          ],
        });
      } else {
        conversation = await Conversation.create({
          type,
          participants: [
            { userId: senderId, role: senderRole },
            { userId: receiverId, role: receiverRole },
          ],
        });
      }
    }

    // Ensure current participants are present (for shared guard threads across subadmins)
    const ensureParticipant = async (participantId, participantRole) => {
      const alreadyExists = conversation.participants.some((p) =>
        p.userId.toString() === participantId.toString()
      );
      if (!alreadyExists) {
        conversation.participants.push({
          userId: participantId,
          role: participantRole,
        });
        // Populate display info for new participant to keep response consistent
        if (participantRole === "Admin" || participantRole === "Subadmin") {
          const userModel = await import("../models/User.model.js").then((m) => m.default);
          const userDoc = await userModel.findById(participantId, "name email role");
          conversation.participants[conversation.participants.length - 1].user = userDoc;
        } else if (participantRole === "Guard") {
          const guardModel = await import("../models/guard.model.js").then((m) => m.default);
          const guardDoc = await guardModel.findById(participantId, "fullName email role");
          conversation.participants[conversation.participants.length - 1].user = guardDoc;
        } else if (participantRole === "Applicant") {
          const applicantModel = await import("../models/applicant.model.js").then((m) => m.default);
          const applicantDoc = await applicantModel.findById(participantId, "name email phone");
          conversation.participants[conversation.participants.length - 1].user = applicantDoc;
        }
      }
    };

    if (type === "guard-subadmin" || type === "subadmin-guard") {
      await ensureParticipant(senderId, senderRole);
      await ensureParticipant(receiverId, receiverRole);
    } else if (type === "subadmin-applicant" || type === "applicant-subadmin" || type === "admin-applicant" || type === "applicant-admin") {
      // All applicant conversations use the same participant logic
      await ensureParticipant(senderId, senderRole);
      await ensureParticipant(receiverId, receiverRole);
    }

    // Create message object
    const messageData = {
      conversationId: conversation._id,
      senderId,
      receiverId,
      text: text || "",
      sender: { userId: senderId, role: senderRole },
      receiver: { userId: receiverId, role: receiverRole },
    };

    if (req.file) {
      messageData.file = "/uploads/" + req.file.filename;
      messageData.fileName = req.file.originalname;
    }

    const message = await Message.create(messageData);

    // Update last message
    conversation.lastMessage = {
      text: text || (req.file ? "Sent an attachment" : ""),
      senderId,
      senderRole,
      createdAt: new Date(),
      seen: false,
    };

    // Populate lastMessage.sender with the sender's user document for front-end fallback
    try {
      if (senderRole === "Admin" || senderRole === "Subadmin") {
        const userModel = await import("../models/User.model.js").then(m => m.default);
        const u = await userModel.findById(senderId, "name email role");
        if (u) conversation.lastMessage.sender = u;
      } else if (senderRole === "Guard") {
        const guardModel = await import("../models/guard.model.js").then(m => m.default);
        const g = await guardModel.findById(senderId, "fullName email role");
        if (g) conversation.lastMessage.sender = g;
      } else if (senderRole === "Applicant") {
        const applicantModel = await import("../models/applicant.model.js").then(m => m.default);
        const a = await applicantModel.findById(senderId, "name email resume status");
        if (a) conversation.lastMessage.sender = a;
      }
    } catch (e) {
      console.error("Failed populating lastMessage.sender:", e);
    }

    // If a subadmin sends a message, update the serving subadmin
    if (senderRole === "Subadmin" && (conversation.type === "guard-subadmin" || conversation.type === "subadmin-guard")) {
      const userModel = await import("../models/User.model.js").then(m => m.default);
      const subadminUser = await userModel.findById(senderId, "name email role");
      conversation.servingSubadmin = {
        userId: senderId,
        name: subadminUser?.name || "Unknown",
        updatedAt: new Date(),
      };
    }

    await conversation.save();

    // Populate participants before emitting
    for (let participant of conversation.participants) {
      if (participant.role === "Admin" || participant.role === "Subadmin") {
        const userModel = await import("../models/User.model.js").then(m => m.default);
        participant.user = await userModel.findById(participant.userId, "name email role");
      } else if (participant.role === "Guard") {
        const guardModel = await import("../models/guard.model.js").then(m => m.default);
        participant.user = await guardModel.findById(participant.userId, "fullName email role");
      } else if (participant.role === "Applicant") {
        const applicantModel = await import("../models/applicant.model.js").then(m => m.default);
        participant.user = await applicantModel.findById(participant.userId, "name email phone isDeleted");
      }
    }

    // Populate servingSubadmin.user if it exists before emitting
    if (conversation.servingSubadmin?.userId) {
      const userModel = await import("../models/User.model.js").then(m => m.default);
      const servingUser = await userModel.findById(conversation.servingSubadmin.userId, "name email role");
      if (servingUser) {
        conversation.servingSubadmin.user = servingUser;
      }
    }

    // Dynamically emit updates based on role
    const recipients = [senderId, receiverId];
    for (const id of recipients) {
      const socketId = onlineUsersMap[id];
      if (!socketId) continue;

      // Dynamically fetch user info for front-end
      let senderUser;
      if (senderRole === "Admin" || senderRole === "Subadmin") {
        const userModel = await import("../models/User.model.js").then(m => m.default);
        senderUser = await userModel.findById(senderId, "name email role");
      } else if (senderRole === "Guard") {
        const guardModel = await import("../models/guard.model.js").then(m => m.default);
        senderUser = await guardModel.findById(senderId, "fullName email role");
      } else if (senderRole === "Applicant") {
        const applicantModel = await import("../models/applicant.model.js").then(m => m.default);
        senderUser = await applicantModel.findById(senderId, "name email phone resume status");
      }

      io.to(socketId).emit("receiveMessage", { ...message.toObject(), senderUser });
      io.to(socketId).emit("conversationUpdated", conversation.toObject());
    }

    // If this is a guard<->subadmin conversation, broadcast to all online subadmins as well
    if (conversation.type === "guard-subadmin" || conversation.type === "subadmin-guard") {
      try {
        const userModel = await import("../models/User.model.js").then(m => m.default);
        const allSubadmins = await userModel.find({ role: "Subadmin" }, "_id");
        for (const sub of allSubadmins) {
          const subId = sub._id.toString();
          const socketId = onlineUsersMap[subId];
          if (!socketId) continue;
          io.to(socketId).emit("conversationUpdated", conversation.toObject());
          io.to(socketId).emit("receiveMessage", message);
        }
      } catch (e) {
        console.error("Broadcast to subadmins failed:", e);
      }
    }

    // If this is an applicant conversation, broadcast to all online admins and subadmins
    if (conversation.type === "subadmin-applicant" || conversation.type === "applicant-subadmin" ||
        conversation.type === "admin-applicant" || conversation.type === "applicant-admin") {
      try {
        const userModel = await import("../models/User.model.js").then(m => m.default);
        const subadmins = await userModel.find({ role: "Subadmin" }, "_id");
        for (const subadmin of subadmins) {
          const subadminId = subadmin._id.toString();
          const socketId = onlineUsersMap[subadminId];
          if (!socketId) continue;
          io.to(socketId).emit("conversationUpdated", conversation.toObject());
          io.to(socketId).emit("receiveMessage", message);
        }
        const admins = await userModel.find({ role: "Admin" }, "_id");
        for (const admin of admins) {
          const adminId = admin._id.toString();
          const socketId = onlineUsersMap[adminId];
          if (!socketId) continue;
          io.to(socketId).emit("conversationUpdated", conversation.toObject());
          io.to(socketId).emit("receiveMessage", message);
        }
      } catch (e) {
        console.error("Broadcast to admins/subadmins failed:", e);
      }
    }

    res.status(201).json({ message, conversation });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log("🔍 [getConversations] User:", { userId, userRole });

    // Fetch conversations:
    // - For Subadmin: return all guard<->subadmin threads AND all applicant conversations so any Subadmin can reply
    // - Otherwise (Guard/Admin): only those the user participates in
    let conversations = [];
    if (userRole === "Subadmin") {
      const guardConversations = await Conversation.find({
        type: { $in: ["subadmin-guard", "guard-subadmin"] },
      }).lean();
      console.log("🛡️ [getConversations] Guard conversations found:", guardConversations.length);

      const applicantConversations = await Conversation.find({
        type: { $in: ["subadmin-applicant", "applicant-subadmin"] },
      }).lean();
      console.log("👤 [getConversations] Applicant conversations found:", applicantConversations.length);
      console.log("👤 [getConversations] Applicant conversations:", applicantConversations.map(c => ({
        id: c._id,
        type: c.type,
        participants: c.participants?.length || 0
      })));

      const participantConversations = await Conversation.find({
        "participants.userId": userId,
      }).lean();
      console.log("👥 [getConversations] Participant conversations found:", participantConversations.length);

      const mergedMap = new Map();
      [...guardConversations, ...applicantConversations, ...participantConversations].forEach((conv) => {
        mergedMap.set(conv._id.toString(), conv);
      });
      conversations = Array.from(mergedMap.values());
      console.log("✅ [getConversations] Total merged conversations:", conversations.length);
    } else {
      conversations = await Conversation.find({
        "participants.userId": userId,
      }).lean();
    }

    // Dynamically populate participants and lastMessage.senderId
    for (let conv of conversations) {
      // Populate participants
      for (let participant of conv.participants) {
        if (participant.role === "Admin" || participant.role === "Subadmin") {
          const user = await import("../models/User.model.js").then(m => m.default);
          participant.user = await user.findById(participant.userId, "name email role");
        } else if (participant.role === "Guard") {
          const guard = await import("../models/guard.model.js").then(m => m.default);
          participant.user = await guard.findById(participant.userId, "fullName email role");
        } else if (participant.role === "Applicant") {
          const applicant = await import("../models/applicant.model.js").then(m => m.default);
          participant.user = await applicant.findById(participant.userId, "name email phone isDeleted");
        }
      }

      // Populate lastMessage sender
      if (conv.lastMessage?.senderId) {
        const senderRole = conv.participants.find(
          p => p.userId.toString() === conv.lastMessage.senderId.toString()
        )?.role;

        if (senderRole === "Admin" || senderRole === "Subadmin") {
          const user = await import("../models/User.model.js").then(m => m.default);
          conv.lastMessage.sender = await user.findById(conv.lastMessage.senderId, "name email role");
        } else if (senderRole === "Guard") {
          const guard = await import("../models/guard.model.js").then(m => m.default);
          conv.lastMessage.sender = await guard.findById(conv.lastMessage.senderId, "fullName email role");
        } else if (senderRole === "Applicant") {
          const applicant = await import("../models/applicant.model.js").then(m => m.default);
          conv.lastMessage.sender = await applicant.findById(conv.lastMessage.senderId, "name email phone resume status");
        }
      }

      // Populate servingSubadmin if it exists
      if (conv.servingSubadmin?.userId) {
        const user = await import("../models/User.model.js").then(m => m.default);
        const servingUser = await user.findById(conv.servingSubadmin.userId, "name email role");
        if (servingUser) {
          conv.servingSubadmin.user = servingUser;
        }
      }
    }

    // Sort by lastMessage time descending
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : 0;
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
    const userId = req.user.id;

    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, seen: false },
      { $set: { seen: true } }
    );

    await Conversation.findByIdAndUpdate(conversationId, { "lastMessage.seen": true });

    req.io?.to(conversationId).emit("messages_seen", { conversationId, seenBy: userId });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error marking seen:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
