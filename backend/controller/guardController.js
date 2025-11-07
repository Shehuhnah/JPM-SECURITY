import Guard from "../models/guard.model.js";
import bcrypt from "bcryptjs";

// Get all guards
export const getAllGuards = async (req, res) => {
  try {
    const guards = await Guard.find().sort({ createdAt: -1 });
    res.status(200).json(guards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guards", error: error.message });
  }
};

// Get guard by ID
export const getGuardById = async (req, res) => {
  try {
    const guard = await Guard.findById(req.params.id);
    if (!guard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    res.status(200).json(guard);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guard", error: error.message });
  }
};

// Create new guard
export const createGuard = async (req, res) => {
  try {
    const newGuard = new Guard(req.body);
    await newGuard.save();
    res.status(201).json({ message: "Guard created successfully", guard: newGuard });
  } catch (error) {
    res.status(400).json({ message: "Error creating guard", error: error.message });
  }
};

// Update guard
export const updateGuard = async (req, res) => {
  try {
    const updatedGuard = await Guard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedGuard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    res.status(200).json({ message: "Guard updated successfully", guard: updatedGuard });
  } catch (error) {
    res.status(400).json({ message: "Error updating guard", error: error.message });
  }
};

// Delete guard
export const deleteGuard = async (req, res) => {
  try {
    const deletedGuard = await Guard.findByIdAndDelete(req.params.id);
    if (!deletedGuard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    res.status(200).json({ message: "Guard deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting guard", error: error.message });
  }
};

// GET /api/guards/me
export const getGuardInfo = async (req, res) => {
  try {
    const guard = await Guard.findById(req.user.id).select("-password");
    if (!guard)
      return res.status(404).json({ success: false, message: "Guard not found" });

    res.status(200).json({ success: true, data: guard });
  } catch (error) {
    console.error("Error fetching guard info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/guards/me
export const updateGuardProfile = async (req, res) => {
  try {
    console.log("🛠 Incoming request body:", req.body);
    console.log("🔐 Authenticated user:", req.user);

    const guard = await Guard.findById(req.user.id);
    if (!guard) {
      console.log("❌ Guard not found");
      return res.status(404).json({ success: false, message: "Guard not found." });
    }

    const { fullName, address, phoneNumber, currentPassword, newPassword } = req.body;

    if (fullName) guard.fullName = fullName;
    if (address) guard.address = address;
    if (phoneNumber) guard.phoneNumber = phoneNumber;

    if (newPassword) {
      console.log("🔑 Password update requested");

      if (!currentPassword)
        return res.status(400).json({
          success: false,
          message: "Current password required.",
        });

      const isMatch = await bcrypt.compare(currentPassword, guard.password);
      if (!isMatch)
        return res.status(400).json({
          success: false,
          message: "Incorrect current password.",
        });

      guard.password = newPassword; // ⚠️ Do NOT hash it manually
    }

    await guard.save();
    res.status(200).json({ success: true, message: "Profile updated successfully." });

  } catch (error) {
    console.error("🔥 Error updating guard profile:", error.message);
    res.status(500).json({ success: false, message: "Server error updating profile." });
  }
};
