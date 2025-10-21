import Guard from "../models/guard.model.js";

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
