import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controller/postController.js";
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router();

// CRUD routes
router.post("/", protect, createPost);
router.get("/", protect, getPosts);
router.get("/:id", protect, getPostById);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

export default router;
