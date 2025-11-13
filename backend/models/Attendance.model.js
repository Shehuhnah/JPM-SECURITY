import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // Reference to the guard's user record
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      required: true,
    },

    // --- Basic Guard Info (snapshot at time-in) ---
    guardName: { type: String, required: true },
    guardId: { type: String }, // could be employee or internal guard ID
    position: { type: String },
    shift: { type: String },
    dutyStation: { type: String },
    email: { type: String },
    phoneNumber: { type: String },

    // --- Attendance Details ---
    date: { type: String, required: true }, // from toLocaleDateString()
    timeIn: { type: String },
    timeOut: { type: String },
    status: {
      type: String,
      enum: ["On Duty", "Off Duty", "Absent"],
      default: "Off Duty",
    },

    // --- Location and Evidence ---
    location: { type: Object }, // you can store lat/lng or address
    siteAddress: { type: String },
    photo: { type: String }, // base64 or image URL
    submittedAt: { type: String }, // local date-time string

  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
