import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getMyAttendanceDashboard,
  timeInStaff,
  timeOutStaff,
} from "../controller/adminAttendanceController.js";

const router = express.Router();

router.get("/me", protect, authorizeRoles("Admin", "Subadmin"), getMyAttendanceDashboard);
router.post("/time-in", protect, authorizeRoles("Admin", "Subadmin"), timeInStaff);
router.patch("/time-out/:id", protect, authorizeRoles("Admin", "Subadmin"), timeOutStaff);

export default router;
