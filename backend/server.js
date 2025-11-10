import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

dotenv.config();

import attendanceRoutes from "./routes/attendanceRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import hiringRoutes from "./routes/hiringRoutes.js";
import guardRoutes from "./routes/guardRoutes.js";
import logbookRoutes from "./routes/logbookRoutes.js";
import coeRoutes from "./routes/coeRoutes.js";
import idrequestRoutes from "./routes/IDrequestRoutes.js";
import clientRoutes from "./routes/clientsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import userRoutes from "./routes/authRoutes.js";

const app = express();
const httpServer = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export const onlineUsersMap = {}; // key: userId, value: socket.id
export { io }; // export to use inside controllers

// Middleware to inject io into routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads/messages")));

// ✅ Register routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/hirings", hiringRoutes);
app.use("/api/guards", guardRoutes);
app.use("/api/logbook", logbookRoutes);
app.use("/api/coe", coeRoutes);
app.use("/api/idrequests", idrequestRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => res.send("API is running"));

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    httpServer.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log(err));

// ✅ Socket events (no DB logic here)
io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  socket.on("userOnline", (userId) => {
    onlineUsersMap[userId] = socket.id;
    console.log("✅ User online:", userId);
    io.emit("onlineUsers", Object.keys(onlineUsersMap));
  });

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`📩 Joined conversation ${conversationId}`);
  });

  socket.on("mark_seen", ({ conversationId, userId }) => {
    io.to(conversationId).emit("messages_seen", { conversationId, seenBy: userId });
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(onlineUsersMap).find(
      (key) => onlineUsersMap[key] === socket.id
    );
    if (userId) {
      delete onlineUsersMap[userId];
      console.log("🔴 User disconnected:", userId);
      io.emit("onlineUsers", Object.keys(onlineUsersMap));
    } else {
      console.log("❌ Unknown socket disconnected:", socket.id);
    }
  });
});
