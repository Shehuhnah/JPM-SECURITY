import express from "express";
import {
  createLeaveRequest,
  getDeploymentLeaveAvailability,
  getLeaveRequests,
  getMyLeaveRequests,
  reviewLeaveRequest,
} from "../controller/leaveController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my", authorizeRoles("Guard", "Subadmin"), getMyLeaveRequests);
router.get("/deployment-availability", authorizeRoles("Admin", "Subadmin"), getDeploymentLeaveAvailability);
router.get("/", authorizeRoles("Admin", "Subadmin"), getLeaveRequests);
router.post("/", authorizeRoles("Guard", "Subadmin"), createLeaveRequest);
router.patch("/:id/review", authorizeRoles("Admin"), reviewLeaveRequest);

export default router;
