import express from "express";
import {
  getPosts,
  createPost,
  deletePost,
} from "../controller/postController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getPosts);
router.post("/", protect, authorizeRoles("admin", "subadmin"), createPost);
router.delete("/:id", protect, authorizeRoles("admin", "subadmin"), deletePost);

export default router;
