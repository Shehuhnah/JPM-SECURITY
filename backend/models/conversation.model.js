import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Admin", 
        },
        role: {
          type: String,
          enum: ["Admin", "Subadmin"],
          required: true,
        },
      },
    ],
    type: {
      type: String,
      enum: ["admin-subadmin","subadmin-admin", "subadmin-applicant"],
      required: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
