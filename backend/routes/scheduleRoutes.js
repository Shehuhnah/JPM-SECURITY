import express from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  approveClientSchedules,
  declineClientSchedules,
  deleteSchedule,
  getSchedulesByGuard,
  getTodayScheduleByGuard
} from "../controller/scheduleController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create schedule
router.post("/create-schedule", protect, authorizeRoles("Admin", "Subadmin"), createSchedule);
// Get Schedule
router.get("/get-schedules", protect, getSchedules);
// get schedule by ID
router.get("/:id", protect, getScheduleById);
// get schedule by Guard
router.get("/guard/:id", protect, getSchedulesByGuard);
// get schedule today of Guard
router.get("/today/:id", protect, getTodayScheduleByGuard);
// approve by client schedules
router.patch("/approve-client-schedules", protect, authorizeRoles("Admin", "Subadmin"), approveClientSchedules);
// decline by client schedules
router.patch("/decline-client-schedules", protect, authorizeRoles("Admin", "Subadmin"), declineClientSchedules);
// delete schedule by ID
router.delete("/:id", protect, authorizeRoles("Admin", "Subadmin"), deleteSchedule);

export default router;
