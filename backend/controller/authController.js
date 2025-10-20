import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

export const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    accessLevel,
    position,
    contactNumber,
  } = req.body;

  try {
    // 🔍 Check if admin already exists
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // ✅ Create new admin
    const admin = await User.create({
      name,
      email,
      password,
      role,
      accessLevel,
      position,
      contactNumber,
    });

    // 🔐 Respond with token and essential details
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accessLevel: admin.accessLevel,
      token: generateToken(admin._id, admin.role),
    });
  } catch (err) {
    console.error("Error registering admin:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔍 Check if admin exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🔐 Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🧠 Generate JWT token
    const token = generateToken(user._id, user.role);

    // ✅ Return clean response
    res.json({
      token,
      admin: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessLevel: user.accessLevel,
        position: user.position,
        contactNumber: user.contactNumber,
        status: user.status,
        lastLogin: user.lastLogin,
      },
    });

    // 🕓 Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: err.message });
  }
};