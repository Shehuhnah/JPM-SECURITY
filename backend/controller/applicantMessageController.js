import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Applicant from "../models/applicant.model.js";
import User from "../models/User.model.js"; // Import User model explicitly
import Guard from "../models/guard.model.js"; // Import Guard model explicitly


import { io, onlineUsersMap } from "../server.js";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toString) return value.toString();
  return String(value);
};

// This function needs to ensure that if an applicant conversation exists, it has an Admin/Subadmin participant.
// It will dynamically add one if missing.
const ensureHRParticipant = async (conversation) => {
  const hrParticipant = conversation.participants.some(p => p.role === "Admin" || p.role === "Subadmin");
  if (hrParticipant) return; // Already has an HR participant

  // Find any Subadmin first, then fallback to Admin
  let hrUser = await User.findOne({ role: "Subadmin" }, "_id name role");
  if (!hrUser) {
    hrUser = await User.findOne({ role: "Admin" }, "_id name role");
  }

  if (!hrUser) {
    throw new Error("No HR representative (Admin/Subadmin) available for applicant chat.");
  }

  conversation.participants.push({
    userId: hrUser._id,
    role: hrUser.role,
  });
  await conversation.save();
};

export const initApplicantConversation = async (req, res) => {
  try {
    const { name, email, phone, position } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Applicant name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).json({ message: "Applicant email is required." });
    }

    let applicant = await Applicant.findOne({ name: name.trim(), email: email?.trim() });
    if (!applicant) {
      applicant = await Applicant.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || "",
        position: position?.trim() || "Unknown",
        status: "Review",
      });
    }
    // Update missing/contact fields if provided
    const updates = {};
    if (phone?.trim() && phone.trim() !== (applicant.phone || "")) updates.phone = phone.trim();
    if (email?.trim() && email.trim() !== (applicant.email || "")) updates.email = email.trim();
    if (position?.trim() && position.trim() !== (applicant.position || "")) {
      updates.position = position.trim();
    } else if (!applicant.position) {
      updates.position = "Unknown";
    }
    if (Object.keys(updates).length) {
      applicant.set(updates);
      await applicant.save();
    }

    let conversation = await Conversation.findOne({
      type: { $in: ["admin-applicant", "applicant-admin", "subadmin-applicant", "applicant-subadmin"] },
      "participants.userId": applicant._id,
    });

    if (!conversation) {
      // Create conversation with type applicant-subadmin so subadmins can handle it
      console.log("🆕 [initApplicantConversation] Creating new conversation for applicant:", applicant._id);
      conversation = await Conversation.create({
        type: "applicant-subadmin",
        participants: [
          { userId: applicant._id, role: "Applicant" },
        ],
      });
      console.log("✅ [initApplicantConversation] Conversation created:", {
        id: conversation._id,
        type: conversation.type,
        participants: conversation.participants.length
      });
    } else {
      console.log("♻️ [initApplicantConversation] Using existing conversation:", {
        id: conversation._id,
        type: conversation.type
      });
    }

    // Ensure an HR participant is in the conversation
    await ensureHRParticipant(conversation);

    // Populate applicant participant for response
    const applicantParticipant = conversation.participants.find((p) => p.role === "Applicant");
    if (applicantParticipant) {
      applicantParticipant.user = {
        _id: applicant._id,
        name: applicant.name,
        email: applicant.email,
      };
    }

    console.log("📤 [initApplicantConversation] Returning conversation:", {
      id: conversation._id,
      type: conversation.type,
      participants: conversation.participants.length
    });

    return res.status(200).json({
      applicant: {
        _id: applicant._id,
        name: applicant.name,
        email: applicant.email,
      },
      conversation: conversation.toObject(),
    });
  } catch (err) {
    console.error("Error initializing applicant conversation:", err);
    res.status(500).json({ message: "Failed to start applicant conversation." });
  }
};

export const getApplicantMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { applicantId } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !["admin-applicant", "applicant-admin", "subadmin-applicant", "applicant-subadmin"].includes(conversation.type)) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    // If applicantId is provided, verify authorization
    if (applicantId) {
      const applicantParticipant = conversation.participants.find((p) => p.role === "Applicant");
      if (!applicantParticipant || normalizeId(applicantParticipant.userId) !== normalizeId(applicantId)) {
        return res.status(403).json({ message: "Not authorized for this conversation." });
      }
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching applicant messages:", err);
    res.status(500).json({ message: "Failed to fetch messages." });
  }
};

