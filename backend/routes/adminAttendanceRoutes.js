import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getMyAttendanceDashboard,
  timeInStaff,
  timeOutStaff,
  downloadMyStaffAttendance,
  getStaffAttendanceByUserId,
} from "../controller/adminAttendanceController.js";

const router = express.Router();

router.get("/me", protect, authorizeRoles("Admin", "Subadmin"), getMyAttendanceDashboard);
router.get("/user/:userId", protect, authorizeRoles("Admin", "Subadmin"), getStaffAttendanceByUserId);
router.post("/time-in", protect, authorizeRoles("Admin", "Subadmin"), timeInStaff);
router.patch("/time-out/:id", protect, authorizeRoles("Admin", "Subadmin"), timeOutStaff);
router.get("/download-my-attendance", protect, authorizeRoles("Admin", "Subadmin"), downloadMyStaffAttendance);

export default router;
