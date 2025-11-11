import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
    registerUser, 
    loginUser, 
    loginGuard,
    getSubadmins,
    getAdmins,
    getGuards
} from "../controller/authController.js";
import { 
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} from "../controller/userController.js";

const router = express.Router();

router.post("/register", registerUser); // Register new user
router.post("/login", loginUser); // Login user

router.get("/users", getUsers); // Get all users
router.post("/create-user", createUser); // Create new user
router.put("/update-user/:id", updateUser); // Update user
router.delete("/delete-user/:id", deleteUser); //delete user

router.post("/login-guard", loginGuard); // Login guard


//FETCHING FOR CONVERSATION
router.get("/subadmins", protect, getSubadmins);
router.get("/admins", protect, getAdmins);
router.get("/guards", protect, getGuards); 
export default router;