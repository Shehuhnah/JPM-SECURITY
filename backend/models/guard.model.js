import mongoose from "mongoose";

const guardSchema = new mongoose.Schema(
  {
    guardName: {
      type: String,
      required: true,
      trim: true,
    },
    guardId: {
      type: Number,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    hiringDate: {
      type: Date,
      required: true,
    },
    tenure: {
      type: String,
      default: "0 years",
    },
    position: {
      type: String,
      required: true,
      default: "Security Guard",
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive", "On Leave", "Terminated"],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      match: [/^\d{10,15}$/, "Invalid contact number"], // optional validation
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, "Invalid email format"],
    },
  },
  { timestamps: true }
);

// Optional: Pre-save hook to calculate tenure automatically
guardSchema.pre("save", function (next) {
  if (this.hiringDate) {
    const today = new Date();
    const diff = today.getFullYear() - this.hiringDate.getFullYear();
    this.tenure = `${diff} year${diff !== 1 ? "s" : ""}`;
  }
  next();
});

const Guard = mongoose.model("Guard", guardSchema);

export default Guard;
