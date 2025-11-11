import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is Required"]
    },
    email: {
      type: String
    },
    position: { 
      type: String, 
      required: [true, "Position is Required"]
    },
    phone: String,
    resume: {
      file: { type: String },
      fileName: { type: String },
    },
    status: {
      type: String,
      enum: ["Review", "Interview", "Hired", "Declined"],
      default: "Review",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Applicant", applicantSchema);
