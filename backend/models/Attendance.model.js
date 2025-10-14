import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // references guard user
      required: true,
    },
    date: { type: Date, required: true },
    timeIn: { type: String },
    timeOut: { type: String },
    location: { type: String },
    status: {
      type: String,
      enum: ["On Duty", "Off Duty", "Absent"],
      default: "Off Duty",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
