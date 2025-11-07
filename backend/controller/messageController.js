import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

// 🔹 Create or continue a conversation
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverRole, text, type } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    // 🔹 Find or create conversation
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

    // 🔹 Create message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      senderRole,
      receiverId,
      receiverRole,
      text,
    });

    conversation.lastMessage = text;
    await conversation.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Get messages by conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName role")
      .populate("receiverId", "fullName role");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query; // e.g. ?type=admin-subadmin

    const filter = { "participants.userId": userId };
    if (type) filter.type = type;

    const conversations = await Conversation.find(filter)
      .populate("participants.userId", "fullName email role")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

