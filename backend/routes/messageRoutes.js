import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
    getConversations, 
    getMessages, 
    sendMessage, 
    markMessagesAsSeen  
} from "../controller/messageController.js";

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.get("/:conversationId", protect, getMessages);
router.post("/", protect, sendMessage);
router.patch("/:conversationId/seen", protect, markMessagesAsSeen);

export default router;
