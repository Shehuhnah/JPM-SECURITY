import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Applicant from "../models/applicant.model.js";

import { io, onlineUsersMap } from "../server.js";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toString) return value.toString();
  return String(value);
};

const ensureAdminParticipant = async (conversation) => {
  const hasAdmin = conversation.participants.some((p) => p.role === "Admin");
  if (hasAdmin) return;
  const userModel = await import("../models/User.model.js").then((m) => m.default);
  const admin = await userModel.findOne({ role: "Admin" }, "name role");
  if (!admin) {
    throw new Error("No admin available for applicant chat.");
  }
  conversation.participants.push({
    userId: admin._id,
    role: "Admin",
  });
  await conversation.save();
};

export const initApplicantConversation = async (req, res) => {
  try {
    const { name, email, phone, position } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Applicant name is required." });
    }

    let applicant = await Applicant.findOne({ name: name.trim(), email: email?.trim() });
    if (!applicant) {
      applicant = await Applicant.create({
        name: name.trim(),
        email: email?.trim(),
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

    console.log("📨 [sendApplicantMessage] Received request:", {
      conversationId,
      applicantId,
      hasText: !!text,
      hasFile: !!req.file
    });

    const conversation = await Conversation.findById(conversationId);
    console.log("🔍 [sendApplicantMessage] Conversation found:", {
      exists: !!conversation,
      type: conversation?.type,
      participants: conversation?.participants?.length || 0
    });

    if (!conversation) {
      console.error("❌ [sendApplicantMessage] Conversation not found with ID:", conversationId);
      return res.status(404).json({ message: "Conversation not found." });
    }

    // Check if conversation type is valid (including legacy types)
    const validTypes = ["admin-applicant", "applicant-admin", "subadmin-applicant", "applicant-subadmin"];
    if (!validTypes.includes(conversation.type)) {
      console.error("❌ [sendApplicantMessage] Invalid conversation type:", conversation.type);
      return res.status(404).json({ message: "Conversation not found." });
    }

    // Convert old admin-applicant types to applicant-subadmin
    if (conversation.type === "admin-applicant" || conversation.type === "applicant-admin") {
      console.log("🔄 [sendApplicantMessage] Converting conversation type from", conversation.type, "to applicant-subadmin");
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
    // Ensure there is an HR participant (prefer Subadmin; fallback to Admin)
    let subadminParticipant = conversation.participants.find((p) => p.role === "Subadmin");
    let adminParticipant = conversation.participants.find((p) => p.role === "Admin");

    let receiverId = subadminParticipant?.userId || adminParticipant?.userId;
    let receiverRole = subadminParticipant ? "Subadmin" : (adminParticipant ? "Admin" : null);

    if (!receiverId) {
      try {
        // Try to attach a Subadmin
        const userModel = await import("../models/User.model.js").then((m) => m.default);
        const anySubadmin = await userModel.findOne({ role: "Subadmin" }, "_id name role");
        if (anySubadmin) {
          conversation.participants.push({ userId: anySubadmin._id, role: "Subadmin", user: anySubadmin });
          receiverId = anySubadmin._id;
          receiverRole = "Subadmin";
        } else {
          // Fallback: ensure there is at least one Admin participant
          await ensureAdminParticipant(conversation);
          adminParticipant = conversation.participants.find((p) => p.role === "Admin");
          receiverId = adminParticipant?.userId;
          receiverRole = "Admin";
        }
        await conversation.save();
      } catch (e) {
        console.error("Failed ensuring HR participant:", e);
      }
    }

    const messageData = {
      conversationId: conversation._id,
      senderId,
      receiverId: receiverId || senderId, // Fallback if no receiver yet
      text: text || "",
      sender: { userId: senderId, role: "Applicant" },
      receiver: { userId: receiverId || senderId, role: receiverRole || (subadminParticipant ? "Subadmin" : "Admin") },
    };

    if (req.file) {
      messageData.file = "/uploads/" + req.file.filename;
      messageData.fileName = req.file.originalname;
    }

    const message = await Message.create(messageData);

    // If a job position is provided (from forwarded post), update applicant's position
    try {
      if (jobPosition && typeof jobPosition === "string" && jobPosition.trim()) {
        const applicantDoc = await import("../models/applicant.model.js").then(m => m.default);
        await applicantDoc.findByIdAndUpdate(senderId, { position: jobPosition.trim() });
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
      senderRole: "Applicant",
      createdAt: new Date(),
      seen: false,
    };
    // Populate lastMessage.sender with Applicant user details for front-end name fallback
    try {
      const applicantUser = await Applicant.findById(senderId, "name email resume status");
      if (applicantUser) {
        conversation.lastMessage.sender = applicantUser;
      }
    } catch (e) {
      console.error("Failed populating lastMessage.sender (applicant):", e);
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

    const recipients = [senderId.toString(), receiverId.toString()];
    for (const id of recipients) {
      const socketId = onlineUsersMap[id];
      if (!socketId) continue;

      // Include senderUser similar to other flows for consistent client handling
      const senderUser = await Applicant.findById(senderId, "name email resume status");
      io.to(socketId).emit("receiveMessage", { ...message.toObject(), senderUser });
      io.to(socketId).emit("conversationUpdated", conversation.toObject());
    }

    // Notify all subadmins and admins that an applicant has sent a message
    try {
      const userModel = await import("../models/User.model.js").then((m) => m.default);
      const subadmins = await userModel.find({ role: "Subadmin" }, "_id");
      for (const subadmin of subadmins) {
        const subadminSocket = onlineUsersMap[normalizeId(subadmin._id)];
        if (subadminSocket) {
          const senderUser = await Applicant.findById(senderId, "name email resume status");
          io.to(subadminSocket).emit("conversationUpdated", conversation.toObject());
          io.to(subadminSocket).emit("receiveMessage", { ...message.toObject(), senderUser });
        }
      }
      
      const admins = await userModel.find({ role: "Admin" }, "_id");
      for (const admin of admins) {
        const adminSocket = onlineUsersMap[normalizeId(admin._id)];
        if (adminSocket) {
          const senderUser = await Applicant.findById(senderId, "name email resume status");
          io.to(adminSocket).emit("conversationUpdated", conversation.toObject());
          io.to(adminSocket).emit("receiveMessage", { ...message.toObject(), senderUser });
        }
      }
    } catch (e) {
      console.error("Failed broadcasting applicant message to subadmins/admins:", e);
    }

    res.status(201).json({ message: message.toObject(), conversation: conversation.toObject() });
  } catch (err) {
    console.error("Error sending applicant message:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
};

