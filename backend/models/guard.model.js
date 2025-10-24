import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    role: {
      type: String,
      default: "Guard",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

guardSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

guardSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

guardSchema.methods.toJSON = function () {
  const guard = this.toObject();
  delete guard.password;
  return guard;
};

const Guard = mongoose.model("Guard", guardSchema);
export default Guard;
