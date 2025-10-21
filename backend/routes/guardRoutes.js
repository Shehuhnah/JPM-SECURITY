import express from "express";
import {
  getAllGuards,
  getGuardById,
  createGuard,
  updateGuard,
  deleteGuard,
} from "../controller/guardController.js";

const router = express.Router();

router.get("/", getAllGuards);
router.get("/:id", getGuardById);
router.post("/", createGuard);
router.put("/:id", updateGuard);
router.delete("/:id", deleteGuard);

export default router;
