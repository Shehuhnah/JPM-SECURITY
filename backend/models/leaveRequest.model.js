import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    requesterRole: {
      type: String,
      enum: ["Guard", "Subadmin", "Admin"],
      required: true,
    },
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
      default: null,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    dates: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one leave date is required.",
      },
    },
    startDate: {
      type: String,
      default: "",
      trim: true,
    },
    endDate: {
      type: String,
      default: "",
      trim: true,
    },
    excludedDates: {
      type: [String],
      default: [],
    },
    leaveType: {
      type: String,
      enum: ["Sick Leave", "Vacation Leave", "Paternity Leave", "Maternity Leave"],
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Declined", "Revoked"],
      default: "Pending",
    },
    reviewRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokeReason: {
      type: String,
      default: "",
      trim: true,
    },
    editHistory: {
      type: [
        {
          editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
          editedAt: { type: Date, default: Date.now },
          editReason: { type: String, trim: true },
          previousDates: { type: [String] },
          previousStartDate: { type: String },
          previousEndDate: { type: String },
          previousLeaveType: { type: String },
          previousReason: { type: String },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ requesterRole: 1, guard: 1, staff: 1, status: 1 });
leaveRequestSchema.index({ dates: 1, status: 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
