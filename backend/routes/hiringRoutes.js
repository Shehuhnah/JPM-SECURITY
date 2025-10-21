import express from "express";
import {
  createHiring,
  getHirings,
  getHiringById,
  updateHiring,
  deleteHiring,
} from "../controller/hiringcontroller.js";

const router = express.Router();

router.post("/", createHiring);
router.get("/", getHirings);
router.get("/:id", getHiringById);
router.put("/:id", updateHiring);
router.delete("/:id", deleteHiring);

export default router;
