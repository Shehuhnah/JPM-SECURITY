import express from "express";
import {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  getMyRequests,
} from "../controller/IDrequestController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guards can create and view their own requests
router.post("/", protect, createRequest);
router.get("/myrequests", protect, getMyRequests); // 👈 guard history
router.get("/:id", protect, getRequestById);

// Admins can view all requests or modify them
router.get("/", protect, authorizeRoles("Admin", "Subadmin"), getAllRequests);
router.put("/:id", protect, authorizeRoles("Admin", "Subadmin"), updateRequest);
router.delete("/:id", protect, authorizeRoles("Admin", "Subadmin"), deleteRequest);

export default router;
