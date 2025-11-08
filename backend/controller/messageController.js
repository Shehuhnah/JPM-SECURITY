import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverRole, text, type } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    // ✅ Find or create conversation
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

    // ✅ Create message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      text,
      sender: { userId: senderId, role: senderRole },
      receiver: { userId: receiverId, role: receiverRole },
    });

    // ✅ Update last message in conversation
    conversation.lastMessage = {
      text,
      senderId,
      createdAt: new Date(),
      seen: false,
    };
    await conversation.save();

    // ✅ Populate the conversation with user data before responding
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants.userId", "name email role")
      .lean();

    res.status(201).json({
      message,
      conversation: populatedConversation,
    });
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

// ✅ Get Conversations sorted by last message
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch conversations for this user
    let conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .populate("participants.userId", "name email role") // populate participants
      .lean(); // convert to plain JS objects for easier sorting

    // Sort by lastMessage.createdAt descending
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA; // newest first
    });

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: err.message });
  }
};

// Mark all messages as seen
export const markMessagesAsSeen = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  try {
    const result = await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, seen: false },
      { $set: { seen: true } }
    );

    // Mark conversation’s last message as seen too
    await Conversation.findByIdAndUpdate(conversationId, {
      "lastMessage.seen": true,
    });

    // Notify other users via socket
    req.io?.to(conversationId).emit("messages_seen", {
      conversationId,
      seenBy: userId,
    });

    res.status(200).json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    console.error("Error marking as seen:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
