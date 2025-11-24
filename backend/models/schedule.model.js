import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      required: true,
    },

    // NEW FIELD
    batchId: {
      type: String,
      required: false, 
      // index: true,
    },

    client: String,
    deploymentLocation: String,
    position: String,
    shiftType: {
      type: String,
      enum: ["Day Shift", "Night Shift"],
    },

    timeIn: Date,
    timeOut: Date,

    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },

    isApproved: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
    },

    remarks: String,
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
