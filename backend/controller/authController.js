import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Guard from "../models/guard.model.js";

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

export const loginGuard = async (req, res) => {
  const { email, password } = req.body;

  try {
    const guard = await Guard.findOne({ email, role: "Guard" });
    if (!guard) {
      return res.status(400).json({ message: "Invalid Email Address" });
    }

    const isMatch = await guard.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = generateToken(guard._id, guard.role);

    res.json({
      success: true,
      message: "Login successful",
      token,
      guard: {
        _id: guard._id,
        fullName: guard.fullName,
        email: guard.email,
        role: guard.role,
        guardId: guard.guardId,
        address: guard.address,
        position: guard.position,
        dutyStation: guard.dutyStation,
        shift: guard.shift,
        phoneNumber: guard.phoneNumber,
        SSSID: guard.SSSID,
        PhilHealthID: guard.PhilHealthID,
        PagibigID: guard.PagibigID,
        EmergencyPerson: guard.EmergencyPerson,
        EmergencyContact: guard.EmergencyContact,
        status: guard.status,
        lastLogin: guard.lastLogin,
        createdAt: guard.createdAt,
        updatedAt: guard.updatedAt,
      },
    });

    guard.lastLogin = new Date();
    await guard.save();
  } catch (err) {
    console.error("Guard login error:", err.message);
    res.status(500).json({ message: "Server error logging in guard." });
  }
};

// 🔹 Get all Subadmins (for Admin) FOR CONVERSATION
export const getSubadmins = async (req, res) => {
  try {
    const subadmins = await User.find({ role: "Subadmin" }).select(
      "name email role"
    );
    res.json(subadmins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Get all Admins (for Subadmin) FOR CONVERSATION
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "Admin" }).select(
      "name email role"
    );
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Get all Guards (for Subadmin) FOR CONVERSATION
export const getGuards = async (req, res) => {
  try {
    const guards = await Guard.find({ role: "Guard" }).select(
      "fullName email role guardId dutyStation shift status"
    );
    res.json(guards);
  } catch (err) {
    console.error("Error fetching guards:", err.message);
    res.status(500).json({ message: "Server error fetching guards" });
  }
};