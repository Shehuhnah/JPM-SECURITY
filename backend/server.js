// server.js or index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.model.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("API is running"));

app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(5000, () => console.log("✅ Server running on port 5000", "JWT Secret:", process.env.JWT_SECRET));
  })
  .catch((err) => console.log(err));
