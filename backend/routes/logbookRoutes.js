import express from "express";
import {
    createLogbook,
    getLogbooks,
    getLogbookById,
    updateLogbook,
    deleteLogbook,
    getLogsByGuard,
} from "../controller/logbookController.js";

const router = express.Router();

// CRUD routes
router.post("/", createLogbook);
router.get("/", getLogbooks);
router.get("/:id", getLogbookById);
router.put("/:id", updateLogbook);
router.delete("/:id", deleteLogbook);
router.get("/guard/:guardId", getLogsByGuard);

export default router;