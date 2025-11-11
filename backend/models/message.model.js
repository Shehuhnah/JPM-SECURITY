import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },

    sender: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "sender.role" },
      role: { type: String, enum: ["Admin", "Subadmin", "Guard", "Applicant"], required: true },
    },
    receiver: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "receiver.role" },
      role: { type: String, enum: ["Admin", "Subadmin", "Guard", "Applicant"], required: true },
    },

    text: { type: String },
    image: { type: String },
    file: { type: String },
    fileName: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
