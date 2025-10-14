import express from "express";
import { registerUser, loginUser } from "../controller/authController.js";
import { getUsers, createUser } from "../controller/userController.js";

const router = express.Router();

router.post("/register", registerUser); // Register new user
router.post("/login", loginUser); // Login user

router.get("/users", getUsers); // Get all users
router.post("/create-user", createUser); // Create new user

export default router;
