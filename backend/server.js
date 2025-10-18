// server.js or index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; 

//MODELS
import User from "./models/User.model.js";

//ROUTES
import attendanceRoutes from "./routes/attendanceRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);


app.get("/", (req, res) => res.send("API is running"));

// app.post("/api/users", async (req, res) => {
//   try {
//     const user = await User.create(req.body);
//     res.status(201).json(user);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// app.get("/api/users", async (req, res) => {
//   const users = await User.find();
//   res.json(users);
// });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log(err));
