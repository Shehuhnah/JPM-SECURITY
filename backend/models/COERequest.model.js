import mongoose from "mongoose";

const ApprovedCOESchema = new mongoose.Schema(
  {
    documentNumber: { type: String },
    issuedDate: { type: Date },
    issuedBy: { type: String },
    validUntil: { type: Date },
    position: { type: String },
    employmentStartDate: { type: String },
    employmentEndDate: { type: String },
    salary: { type: String },
    workSchedule: { type: String },
    adminComments: { type: String },
    pdfUrl: { type: String },
    qrCodeUrl: { type: String },
  },
  { _id: false }
);

const COERequestSchema = new mongoose.Schema(
  {
    guardId: { type: String, required: true, index: true },
    guardName: { type: String, required: true },
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending",
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    processedBy: { type: String },
    declineReason: { type: String },
    approvedCOE: ApprovedCOESchema,
  },
  { timestamps: true }
);

const COERequest = mongoose.model("COERequest", COERequestSchema);
export default COERequest;
