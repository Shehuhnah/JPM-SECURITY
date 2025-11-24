import express from "express";
import coeController from "../controller/coeController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guards/subadmin create requests and view their own
router.post("/", protect, coeController.createRequest);
router.get("/me", protect, coeController.getMyRequests);

// Admin routes
router.get("/", protect,  coeController.listRequests);
router.get("/:id", protect,  coeController.getRequest);
router.patch("/:id/status", protect,  coeController.updateStatus);
router.get("/:id/download", protect, coeController.downloadCOE);

export default router;
