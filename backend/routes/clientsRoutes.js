import express from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controller/clientController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/create-client", protect, authorizeRoles("Admin", "Subadmin"), createClient);
router.get("/", protect, authorizeRoles("Admin", "Subadmin"), getClients);
router.get("/:id", protect, authorizeRoles("Admin", "Subadmin"), getClientById);
router.put("/:id", protect, authorizeRoles("Admin", "Subadmin"), updateClient);
router.delete("/:id", protect, authorizeRoles("Admin", "Subadmin"), deleteClient);

export default router;
