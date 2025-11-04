import express from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../controller/scheduleController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-schedule", protect, authorizeRoles("Admin", "Subadmin"), createSchedule);
router.get("/get-schedules", protect, getSchedules);
router.get("/:id", protect, getScheduleById);
router.put("/:id", protect, authorizeRoles("Admin", "Subadmin"), updateSchedule);
router.delete("/:id", protect, authorizeRoles("Admin", "Subadmin"), deleteSchedule);

export default router;
