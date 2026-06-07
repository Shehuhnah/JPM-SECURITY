import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
  checkApplicantEmail,
  initApplicantConversation,
  sendApplicantMessage,
  getApplicantMessages,
} from "../controller/applicantMessageController.js";

const router = express.Router();

router.post("/session", initApplicantConversation);
router.get("/check-email", checkApplicantEmail);
router.get("/:conversationId", getApplicantMessages);
router.post("/:conversationId/messages", upload.single("file"), sendApplicantMessage);

export default router;

