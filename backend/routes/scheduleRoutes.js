import express from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  approveClientSchedules,
  declineClientSchedules,
  deleteSchedule,
  getSchedulesByGuard,
  getTodayScheduleByGuard,
  updateSchedulesByBatchId,
  getSchedulesByBatchId,
  deleteScheduleByBatch,
  approveScheduleBatch,
  declineScheduleBatch,
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
// Get schedule by batch id
router.get("/get-by-batch/:id", protect, authorizeRoles("Admin", "Subadmin"), getSchedulesByBatchId)
// modify schedule by batch ID
router.patch("/batch/:id", protect, authorizeRoles("Admin", "Subadmin"), updateSchedulesByBatchId)
// delete schedule by batch ID
router.delete("/batch/:id", protect, authorizeRoles("Admin", "Subadmin"), deleteScheduleByBatch)

// approve schedule by batch ID
router.patch("/batch/approve/:id", protect, authorizeRoles("Admin", "Subadmin"), approveScheduleBatch);
// decline schedule by batch ID
router.patch("/batch/decline/:id", protect, authorizeRoles("Admin", "Subadmin"), declineScheduleBatch);

export default router;
