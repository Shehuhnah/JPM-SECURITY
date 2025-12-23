import Applicant from "../models/applicant.model.js";
import Guard from "../models/guard.model.js";
import crypto from 'crypto';
import { sendMail } from "../utils/mailer.js";
import { generateHiredApplicantsPDF } from "../utils/hiredApplicantsPdfGenerator.js";

const logoUrl = "https://jpm-security.onrender.com/assets/headerpdf/jpmlogo.png";


// 🟢 Get all applicants (latest first)
export const getApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ createdAt: -1 });
    res.status(200).json(applicants);
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Failed to fetch applicants." });
  }
};

// 🟢 Create a new applicant
export const createApplicant = async (req, res) => {
  try {
    const { name, email, phone, position } = req.body;

    if (!name?.trim() || !position?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: "Name, position, and phone are required." });
    }

    const newApplicant = new Applicant({
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone.trim(),
      position: position.trim(),
    });

    const savedApplicant = await newApplicant.save();
    res.status(201).json(savedApplicant);
  } catch (error) {
    console.error("Error creating applicant:", error);
    res.status(500).json({ message: "Failed to create applicant." });
  }
};

// 🟡 Update applicant
export const updateApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.status) {
      const processedById = req.user.id;
      
      if (updateData.status === "Interview") {
        updateData.dateOfInterview = new Date();
        updateData.processedBy = processedById;
      } else if (updateData.status === "Hired") {
        updateData.dateOfHired = new Date();
        updateData.processedBy = processedById;
      }
    }

    const updatedApplicant = await Applicant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedApplicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }

    res.status(200).json(updatedApplicant);
  } catch (error) {
    console.error("Error updating applicant:", error);
    res.status(500).json({ message: "Failed to update applicant." });
  }
};

// 🔴 Decline an applicant
export const declineApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }
    
    applicant.status = "Declined";
    applicant.declinedBy = req.user.id;
    applicant.declinedDate = new Date();
    
    await applicant.save();
    res.status(200).json({ message: "Applicant declined successfully." });
  } catch (error) {
    console.error("Error declining applicant:", error);
    res.status(500).json({ message: "Failed to decline applicant." });
  }
};

// Helper functions for formatting dates and times
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(`1970-01-01T${value}:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// 📧 Send interview email
export const sendInterviewEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, date, startDate, endDate, time, message } = req.body;

    if (!["Admin", "Subadmin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "You are not authorized to perform this action." });
    }

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }
    if (!applicant.email) {
      return res.status(400).json({ message: "Applicant email is missing." });
    }

    let dateToSave = type === "range" ? startDate : date;

    if (dateToSave) {
      if (time) {
          dateToSave = `${dateToSave}T${time}:00+08:00`; 
      } else {
          dateToSave = `${dateToSave}T00:00:00+08:00`;
      }
    }

    if (dateToSave) {
      applicant.dateOfInterview = dateToSave;
      applicant.status = "Interview"; 
      await applicant.save();
    }
    
    const dateSummary =
      type === "range"
        ? `Date Range: ${formatDate(startDate)} - ${formatDate(endDate)}`
        : `Date: ${formatDate(date)}`;
    const timeSummary = time ? `Time: ${formatTime(time)}` : null;

    const subject = `Interview Invitation`;
    const defaultMessage =
      "We would like to invite you for an interview with JPM Security Agency. Please see the details below.";

    const plainMessage = [
      `Hello ${applicant.name || "Applicant"},`,
      "",
      defaultMessage,
      "",
      dateSummary,
      timeSummary || undefined,
      message?.trim() ? `\n${message.trim()}` : undefined,
      "",
      "If you have any questions or need to reschedule, feel free to reply to this email or respond through the applicant portal.",
      "",
      "Best regards,",
      "JPM Security Agency Recruitment Team",
    ]
      .filter(Boolean)
      .join("\n");


    const htmlMessage = `
      <div style="margin:0;padding:0;background:#f5f7fb;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
          <tr>
            <td align="center" style="padding:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%);padding:36px 24px;">
                    <img src="${logoUrl}" alt="JPM Security Agency" width="160" style="display:block;height:auto;margin:0 auto 12px auto;" />
                    <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.2px;">Interview Invitation</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                    <p style="margin:0 0 12px 0;">Hello <strong>${applicant.name || "Applicant"}</strong>,</p>
                    <p style="margin:0 0 16px 0;">${defaultMessage}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                      <tr>
                        <td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">Interview Details</td>
                      </tr>
                      <tr>
                        <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">${type === "range" ? "Date Range" : "Date"}</td>
                        <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${type === "range" ? `${formatDate(startDate)} - ${formatDate(endDate)}` : formatDate(date)}</td>
                      </tr>
                      ${
                        timeSummary
                          ? `<tr>
                               <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Time</td>
                               <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${formatTime(time)}</td>
                             </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
                ${
                  message?.trim()
                    ? `<tr>
                          <td style="padding:18px 24px 0 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
                              <tr>
                                <td style="padding:14px 16px 6px 16px;font-family:Arial,Helvetica,sans-serif;color:#9a3412;font-size:13px;font-weight:700;">Additional Information</td>
                              </tr>
                              <tr>
                                <td style="padding:0 16px 16px 16px;font-family:Arial,Helvetica,sans-serif;color:#7c2d12;font-size:14px;line-height:1.7;">${message.trim().replace(/\n/g, '<br />')}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:18px 24px 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;color:#1e3a8a;font-size:13px;line-height:1.7;">
                          Need to reschedule? Reply to this email or contact us through the applicant portal.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                    We look forward to meeting you.
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

    await sendMail({
      to: applicant.email,
      subject,
      text: plainMessage,
      html: htmlMessage,
    });

    res.status(200).json({ success: true, message: "Interview scheduled and email sent." });
  } catch (error) {
    console.error("Error sending interview email:", error);
    res.status(500).json({ message: "Failed to send interview email." });
  }
};

