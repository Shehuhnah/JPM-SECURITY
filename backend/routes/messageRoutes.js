import express from "express";
import {
  getMessages,
  getConversation,
  sendMessage,
  deleteMessage,
} from "../controller/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMessages);
router.get("/:user1/:user2", protect, getConversation);
router.post("/", protect, sendMessage);
router.delete("/:id", protect, deleteMessage);

export default router;
