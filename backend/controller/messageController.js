import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverRole, text, type } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      type,
      "participants.userId": { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      if (!receiverRole) {
        throw new Error("receiverRole is required to create conversation");
      }

      conversation = await Conversation.create({
        type,
        participants: [
          { userId: senderId, role: senderRole },
          { userId: receiverId, role: receiverRole }, // must be string: "Admin" or "Subadmin"
        ],
      });
    }


    if (!conversation) {
      conversation = await Conversation.create({
        type,
        participants: [
          { userId: senderId, role: senderRole },
          { userId: receiverObjectId, role: receiverRole },
        ],
      });
    }

    // ✅ Create message with nested sender/receiver
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      text,
      sender: { userId: senderId, role: senderRole },
      receiver: { userId: receiverId, role: receiverRole },
    });

    conversation.lastMessage = text;
    await conversation.save();

    res.status(201).json(message);
  } catch (err) {
    console.error("Convo error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate("sender.userId", "name role")   // populate sender
      .populate("receiver.userId", "name role") // populate receiver
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

// ✅ Get Conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      "participants.userId": userId
    })
      .populate("participants.userId", "name email role") // Now works for both Admin and Subadmin
      .sort({ updatedAt: -1 });

    res.json(conversations); // Always returns array
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
