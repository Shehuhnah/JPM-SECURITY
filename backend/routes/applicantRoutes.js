import express from "express";
import {
  getApplicants,
  createApplicant,
  updateApplicant,
  deleteApplicant,
  sendInterviewEmail,
  sendHireEmail, // ✅ Add this
} from "../controller/applicantController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getApplicants).post(protect, createApplicant);

router.post("/:id/interview-email", protect, sendInterviewEmail);
router.post("/:id/hire-email", protect, sendHireEmail); // ✅ Add this route

router.route("/:id").put(protect, updateApplicant).delete(protect, deleteApplicant);

export default router;