import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    audience: {
      type: String,
      enum: ["all", "guards", "subadmin", "applicants"],
      default: "all",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin or subadmin who posted
      required: true,
    },
    file: { type: String }, // optional: store filename or URL
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
