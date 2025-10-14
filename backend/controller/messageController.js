import Message from "../models/Message.model.js";

// ✅ GET all messages (admin/subadmin)
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "name role")
      .populate("receiver", "name role");
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET messages between two users
export const getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const conversation = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ POST send a message
export const sendMessage = async (req, res) => {
  try {
    const { receiver, message } = req.body;
    const sender = req.user._id;

    const newMessage = await Message.create({ sender, receiver, message });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ DELETE message
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
