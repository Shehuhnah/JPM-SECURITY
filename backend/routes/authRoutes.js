import express from "express";
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
  verifyOtpGuard
} from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.get("/me", getMe);
router.get("/subadmins", protect, getSubadmins);
router.get("/admins", protect, getAdmins);

// GUARD AUTH
router.post("/login-guard", loginGuard);
router.put("/change-password", guardChangePassword); // Protected inside? usually check token
router.get("/guards", protect, getGuards); // Fetch all guards

// PASSWORD RESET FOR GUARDS WHEN NEWLY HIRED/REGISTERED
router.post("/set-password/:token", setPassword);

// FORGOT PASSWORD FLOW
router.post("/forgot-password-guard", forgotPasswordGuard);
router.post("/verify-otp-guard", verifyOtpGuard);

export default router;