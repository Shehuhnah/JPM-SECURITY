import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { startApplicantCleanup } from "./utils/cronJobs.js";

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
import leaveRoutes from "./routes/leaveRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import userRoutes from "./routes/authRoutes.js";
import applicantMessageRoutes from "./routes/applicantMessageRoutes.js";
import applicantRoutes from "./routes/applicantRoutes.js";
import adminAttendanceRoutes from "./routes/adminAttendanceRoutes.js";
import adminReportRoutes from "./routes/adminReportRoutes.js";

import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "https://jpm-security.vercel.app",
  "https://www.jpmsecurityagency.com",
  "https://jpmsecurityagency.com",
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.CLIENT_ORIGIN,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

export const onlineUsersMap = {};
export { io };

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

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
app.use("/api/leaves", leaveRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applicant-messages", applicantMessageRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/admin-attendance", adminAttendanceRoutes);
app.use("/api/admin-reports", adminReportRoutes);

app.get("/", (req, res) => res.send("API is running"));
startApplicantCleanup();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT;
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));

io.on("connection", (socket) => {
  console.log("[socket] connected", { socketId: socket.id });

  socket.on("userOnline", (userId) => {
    onlineUsersMap[userId] = socket.id;
    console.log("[socket] userOnline", { userId, socketId: socket.id });
    io.emit("onlineUsers", Object.keys(onlineUsersMap));
  });

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log("[socket] joinConversation", { socketId: socket.id, conversationId });
  });

  socket.on("mark_seen", async ({ conversationId, userId }) => {
    try {
      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: userId },
          seen: false,
        },
        { $set: { seen: true } }
      );

      const conversation = await Conversation.findById(conversationId);

      if (
        conversation &&
        conversation.lastMessage &&
        conversation.lastMessage.senderId &&
        conversation.lastMessage.senderId.toString() !== userId
      ) {
        conversation.lastMessage.seen = true;
        conversation.markModified("lastMessage");
        await conversation.save();
      }

      io.to(conversationId).emit("messages_seen", {
        conversationId,
        seenBy: userId,
      });
      console.log("[socket] messages_seen", { conversationId, seenBy: userId });
    } catch (error) {
      console.error("Socket mark_seen error:", error);
    }
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(onlineUsersMap).find((key) => onlineUsersMap[key] === socket.id);
    if (userId) delete onlineUsersMap[userId];
    console.log("[socket] disconnected", { socketId: socket.id, userId: userId || null });
    io.emit("onlineUsers", Object.keys(onlineUsersMap));
  });
});