// 🎉 Send hire email
export const sendHireEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, guardId } = req.body; 

    if (!["Admin", "Subadmin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "You are not authorized." });
    }

    const applicant = await Applicant.findById(id);
    if (!applicant) return res.status(404).json({ message: "Applicant not found." });

    // 1. Find the Guard account associated with this applicant
    let guard;
    if (guardId) {
      guard = await Guard.findById(guardId);
    } else {
      guard = await Guard.findOne({ email: applicant.email });
    }
    if (!guard) return res.status(404).json({ message: "Guard account not found. Finalize hiring first." });

    // 2. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 3. Hash the token and save it to the database
    guard.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 4. Set expiration (Link valid for 48 hours)
    guard.resetPasswordExpire = Date.now() + 48 * 60 * 60 * 1000;

    await guard.save();

    // 5. Create the Activation URL
    const activationUrl = `https://www.jpmsecurityagency.com/set-password/${resetToken}`;

    // --- EMAIL CONTENT ---
    const subject = `Action Required: Activate Your Account`;
    const defaultMessage = "We are pleased to inform you that you have been officially selected for the position at JPM Security Agency.";

    // Plain Text Version
    const plainMessage = `
      Hello ${applicant.name || "Applicant"},
      
      ${defaultMessage}
      
      To access the Guard Portal, you must activate your account and set your own secure password.
      
      Click here: ${activationUrl}
      
      This link is valid for 48 hours.
      
      Best regards,
      JPM Security Agency Recruitment Team
    `;

    // Professional HTML Version (Copied Layout from Interview Email)
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
                    <p style="margin:0 0 12px 0;">Hello <strong>${applicant.name || "Applicant"}</strong>,</p>
                    <p style="margin:0 0 16px 0;">${defaultMessage}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                      <tr>
                        <td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">Hiring Details</td>
                      </tr>
                      <tr>
                        <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Position</td>
                        <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${guard.position || "Security Guard"}</td>
                      </tr>
                      <tr>
                        <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Account Status</td>
                        <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#ea580c;font-size:14px;font-weight:bold;">Pending Activation</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  message?.trim()
                    ? `<tr>
                          <td style="padding:0 24px 20px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
                              <tr>
                                <td style="padding:14px 16px 6px 16px;font-family:Arial,Helvetica,sans-serif;color:#9a3412;font-size:13px;font-weight:700;">Note from Admin</td>
                              </tr>
                              <tr>
                                <td style="padding:0 16px 16px 16px;font-family:Arial,Helvetica,sans-serif;color:#7c2d12;font-size:14px;line-height:1.7;">${message.trim().replace(/\n/g, '<br />')}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>`
                    : ""
                }

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

    await sendMail({
      to: guard.email,
      subject,
      text: plainMessage,
      html: htmlMessage,
    });

    res.status(200).json({ success: true, message: "Activation email sent." });

  } catch (error) {
    console.error("Error sending hire email:", error);
    res.status(500).json({ message: "Failed to send hire email." });
  }
};

