import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Guard from "../models/guard.model.js";
import crypto from 'crypto';

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

// REGISTER ADMIN/SUBADMIN
export const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    accessLevel,
    position,
    contactNumber,
  } = req.body;

  try {
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role,
      accessLevel,
      position,
      contactNumber,
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accessLevel: admin.accessLevel,
    });
  } catch (err) {
    console.error("Error registering admin:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// LOGIN USER (ADMIN/SUBADMIN)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,        
      sameSite: "lax",     
      maxAge: 1000 * 60 * 60 * 24 * 15, 
    });

    user.lastLogin = new Date();
    await user.save();
    res.json({ admin: user.toJSON() });
    
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  // Logout must match Login settings exactly to clear the cookie
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,      
    sameSite: "lax",   // CRITICAL: Must match the login setting
  });

  return res.json({ message: "Logged out successfully" });
};

// LOGIN GUARD
export const loginGuard = async (req, res) => {
  const { email, password } = req.body;

  try {
    const guard = await Guard.findOne({ email, role: "Guard" });
    if (!guard) return res.status(400).json({ message: "Invalid Email Address" });

    const isMatch = await guard.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = generateToken(guard._id, guard.role);
    
    // FIX FOR iOS: Change sameSite to 'lax'
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,       
      sameSite: "lax",   // CRITICAL: Must be 'lax'
      maxAge: 1000 * 60 * 60 * 24 * 15, 
    });

    guard.lastLogin = new Date();
    await guard.save();
    res.json({ guard: guard.toJSON() });

  } catch (err) {
    console.error("Guard login error:", err.message);
    res.status(500).json({ message: "Server error logging in guard." });
  }
};

// GUARD CHANGE PASSWORD
export const guardChangePassword = async (req, res) => {
  const { guardId, newPassword } = req.body;

  try {
    const guard = await Guard.findById(guardId);
    if (!guard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    guard.password = newPassword;
    guard.isFirstLogin = false;
    await guard.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing guard password:", err);
    res.status(500).json({ message: "Server error changing password" });
  }
};

// GET CURRENT LOGGED-IN USER
export const getMe = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try finding admin/subadmin first
    let user = await User.findById(decoded.id).select("-password");
    // If not found, try guard
    if (!user) {
      user = await Guard.findById(decoded.id).select("-password");
    }

    if (!user) return res.status(401).json({ message: "User not found" });

    res.json(user.toJSON());
  } catch (err) {
    console.error("Error in /me:", err);
    res.status(401).json({ message: "Not authenticated" });
  }
};

// CONVERSATION FETCHING
export const getSubadmins = async (req, res) => {
  try {
    const subadmins = await User.find({ role: "Subadmin" }).select(
      "name email role"
    );
    res.json(subadmins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "Admin" }).select(
      "name email role"
    );
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGuards = async (req, res) => {
  try {
    const guards = await Guard.find({ role: "Guard" }).select(
      "fullName email guardId phoneNumber address position status" // Removed dutyStation and shift
    );
    res.json(guards);
  } catch (err) {
    console.error("Error fetching guards:", err.message);
    res.status(500).json({ message: "Server error fetching guards" });
  }
};

export const setPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Hash the incoming URL token to compare with the Database version
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2. Find Guard with this token AND ensure it hasn't expired
    const guard = await Guard.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!guard) {
      return res.status(400).json({ success: false, message: "Invalid or expired activation link." });
    }

    // 3. SET PLAIN TEXT PASSWORD
    // Your Guard model's "pre-save" hook will detect this change and hash it automatically.
    guard.password = password; 

    // 4. Clear the reset token fields
    guard.resetPasswordToken = undefined;
    guard.resetPasswordExpire = undefined;

    // 5. This triggers the pre('save') hook -> Hashing happens now
    await guard.save();

    res.status(200).json({ success: true, message: "Password set successfully. You can now login." });
  } catch (error) {
    console.error("Set Password Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- FORGOT PASSWORD (OTP FLOW) ---

import { sendMail } from "../utils/mailer.js";

export const forgotPasswordGuard = async (req, res) => {
  const { email } = req.body;

  try {
    const guard = await Guard.findOne({ email });
    if (!guard) {
      return res.status(404).json({ message: "Guard not found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to Guard (valid for 10 mins)
    guard.otp = otp;
    guard.otpExpire = Date.now() + 10 * 60 * 1000;
    await guard.save();

    const logoUrl = "https://jpm-security.onrender.com/assets/headerpdf/jpmlogo.png";
    const subject = "JPM Security - Password Reset OTP";
    const defaultMessage = "We received a request to reset the password for your JPM Security Guard account.";

    // Plain Text Version
    const plainMessage = `
      Hello ${guard.fullName || "Security Officer"},
      
      ${defaultMessage}
      
      Your One-Time Password (OTP) is: ${otp}
      
      This code is valid for 10 minutes.
      
      If you did not request this, please ignore this email.
      
      Best regards,
      JPM Security Agency
    `;

    // Professional HTML Version
    const htmlMessage = `
      <div style="margin:0;padding:0;background:#f5f7fb;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
          <tr>
            <td align="center" style="padding:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
                
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%);padding:36px 24px;">
                    <img src="${logoUrl}" alt="JPM Security Agency" width="160" style="display:block;height:auto;margin:0 auto 12px auto;" />
                    <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.2px;">Password Reset</div>
                    <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,0.9);font-size:14px;margin-top:5px;">Secure Verification Code</div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                    <p style="margin:0 0 12px 0;">Hello <strong>${guard.fullName || "Security Officer"}</strong>,</p>
                    <p style="margin:0 0 16px 0;">${defaultMessage}</p>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:10px 24px 28px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;">
                        <tr>
                            <td align="center" style="padding:24px;">
                                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Verification Code</div>
                                <div style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:bold;color:#0f172a;letter-spacing:6px;background:#ffffff;display:inline-block;padding:12px 24px;border-radius:8px;border:1px dashed #cbd5e1;">${otp}</div>
                                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin-top:12px;">This code expires in 10 minutes</div>
                            </td>
                        </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 10px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;color:#9f1239;font-size:13px;line-height:1.7;">
                          <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email or contact support immediately.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 24px 26px 24px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;border-top:1px solid #e2e8f0;">
                    Best regards,<br />
                    <strong>JPM Security Agency Support Team</strong>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="background:#f8fafc;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:14px;">
                    © ${new Date().getFullYear()} JPM Security Agency. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;

    try {
      await sendMail({
        to: guard.email,
        subject,
        text: plainMessage,
        html: htmlMessage,
      });

      res.status(200).json({ success: true, message: "OTP sent to your email" });
    } catch (emailError) {
      guard.otp = undefined;
      guard.otpExpire = undefined;
      await guard.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtpGuard = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const guard = await Guard.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() },
    });

    if (!guard) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP Verified - Generate Reset Token (Reuse existing logic)
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token and save to DB
    guard.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
      
    guard.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins to reset
    
    // Clear OTP
    guard.otp = undefined;
    guard.otpExpire = undefined;

    await guard.save();

    // Return the RAW resetToken to client
    res.status(200).json({ 
      success: true, 
      message: "OTP Verified", 
      resetToken: resetToken 
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
