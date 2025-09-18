import express from "express";
import User from "../models/User.js";

const router = express.Router();

// @desc Get all users
// @route GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc Add a new user
// @route POST /api/users
router.post("/", async (req, res) => {
  const { name, guardId, email, phone, password } = req.body;

  try {
    const newUser = new User({ name, guardId, email, phone, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc Delete user
// @route DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
