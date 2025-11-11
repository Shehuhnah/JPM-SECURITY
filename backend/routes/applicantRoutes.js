import express from "express";
import {
  getApplicants,
  createApplicant,
  updateApplicant,
  deleteApplicant,
} from "../controller/applicantController.js";
import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();

router.route("/")
  .get(protect, getApplicants)
  .post(protect, createApplicant);
  

router.route("/:id")
  .put(protect, updateApplicant)
  .delete(protect, deleteApplicant);
  

export default router;