export const sendApplicantMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, applicantId, jobPosition } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const validTypes = ["admin-applicant", "applicant-admin", "subadmin-applicant", "applicant-subadmin"];
    if (!validTypes.includes(conversation.type)) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    // Convert old admin-applicant types to applicant-subadmin
    if (conversation.type === "admin-applicant" || conversation.type === "applicant-admin") {
      conversation.type = "applicant-subadmin";
      await conversation.save();
    }

    const applicantParticipant = conversation.participants.find((p) => p.role === "Applicant");
    if (!applicantParticipant) {
      return res.status(400).json({ message: "Conversation participants incomplete." });
    }

    if (normalizeId(applicantParticipant.userId) !== normalizeId(applicantId)) {
      return res.status(403).json({ message: "Not authorized for this conversation." });
    }

    const senderId = applicantParticipant.userId;
    const senderRole = "Applicant";
    // Ensure there is an HR participant (Subadmin or Admin)
    await ensureHRParticipant(conversation);

    let receiverHR = conversation.participants.find(p => p.role === "Subadmin" || p.role === "Admin");
    let receiverId = receiverHR?.userId || senderId; // Fallback to sender if no HR found (shouldn't happen with ensureHRParticipant)
    let receiverRole = receiverHR?.role || "Applicant";

    // Map roles to model names for refPath
    const senderModel = "Applicant";
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
      messageData.file = "/uploads/messages/" + req.file.filename; // Correct path
      messageData.fileName = req.file.originalname;
    }

    const message = await Message.create(messageData);

    // If a job position is provided (from forwarded post), update applicant's position
    try {
      if (jobPosition && typeof jobPosition === "string" && jobPosition.trim()) {
        await Applicant.findByIdAndUpdate(senderId, { position: jobPosition.trim() });
      }
    } catch (e) {
      console.error("Failed to update applicant position:", e);
    }

    // If applicant uploaded a file, save it as resume reference
    if (req.file) {
      try {
        await Applicant.findByIdAndUpdate(senderId, {
          resume: {
            file: messageData.file,
            fileName: messageData.fileName,
          },
        });
      } catch (e) {
        console.error("Failed to update applicant resume:", e);
      }
    }

    conversation.lastMessage = {
      text: text || (req.file ? "Sent an attachment" : ""),
      senderId,
      senderRole: senderRole,
      createdAt: new Date(),
      seen: false,
    };
    await conversation.save();

    // Populate participants before emitting
    const populateParticipants = async (participants) => {
        const populated = [];
        for (let participant of participants) {
            let userDoc = null;
            if (participant.role === "Admin" || participant.role === "Subadmin") {
                userDoc = await User.findById(participant.userId, "name email role");
            } else if (participant.role === "Guard") {
                userDoc = await Guard.findById(participant.userId, "fullName email role");
            } else if (participant.role === "Applicant") {
                userDoc = await Applicant.findById(participant.userId, "name email phone isDeleted");
            }
            if (userDoc) {
                populated.push({ ...participant.toObject(), user: userDoc });
            } else {
                populated.push(participant.toObject());
            }
        }
        return populated;
    }

    const populatedConversation = {
        ...conversation.toObject(),
        participants: await populateParticipants(conversation.participants)
    };

    // Emit to sender and receiver
    const recipients = [senderId.toString(), receiverId.toString()];
    for (const id of recipients) {
      const socketId = onlineUsersMap[id];
      if (!socketId) continue;

      let senderUser;
      if (senderRole === "Applicant") {
        senderUser = await Applicant.findById(senderId, "name email resume status");
      }
      io.to(socketId).emit("receiveMessage", { ...message.toObject(), senderUser });
      io.to(socketId).emit("conversationUpdated", populatedConversation);
    }

    // Notify all subadmins and admins that an applicant has sent a message
    const allHrUsers = await User.find({ $or: [{ role: "Subadmin" }, { role: "Admin" }] }, "_id");
    for (const hrUser of allHrUsers) {
      const hrSocketId = onlineUsersMap[normalizeId(hrUser._id)];
      if (hrSocketId && !recipients.includes(normalizeId(hrUser._id))) { // Avoid double-emitting
        let senderUser = await Applicant.findById(senderId, "name email resume status");
        io.to(hrSocketId).emit("conversationUpdated", populatedConversation);
        io.to(hrSocketId).emit("receiveMessage", { ...message.toObject(), senderUser });
      }
    }

    res.status(201).json({ message: message.toObject(), conversation: populatedConversation });
  } catch (err) {
    console.error("Error sending applicant message:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
};

