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

router.get("/", protect, authorizeRoles("admin", "subadmin"), getAttendances);
router.get("/:id", protect, getGuardAttendance);
router.post("/", protect, authorizeRoles("guard"), createAttendance);
router.patch("/:id", protect, updateAttendance);
router.delete("/:id", protect, authorizeRoles("admin"), deleteAttendance);

export default router;
