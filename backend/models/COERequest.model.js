import mongoose from "mongoose";

const ApprovedCOESchema = new mongoose.Schema(
  {
    documentNumber: { type: String },
    issuedDate: { type: Date },
    issuedBy: { type: String },
    validUntil: { type: Date },
    position: { type: String },
    salary: { type: Number },
    pdfUrl: { type: String },
  },
  { _id: false }
);

const COERequestSchema = new mongoose.Schema({
  guard: { type: mongoose.Schema.Types.ObjectId, ref: "Guard" },
  subadmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // <- add this
  purpose: { type: String, required: true },
  requesterRole: { type: String, enum: ["guard", "subadmin"], default: "guard" },
  status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending" },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: String },
  declineReason: { type: String },
  approvedCOE: ApprovedCOESchema,
}, { timestamps: true });



const COERequest = mongoose.model("COERequest", COERequestSchema);
export default COERequest;
