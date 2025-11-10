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

    // Find or create conversation
    let conversation = await Conversation.findOne({
      type,
      "participants.userId": { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type,
        participants: [
          { userId: senderId, role: senderRole },
          { userId: receiverId, role: receiverRole },
        ],
      });
    }

    // Create message
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
      createdAt: new Date(),
      seen: false,
    };
    await conversation.save();

    // Emit updates
    [senderId, receiverId].forEach((id) => {
      const socketId = onlineUsersMap[id];
      if (socketId) {
        io.to(socketId).emit("receiveMessage", message);
        io.to(socketId).emit("conversationUpdated", conversation);
      }
    });

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
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .populate("participants.userId", "name email role")
      .lean();

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
