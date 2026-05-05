import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Subadmin"],
      required: true,
    },
    accessLevel: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    position: { type: String },
    contactNumber: { type: String },
    photo: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    status: { type: String, default: "active" },
    lastLogin: { type: Date },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    otp: String,
    otpExpire: Date,
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔍 Compare entered password to hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
