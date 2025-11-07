import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", // or "Admin"/"Subadmin"/"Applicant" depending on your structure
      required: true 
    },
    receiverId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    senderRole: { 
      type: String, 
      enum: ["Admin", "Subadmin", "Applicant"], 
      required: true 
    },
    receiverRole: { 
      type: String, 
      enum: ["Admin", "Subadmin", "Applicant"], 
      required: true 
    },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
