import mongoose from "mongoose";

const ApprovedCOESchema = new mongoose.Schema(
  {
    documentNumber: { type: String },
    issuedDate: { type: Date },
    issuedBy: { type: String },
    validUntil: { type: Date },
    position: { type: String },
    salary: { type: Number },
    signatory: { type: String },
    signatoryTitle: { type: String },
    signatureDataUrl: { type: String },
    employmentStartDate: { type: String },
    employmentEndDate: { type: String },
    workSchedule: { type: String },
    adminComments: { type: String },
    qrCodeUrl: { type: String },
    pdfUrl: { type: String },
  },
  { _id: false }
);

const COERequestSchema = new mongoose.Schema({
  guard: { type: mongoose.Schema.Types.ObjectId, ref: "Guard" },
  subadmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  purpose: { type: String, required: true },
  requesterRole: { type: String, enum: ["guard", "subadmin", "admin"], default: "guard" },
  status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending" },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: String },
  declineReason: { type: String },
  approvedCOE: ApprovedCOESchema,
}, { timestamps: true });



const COERequest = mongoose.model("COERequest", COERequestSchema);
export default COERequest;
