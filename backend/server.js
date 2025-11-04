// server.js or index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; 
import path from "path";

//ROUTES
import attendanceRoutes from "./routes/attendanceRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import hiringRoutes from "./routes/hiringRoutes.js";
import guardRoutes from "./routes/guardRoutes.js";
import logbookRoutes from "./routes/logbookRoutes.js";
import coeRoutes from "./routes/coeRoutes.js";
import idrequestRoutes from "./routes/IDrequestRoutes.js"
import clientRoutes from "./routes/clientsRoutes.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

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

app.get("/", (req, res) => res.send("API is running"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log(err));
