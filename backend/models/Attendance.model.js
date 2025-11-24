import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      required: true,
    },

    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },

    timeIn: { type: Date },
    timeOut: { type: Date },
    status: {
      type: String,
      enum: ["On Duty", "Off Duty", "Absent"],
      default: "Off Duty",
    },

    location: { type: Object },
    photo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
