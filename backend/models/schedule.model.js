import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      required: [true, "Assigned guard is required"],
    },
    guardName: {
      type: String,
      ref: "Guard",
      required: [true, "Assigned guard is required"],
    },
    client: {
      type: String,
      required: [true, "Client name is required"],
    },
    deploymentLocation: {
      type: String,
      required: [true, "Deployment location is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    shiftType: {
      type: String,
      enum: ["Day Shift", "Night Shift"],
      required: [true, "Shift type is required"],
    },
    timeIn: {
      type: Date,
      required: [true, "Time in is required"],
    },
    timeOut: {
      type: Date,
      required: [true, "Time out is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
    isApproved: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
      required: [true, "Approval by Admin is required."],
    }
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
