import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    guardId: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }, //  Hash in production!
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
