import mongoose from "mongoose";

const adminReportSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAttendance",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdminReport", adminReportSchema);
