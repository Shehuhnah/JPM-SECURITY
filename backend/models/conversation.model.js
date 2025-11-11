import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "participants.role" // dynamic ref based on role
        },
        role: {
          type: String,
          enum: ["Admin", "Subadmin", "Guard", "Applicant"],
          required: true,
        },
      },
    ],

    type: {
      type: String,
      enum: [
        "admin-subadmin",
        "subadmin-admin",
        "subadmin-guard",
        "guard-subadmin",
        "admin-applicant",
        "applicant-admin",
        "subadmin-applicant",
        "applicant-subadmin",
      ],
      required: true,
    },

    lastMessage: {
      text: { type: String, default: "" },
      senderId: { type: mongoose.Schema.Types.ObjectId, refPath: "lastMessage.senderRole", default: null },
      senderRole: { type: String, enum: ["Admin", "Subadmin", "Guard", "Applicant"], default: null },
      createdAt: { type: Date, default: null },
      seen: { type: Boolean, default: false },
    },

    // Track which subadmin is currently serving/assisting this guard conversation
    servingSubadmin: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
