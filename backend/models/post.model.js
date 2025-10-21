import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: "ADMIN",
    },
  },
  { timestamps: true } // Automatically adds createdAt, updatedAt
);

export default mongoose.model("Post", postSchema);
