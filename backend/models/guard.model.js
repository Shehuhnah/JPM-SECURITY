import mongoose from "mongoose";

const guardSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    guardId: {
      type: String,
      required: [true, "Guard ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    position: {
      type: String,
      default: "Security Guard",
      enum: ["Security Guard", "Officer in Charge", "Inspector", "Head Operation"],
    },
    dutyStation: {
      type: String,
      required: [true, "Duty station is required"],
    },
    shift: {
      type: String,
      enum: ["Day Shift", "Night Shift", "Rotational"],
      required: [true, "Shift is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{10,11}$/, "Please enter a valid phone number"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true, // ✅ adds createdAt and updatedAt
  }
);

// Optional: Hide password when sending JSON
guardSchema.methods.toJSON = function () {
  const guard = this.toObject();
  delete guard.password;
  return guard;
};

const Guard = mongoose.model("Guard", guardSchema);

export default Guard;
