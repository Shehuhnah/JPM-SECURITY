import Guard from "../models/guard.model.js";
import Schedule from "../models/schedule.model.js";
import Logbook from "../models/logbook.model.js";
import bcrypt from "bcryptjs";
import { sendMail } from "../utils/mailer.js";
import crypto from 'crypto';

// Get all guards
export const getAllGuards = async (req, res) => {
  try {
    const guards = await Guard.find().select("-password").sort({ createdAt: -1 }); // Exclude password from results
    res.status(200).json(guards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guards", error: error.message });
  }
};

// Get guard by ID
export const getGuardById = async (req, res) => {
  try {
    const guard = await Guard.findById(req.params.id).select("-password"); // Exclude password
    if (!guard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    res.status(200).json(guard);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guard", error: error.message });
  }
};

// Create new guard
export const createGuard = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if guard already exists
    const existingGuard = await Guard.findOne({ email });
    if (existingGuard) {
      return res.status(400).json({ message: "Guard with this email already exists." });
    }

    const newGuard = new Guard(req.body);

    // 2. Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 3. Hash token and save to database field
    newGuard.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 4. Set expiration (48 hours to match your email text)
    newGuard.resetPasswordExpire = Date.now() + 48 * 60 * 60 * 1000;

    // 5. Save the guard
    await newGuard.save();

    // 6. Create the Activation URL
    const activationUrl = `https://www.jpmsecurityagency.com/set-password/${resetToken}`;
    const logoUrl = "https://jpm-security.onrender.com/assets/headerpdf/jpmlogo.png";

    // --- EMAIL CONTENT (Integrated from your template) ---
    const subject = `Action Required: Activate Your Account`;
    const defaultMessage = "We are pleased to inform you that your account has been created at JPM Security Agency.";

    // Plain Text Version
    const plainMessage = `
      Hello ${newGuard.fullName || "Guard"},
      
      ${defaultMessage}
      
      To access the Guard Portal, you must activate your account and set your secure password.
      
      Click here: ${activationUrl}
      
      This link is valid for 48 hours.
      
      Best regards,
      JPM Security Agency Recruitment Team
    `;

    // Professional HTML Version
    const htmlMessage = `
      <div style="margin:0;padding:0;background:#f5f7fb;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
          <tr>
            <td align="center" style="padding:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
                
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#065f46 0%,#059669 50%,#10b981 100%);padding:36px 24px;">
                    <img src="${logoUrl}" alt="JPM Security Agency" width="160" style="display:block;height:auto;margin:0 auto 12px auto;" />
                    <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.2px;">Welcome Aboard</div>
                    <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,0.9);font-size:14px;margin-top:5px;">Account Activation Required</div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                    <p style="margin:0 0 12px 0;">Hello <strong>${newGuard.fullName || "Guard"}</strong>,</p>
                    <p style="margin:0 0 16px 0;">${defaultMessage}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                      <tr>
                        <td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">Account Details</td>
                      </tr>
                      <tr>
                        <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Position</td>
                        <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${newGuard.position || "Security Guard"}</td>
                      </tr>
                      <tr>
                        <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Guard ID</td>
                        <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${newGuard.guardId || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Account Status</td>
                        <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#ea580c;font-size:14px;font-weight:bold;">Pending Activation</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:0 24px 28px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="border-radius:8px;background:#ca8a04;">
                                <a href="${activationUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Activate Account & Set Password</a>
                            </td>
                        </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 10px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;color:#1e3a8a;font-size:13px;line-height:1.7;">
                          <strong>Trouble clicking the button?</strong><br>
                          Copy and paste this link into your browser:<br>
                          <a href="${activationUrl}" style="color:#2563eb;word-break:break-all;">${activationUrl}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 24px 26px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                    Welcome to the team. We look forward to working with you.
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 24px 26px 24px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;border-top:1px solid #e2e8f0;">
                    Best regards,<br />
                    <strong>JPM Security Agency Recruitment Team</strong>
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
      // 8. Send Email using your Resend utility
      await sendMail({
        to: newGuard.email,
        subject: subject,
        text: plainMessage,
        html: htmlMessage,
      });

      res.status(201).json({ 
        message: "Guard created successfully and activation email sent.", 
        guard: newGuard 
      });

    } catch (emailError) {
      console.error("Email send error:", emailError);
      
      // Rollback sensitive token fields if email fails, but keep the account created
      // You might want to delete the user instead if strict activation is required
      newGuard.resetPasswordToken = undefined;
      newGuard.resetPasswordExpire = undefined;
      await newGuard.save();

      res.status(201).json({ 
        message: "Guard created, but email failed to send. Please use manual password or retry.", 
        guard: newGuard 
      });
    }

  } catch (error) {
    console.error("Create Guard Error:", error);
    res.status(400).json({ message: "Error creating guard", error: error.message });
  }
};

// Update guard
export const updateGuard = async (req, res) => {
  try {
    const updatedGuard = await Guard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password"); // Exclude password
    if (!updatedGuard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    res.status(200).json({ message: "Guard updated successfully", guard: updatedGuard });
  } catch (error) {
    res.status(400).json({ message: "Error updating guard", error: error.message });
  }
};

// Delete guard
export const deleteGuard = async (req, res) => {
  try {
    const deletedGuard = await Guard.findByIdAndDelete(req.params.id);
    if (!deletedGuard) {
      return res.status(404).json({ message: "Guard not found" });
    }
    res.status(200).json({ message: "Guard deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting guard", error: error.message });
  }
};

// GET /api/guards/me
export const getGuardInfo = async (req, res) => {
  try {
    const guard = await Guard.findById(req.user.id).select("-password");
    if (!guard)
      return res.status(404).json({ success: false, message: "Guard not found" });

    res.status(200).json({ success: true, data: guard });
  } catch (error) {
    console.error("Error fetching guard info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/guards/me
export const updateGuardProfile = async (req, res) => {
  try {
    const guard = await Guard.findById(req.user.id);
    if (!guard) {
      return res.status(404).json({ success: false, message: "Guard not found." });
    }

    const { fullName, address, phoneNumber, currentPassword, newPassword, SSSID, PhilHealthID, PagibigID } = req.body;
    
    // ALWAYS require currentPassword to authorize any changes.
    if (!currentPassword) {
        return res.status(400).json({
            success: false,
            message: "Current password is required to make any changes.",
        });
    }

    const isMatch = await bcrypt.compare(currentPassword, guard.password);
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            message: "Incorrect current password.",
        });
    }

    // At this point, the user is authenticated. We can apply changes.
    if (fullName) guard.fullName = fullName;
    if (address) guard.address = address;
    if (phoneNumber) guard.phoneNumber = phoneNumber;
    if (SSSID) guard.SSSID = SSSID;
    if (PhilHealthID) guard.PhilHealthID = PhilHealthID;
    if (PagibigID) guard.PagibigID = PagibigID;

    if (newPassword) {
      // The password has already been checked, so we just set the new one.
      guard.password = newPassword; // Pre-save hook will hash it
    }

    await guard.save();
    res.status(200).json({ success: true, message: "Profile updated successfully.", guard: guard.toJSON() }); // Return updated guard excluding password

  } catch (error) {
    console.error("🔥 Error updating guard profile:", error.message);
    res.status(500).json({ success: false, message: "Server error updating profile." });
  }
};

export const getGuardDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [guard, schedules, logs] = await Promise.all([
      Guard.findById(id).select("-password").lean(),
      Schedule.find({ guardId: id }).sort({ timeIn: -1 }).lean(),
      Logbook.find({ guard: id }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!guard) {
      return res.status(404).json({ message: "Guard not found" });
    }

    res.status(200).json({ guard, schedules, logs });
  } catch (error) {
    console.error("Error fetching guard details:", error);
    res.status(500).json({ message: "Error fetching guard details", error: error.message });
  }
};
