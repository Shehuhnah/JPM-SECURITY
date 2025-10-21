import mongoose from "mongoose";

const hiringSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      default: "ADMIN",
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: String, 
      required: true,
    },
    time: {
      type: String, 
      required: true,
    },
  },
  { timestamps: true } 
);

export default mongoose.model("Hiring", hiringSchema);
