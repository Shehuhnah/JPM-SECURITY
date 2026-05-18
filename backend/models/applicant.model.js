import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
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
    address: {
      type: String,
      trim: true,
      default: "",
    },
    applicationType: {
      type: String,
      enum: ["Walk-in", "Online"],
      default: "Online",
    },
    resume: {
      file: { type: String },
      fileName: { type: String },
    },
    status: {
      type: String,
      enum: ["Review", "Interview", "Hired", "Declined"],
      default: "Review",
    },
    dateOfHired: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateOfInterview: {
      type: Date,
    },
    interviewRemarks: {
      type: String,
      default: ''
    },
    declinedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    declinedDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Applicant", applicantSchema);
