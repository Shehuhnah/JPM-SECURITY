import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Admin", // You can also change to a dynamic ref if needed
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
      enum: ["admin-subadmin", "subadmin-admin", "subadmin-applicant"],
      required: true,
    },

    // ✅ Updated lastMessage to store an object
    lastMessage: {
      text: { type: String, default: "" },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      createdAt: { type: Date, default: null },
      seen: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
