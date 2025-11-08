import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; 
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
const onlineUsersMap = {}; // key: userId, value: socket.id

// ROUTES
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

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// Register routes
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    httpServer.listen(5000, () => console.log("✅ Server running on port 5000"));
  })
  .catch((err) => console.log(err));

// 🔥 SOCKET.IO HANDLER 🔥
io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  // User comes online
  socket.on("userOnline", (userId) => {
    onlineUsersMap[userId] = socket.id;
    console.log("🟢 User online:", userId);

    // Broadcast online users to everyone
    io.emit("onlineUsers", Object.keys(onlineUsersMap));
  });

  // Join a conversation room
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation ${conversationId}`);
  });

  // Send message
  socket.on("sendMessage", async (msg) => {
    console.log("💬 Message received:", msg);

    try {
      const Message = (await import("./models/message.model.js")).default;

      const newMsg = new Message({
        conversationId: msg.conversationId,
        text: msg.text,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        sender: { userId: msg.senderId, role: msg.senderRole },
        receiver: { userId: msg.receiverId, role: msg.receiverRole },
      });
      await newMsg.save();

      console.log("✅ Message saved!");

      socket.to(msg.conversationId).emit("receiveMessage", {
        ...msg,
        _id: newMsg._id,
        createdAt: newMsg.createdAt,
      });

    } catch (error) {
      console.error("❌ Error saving message:", error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    // Remove user from onlineUsersMap
    const userId = Object.keys(onlineUsersMap).find(
      (key) => onlineUsersMap[key] === socket.id
    );
    if (userId) {
      delete onlineUsersMap[userId];
      console.log("🔴 User disconnected:", userId);

      // Broadcast updated online users
      io.emit("onlineUsers", Object.keys(onlineUsersMap));
    } else {
      console.log("🔴 Socket disconnected (unknown user):", socket.id);
    }
  });
});


