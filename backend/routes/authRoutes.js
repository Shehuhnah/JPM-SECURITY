import express from "express";
import { registerUser, loginUser } from "../controller/authController.js";
import { getUsers, createUser, updateUser, deleteUser } from "../controller/userController.js";

const router = express.Router();

router.post("/register", registerUser); // Register new user
router.post("/login", loginUser); // Login user

router.get("/users", getUsers); // Get all users
router.post("/create-user", createUser); // Create new user

router.get("/update-user", updateUser); // Update user

router.delete("/delete-user/:id", deleteUser); //delete user

export default router;
