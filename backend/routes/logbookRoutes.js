import express from "express";
import {
    createLogbook,
    getLogbooks,
    getLogbookById,
    updateLogbook,
    deleteLogbook,
    getLogsByGuard,
    getCurrentScheduleInfo,
} from "../controller/logbookController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";

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


// CRUD routes
router.post("/", protect, upload.single("image"), createLogbook);
router.get("/", protect, getLogbooks);
router.get("/:id", protect, getLogbookById);
router.put("/:id", protect, updateLogbook);
router.delete("/:id", protect, deleteLogbook);
router.get("/guard/:guardId", protect, getLogsByGuard);

router.get("/current-info/:id", protect, getCurrentScheduleInfo);


export default router;
