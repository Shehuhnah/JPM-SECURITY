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
  finalizeHiring,
  deleteApplicant,
} from "../controller/applicantController.js";
import { protect } from "../middleware/authMiddleware.js";
import { createUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();
const applicantUpload = createUpload("applicants");

router.get("/download-hired-list", protect, downloadHiredList);
router
  .route("/")
  .get(protect, getApplicants)
  .post(protect, applicantUpload.single("resume"), createApplicant);

router.post("/:id/interview-email", protect, sendInterviewEmail);
router.post("/:id/hire-email", protect, sendHireEmail);
router.post("/:id/finalize-hiring", protect, finalizeHiring);

router.route("/:id").put(protect, updateApplicant).delete(protect, deleteApplicant);
router.patch("/:id/decline", protect, declineApplicant);
router.patch("/:id/remarks", protect, addInterviewRemarks);

export default router;
