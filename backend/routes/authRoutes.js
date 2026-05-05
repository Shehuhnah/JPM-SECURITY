import express from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  getMe,
  logout,
  loginGuard,
  guardChangePassword,
  getSubadmins,
  getAdmins,
  setPassword,
  getGuards,
  forgotPasswordGuard,
  verifyOtpGuard,
  forgotPasswordAdmin,
  verifyOtpAdmin,
  updateMyProfile,
} from "../controller/authController.js";
import { 
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} from "../controller/userController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.get("/me", getMe);
router.put("/me", protect, authorizeRoles("Admin", "Subadmin"), upload.single("photo"), updateMyProfile);
router.get("/subadmins", protect, getSubadmins);
router.get("/admins", protect, getAdmins);

router.get("/users", getUsers); // Get all users
router.post("/create-user", createUser); // Create new user
router.put("/update-user/:id", updateUser); // Update user
router.delete("/delete-user/:id", deleteUser); //delete user

// GUARD AUTH
router.post("/login-guard", loginGuard);
router.put("/change-password", guardChangePassword);
router.get("/guards", protect, getGuards); // Fetch all guards

// PASSWORD RESET FOR GUARDS WHEN NEWLY HIRED/REGISTERED
router.post("/set-password/:token", setPassword);

// FORGOT PASSWORD FLOW
router.post("/forgot-password-guard", forgotPasswordGuard);
router.post("/verify-otp-guard", verifyOtpGuard);

// ADMIN FORGOT PASSWORD FLOW
router.post("/forgot-password-admin", forgotPasswordAdmin);
router.post("/verify-otp-admin", verifyOtpAdmin);

export default router;
