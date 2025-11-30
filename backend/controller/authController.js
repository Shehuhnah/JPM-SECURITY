import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Guard from "../models/guard.model.js";

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

// REGISTER ADMIN/SUBADMIN
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
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role,
      accessLevel,
      position,
      contactNumber,
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accessLevel: admin.accessLevel,
    });
  } catch (err) {
    console.error("Error registering admin:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// LOGIN USER (ADMIN/SUBADMIN)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
      domain: process.env.DOMAIN_URL || "localhost",
      path: "/",
    });

    user.lastLogin = new Date();
    await user.save();
    res.json({ admin: user.toJSON() });
    
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,      
    sameSite: "none",
    domain: process.env.DOMAIN_URL || "localhost",
    path: "/",      
  });

  return res.json({ message: "Logged out successfully" });
};

export const guardChangePassword = async (req, res) => {
  const { guardId, newPassword } = req.body;

  try {
    const guard = await Guard.findById(guardId);
    if (!guard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    guard.password = newPassword;
    guard.isFirstLogin = false;
    await guard.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing guard password:", err);
    res.status(500).json({ message: "Server error changing password" });
  }
};

// LOGIN GUARD
export const loginGuard = async (req, res) => {
  const { email, password } = req.body;

  try {
    const guard = await Guard.findOne({ email, role: "Guard" });
    if (!guard) return res.status(400).json({ message: "Invalid Email Address" });

    const isMatch = await guard.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = generateToken(guard._id, guard.role);
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,       
      sameSite: "none",  
      maxAge: 1000 * 60 * 60 * 24,
      domain: process.env.DOMAIN_URL || "localhost",
      path: "/",
    });

    // update last login
    guard.lastLogin = new Date();
    await guard.save();
    res.json({ guard: guard.toJSON() });

  } catch (err) {
    console.error("Guard login error:", err.message);
    res.status(500).json({ message: "Server error logging in guard." });
  }
};

// GET CURRENT LOGGED-IN USER
export const getMe = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try finding admin/subadmin first
    let user = await User.findById(decoded.id).select("-password");
    // If not found, try guard
    if (!user) {
      user = await Guard.findById(decoded.id).select("-password");
    }

    if (!user) return res.status(401).json({ message: "User not found" });

    res.json(user.toJSON());
  } catch (err) {
    console.error("Error in /me:", err);
    res.status(401).json({ message: "Not authenticated" });
  }
};

// CONVERSATION FETCHING
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

export const getGuards = async (req, res) => {
  try {
    const guards = await Guard.find({ role: "Guard" }).select(
      "fullName email guardId phoneNumber address position status" // Removed dutyStation and shift
    );
    res.json(guards);
  } catch (err) {
    console.error("Error fetching guards:", err.message);
    res.status(500).json({ message: "Server error fetching guards" });
  }
};
