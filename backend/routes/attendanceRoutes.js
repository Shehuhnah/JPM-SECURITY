import express from "express";
import {
  getAttendances,
  getGuardAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "../controller/attendanceController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/attendance-time-in", protect, createAttendance);
router.get("/", protect, getAttendances);
router.get("/:id", protect, getGuardAttendance);
router.patch("/attendance-time-out/:id", protect, updateAttendance);
router.delete("/:id", protect, deleteAttendance);


export default router;
