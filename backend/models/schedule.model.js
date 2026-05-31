import mongoose from "mongoose";

const batchMetaSchema = new mongoose.Schema(
  {
    scopeType: {
      type: String,
      enum: ["single", "count", "custom"],
      default: "single",
    },
    anchorMonth: String,
    monthCount: Number,
    coveredMonths: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

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
      enum: ["Day Shift", "Night Shift", "Straight Shift"],
    },

    timeIn: String,
    timeOut: String,

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

    batchMeta: {
      type: batchMetaSchema,
      default: undefined,
    },

    remarks: String,
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
