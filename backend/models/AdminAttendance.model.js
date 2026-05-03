import mongoose from "mongoose";

const adminAttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    timeIn: {
      type: Date,
      required: true,
    },
    timeOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Timed In", "Timed Out"],
      default: "Timed In",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

adminAttendanceSchema.index({ user: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("AdminAttendance", adminAttendanceSchema);
