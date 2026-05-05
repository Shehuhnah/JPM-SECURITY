import express from "express";
import multer from "multer";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAdminReports,
  createAdminReport,
  getStaffReportsByUserId,
} from "../controller/adminReportController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

router
  .route("/")
  .get(protect, authorizeRoles("Admin", "Subadmin"), getAdminReports)
  .post(protect, authorizeRoles("Admin", "Subadmin"), upload.single("image"), createAdminReport);

router.get(
  "/staff/:id",
  protect,
  authorizeRoles("Admin", "Subadmin"),
  getStaffReportsByUserId
);

export default router;
