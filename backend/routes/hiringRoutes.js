import express from "express";
import {
  createHiring,
  getHirings,
  getHiringById,
  updateHiring,
  deleteHiring,
} from "../controller/hiringcontroller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createHiring);
router.get("/", getHirings);
router.get("/:id", protect, getHiringById);
router.put("/:id", protect, updateHiring);
router.delete("/:id", protect, deleteHiring);

export default router;
