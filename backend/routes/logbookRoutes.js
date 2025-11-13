import express from "express";
import {
    createLogbook,
    getLogbooks,
    getLogbookById,
    updateLogbook,
    deleteLogbook,
    getLogsByGuard,
} from "../controller/logbookController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// CRUD routes
router.post("/", protect, createLogbook);
router.get("/", protect, getLogbooks);
router.get("/:id", protect, getLogbookById);
router.put("/:id", protect, updateLogbook);
router.delete("/:id", protect, deleteLogbook);
router.get("/guard/:guardId", protect, getLogsByGuard);

export default router;