import Hiring from "../models/hiring.model.js";

// CREATE new hiring post
export const createHiring = async (req, res) => {
  try {
    const { title, position, location, employmentType, description, date, time } = req.body;

    const newHiring = new Hiring({
      author: req.user.id,
      title,
      position,
      location,
      employmentType,
      description,
      date,
      time,
    });

    const savedHiring = await newHiring.save();
    res.status(201).json(savedHiring);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET all hiring posts
export const getHirings = async (req, res) => {
  try {
    const hirings = await Hiring.find().populate('author', 'name').sort({ createdAt: -1 });
    res.status(200).json(hirings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET a single hiring post by ID
export const getHiringById = async (req, res) => {
  try {
    const hiring = await Hiring.findById(req.params.id);
    if (!hiring) return res.status(404).json({ message: "Hiring post not found" });
    res.status(200).json(hiring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE a hiring post by ID
export const updateHiring = async (req, res) => {
  try {
    const updatedHiring = await Hiring.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedHiring) return res.status(404).json({ message: "Hiring post not found" });
    res.status(200).json(updatedHiring);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE a hiring post by ID
export const deleteHiring = async (req, res) => {
  try {
    const deletedHiring = await Hiring.findByIdAndDelete(req.params.id);
    if (!deletedHiring) return res.status(404).json({ message: "Hiring post not found" });
    res.status(200).json({ message: "Hiring post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
