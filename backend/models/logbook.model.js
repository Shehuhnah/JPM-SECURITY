import mongoose from "mongoose";

const logbookSchema = new mongoose.Schema(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      required: true,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
    post: {
      type: String,
      required: true,
      trim: true,
    },
    shift: {
      type: String,
      enum: ["Day Shift", "Night Shift", "Rotational"],
      required: true,
    },
    type: {
      type: String,
      required: [true, "Log type is required"],
      trim: true,
    },
    remarks: {
      type: String,
      required: [true, "Remarks are required"],
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } 
);

const Logbook = mongoose.model("Logbook", logbookSchema);
export default Logbook;
