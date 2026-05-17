import express from "express";
import {
  createLeaveRequest,
  editLeaveRequest,
  getDeploymentLeaveAvailability,
  getLeaveRequests,
  getMyLeaveRequests,
  reviewLeaveRequest,
  revokeLeaveRequest,
} from "../controller/leaveController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my", authorizeRoles("Guard", "Subadmin", "Admin"), getMyLeaveRequests);
router.get("/deployment-availability", authorizeRoles("Admin", "Subadmin"), getDeploymentLeaveAvailability);
router.get("/", authorizeRoles("Admin", "Subadmin"), getLeaveRequests);
router.post("/", authorizeRoles("Guard", "Subadmin", "Admin"), createLeaveRequest);
router.patch("/:id/review", authorizeRoles("Admin", "Subadmin"), reviewLeaveRequest);
router.patch("/:id/revoke", authorizeRoles("Admin", "Subadmin"), revokeLeaveRequest);
router.patch("/:id/edit", authorizeRoles("Admin", "Subadmin"), editLeaveRequest);

export default router;

