import express from "express";
import { registerUser, loginUser } from "../controller/authController.js";
import { getUsers } from "../controller/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/users", getUsers)

export default router;
