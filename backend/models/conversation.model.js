import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["admin-subadmin", "applicant-subadmin"],
      required: true,
    },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "participants.role" },
        role: {
          type: String,
          enum: ["Admin", "Subadmin", "Applicant"],
          required: true,
        },
      },
    ],
    lastMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
