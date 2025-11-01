import mongoose from "mongoose";

const logbookSchema = new mongoose.Schema(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard", // references the Guard who made the entry
      required: true,
    },
    post: {
      type: String,
      required: [true, "Post is required"], // e.g., "Gate 1", "Lobby", etc.
      trim: true,
    },
    shift: {
      type: String,
      enum: ["Day Shift", "Night Shift", "Rotational"],
      required: [true, "Shift is required"],
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
  { timestamps: true } // adds createdAt and updatedAt automatically
);

const Logbook = mongoose.model("Logbook", logbookSchema);
export default Logbook;
