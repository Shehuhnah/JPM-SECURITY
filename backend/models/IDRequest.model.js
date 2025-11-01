import mongoose from "mongoose";

const IDRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      required: [true, "Request type is required."],
      trim: true,
    },
    
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      required: true,
    },

    requestReason: {
      type: String,
      required: [true, "Request reason is required."],
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
    },

    pickupDate: {
      type: Date,
      default: null,
    },

    adminRemarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const IDRequest = mongoose.model("IDRequest", IDRequestSchema);
export default IDRequest;
