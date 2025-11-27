import express from "express";
import {
  getApplicants,
  createApplicant,
  updateApplicant,
  declineApplicant,
  sendInterviewEmail,
  sendHireEmail,
  addInterviewRemarks,
  downloadHiredList,
} from "../controller/applicantController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/download-hired-list", protect, downloadHiredList);
router.route("/").get(protect, getApplicants).post(protect, createApplicant);

router.post("/:id/interview-email", protect, sendInterviewEmail);
router.post("/:id/hire-email", protect, sendHireEmail);

router.route("/:id").put(protect, updateApplicant);
router.patch("/:id/decline", protect, declineApplicant);
router.patch("/:id/remarks", protect, addInterviewRemarks);

export default router;