import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAdminReports,
  createAdminReport,
} from "../controller/adminReportController.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorizeRoles("Admin", "Subadmin"), getAdminReports)
  .post(protect, authorizeRoles("Admin", "Subadmin"), createAdminReport);

export default router;
