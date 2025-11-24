import express from "express";
import {
  getAllGuards,
  getGuardById,
  createGuard,
  updateGuard,
  deleteGuard,
  getGuardInfo,
  updateGuardProfile,
  getGuardDetails,
} from "../controller/guardController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/me", protect, getGuardInfo);
router.put("/update-guard-profile", protect, updateGuardProfile);

// admin route
router.get("/", protect, authorizeRoles("Admin", "Subadmin"), getAllGuards);
router.post("/", protect, authorizeRoles("Admin", "Subadmin"), createGuard);
router.get("/:id/details", protect, authorizeRoles("Admin", "Subadmin"), getGuardDetails);
router.get("/:id", protect, authorizeRoles("Admin", "Subadmin"), getGuardById);
router.put("/:id", protect, authorizeRoles("Admin", "Subadmin"), updateGuard);
router.delete("/:id", protect, authorizeRoles("Admin", "Subadmin"), deleteGuard);

export default router;