// 🎉 Finalize hire email
export const finalizeHiring = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...guardData } = req.body;

    // 1. Check if Applicant exists
    const applicant = await Applicant.findById(id);
    if (!applicant) return res.status(404).json({ message: "Applicant not found." });

    // 2. Prevent Re-hiring (Safety Check)
    if (applicant.status === "Hired") {
      return res.status(400).json({ message: "This applicant is already marked as Hired." });
    }

    // 3. PRE-CHECK: Check if Guard Email or ID already exists manually
    // This prevents the code from running further if a duplicate is found
    const existingGuard = await Guard.findOne({
      $or: [{ email: guardData.email }, { guardId: guardData.guardId }]
    });

    if (existingGuard) {
      return res.status(409).json({ 
        message: `A guard with this Email (${guardData.email}) or ID (${guardData.guardId}) already exists.` 
      });
    }

    // 4. Generate placeholder password if missing
    if (!guardData.password) {
      guardData.password = crypto.randomBytes(16).toString("hex");
    }

    // 5. Create Guard (Safe to save now)
    const newGuard = new Guard(guardData);
    await newGuard.save();

    // 6. Update Applicant Status
    applicant.status = "Hired";
    applicant.dateOfHired = new Date();
    applicant.processedBy = req.user.id;
    await applicant.save();

    // 7. Send Activation Email
    const mockReq = {
      params: { id },
      user: req.user,
      body: {
        message: "Congratulations! Please activate your account.",
        guardId: newGuard._id,
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => console.log(`Activation email status: ${code}`, data)
      }),
    };

    await sendHireEmail(mockReq, mockRes);

    res.status(201).json({
      message: "Applicant hired. Activation email sent.",
      guard: newGuard
    });

  } catch (error) {
    console.error("Error finalizing hiring:", error);
    // Keep this as a backup, but the pre-check above should catch it first
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email or Guard ID already exists." });
    }
    res.status(500).json({ message: "Server error." });
  }
};

// 📝 Add or update interview remarks
export const addInterviewRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }

    applicant.interviewRemarks = remarks || "";
    const updatedApplicant = await applicant.save();

    res.status(200).json(updatedApplicant);
  } catch (error) {
    console.error("Error adding interview remarks:", error);
    res.status(500).json({ message: "Failed to add interview remarks." });
  }
};

// 📄 Download list of hired applicants for a specific month
export const downloadHiredList = async (req, res) => {
  try {
    let { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required." });
    }

    console.log("Requested month and year:", month, year);

    const monthMap = {
      January: 0, February: 1, March: 2, April: 3,
      May: 4, June: 5, July: 6, August: 7,
      September: 8, October: 9, November: 10, December: 11
    };

    month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

    const monthIndex = monthMap[month];
    if (monthIndex === undefined) {
      return res.status(400).json({ message: "Invalid month." });
    }

    const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59));

    const hiredApplicants = await Applicant.find({
      status: "Hired",
      dateOfHired: {  
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ dateOfHired: 'asc' });

    if (hiredApplicants.length === 0) {
      return res.status(404).json({ message: "No hired applicants found for the selected month." });
    }

    const pdfBuffer = await generateHiredApplicantsPDF(hiredApplicants, month, year);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Hired_Applicants_${month}_${year}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating hired applicants PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF." });
  }
};
