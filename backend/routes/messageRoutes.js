import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsSeen,
  bulkDeleteConversations,
} from "../controller/messageController.js";

const router = express.Router();

router.get("/conversations", protect, getConversations);

// Bulk delete must come BEFORE the /:conversationId wildcard
router.delete("/bulk-delete", protect, authorizeRoles("Admin", "Subadmin"), bulkDeleteConversations);

router.get("/:conversationId", protect, getMessages);

// ✅ Add file upload support (image or attachment)
router.post("/", protect, upload.single("file"), sendMessage);

router.patch("/:conversationId/seen", protect, markMessagesAsSeen);

export default router;
