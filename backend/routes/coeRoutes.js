import express from "express";
import coeController from "../controller/coeController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guards create requests and view their own
router.post("/", protect, coeController.createRequest);
router.get("/me", protect, coeController.getMyRequests);

// Admin routes
router.get("/", protect, authorizeRoles("Admin", "Subadmin"), coeController.listRequests);
router.get("/:id", protect, authorizeRoles("Admin", "Subadmin"), coeController.getRequest);
router.patch("/:id/status", protect, authorizeRoles("Admin", "Subadmin"), coeController.updateStatus);
router.get("/:id/download", protect, coeController.downloadCOE);

export default router;
