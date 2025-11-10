import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    sender: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
      role: { type: String, enum: ["Admin", "Subadmin"], required: true },
    },
    receiver: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
      role: { type: String, enum: ["Admin", "Subadmin"], required: true },
    },

    text: { type: String },
    image: { type: String }, // e.g. "/uploads/messages/1731001-photo.png"
    file: { type: String },  // e.g. "/uploads/messages/1731002-document.pdf"
    fileName: { type: String }, // optional, for display in frontend

    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
