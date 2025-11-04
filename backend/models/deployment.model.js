import mongoose from "mongoose";

const deploymentSchema = new mongoose.Schema(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    post: {
      type: String,
      required: true,
    },
    shift: {
      type: String,
      enum: ["Day Shift", "Night Shift", "Rotational"],
      required: true,
    },
    type: {
      type: String,
      enum: ["Regular", "Reliever", "Special Duty"],
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Deployment", deploymentSchema);
