import Applicant from "../models/applicant.model.js";
import { sendMail } from "../utils/mailer.js";

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

    if (req.user?.role !== "Subadmin") {
      return res.status(403).json({ message: "Only subadmins can send interview emails." });
    }

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }
    if (!applicant.email) {
      return res.status(400).json({ message: "Applicant email is missing." });
    }

    const dateSummary =
      type === "range"
        ? `Date Range: ${formatDate(startDate)} - ${formatDate(endDate)}`
        : `Date: ${formatDate(date)}`;
    const timeSummary = time ? `Time: ${formatTime(time)}` : null;

    const subject = `Interview Invitation${applicant.position ? ` - ${applicant.position}` : ""}`;
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

    const logoUrl = "http://localhost:5000/assets/headerpdf/jpmlogo.png";

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
                    <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,.9);font-size:14px;margin-top:6px;">Confidential Communication</div>
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
                      ${
                        applicant.position
                          ? `<tr>
                               <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Position</td>
                               <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${applicant.position}</td>
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending interview email:", error);
    res.status(500).json({ message: "Failed to send interview email." });
  }
};

// 🎉 Send hire email
export const sendHireEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (req.user?.role !== "Subadmin") {
      return res.status(403).json({ message: "Only subadmins can send hire emails." });
    }

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }
    if (!applicant.email) {
      return res.status(400).json({ message: "Applicant email is missing." });
    }

    const subject = `Congratulations! You've Been Hired${applicant.position ? ` - ${applicant.position}` : ""}`;
    const defaultMessage =
      "We are pleased to inform you that you have been selected for the position at JPM Security Agency. Welcome to our team!";

    const plainMessage = [
      `Dear ${applicant.name || "Applicant"},`,
      "",
      "🎉 Congratulations!",
      "",
      defaultMessage,
      "",
      message?.trim() ? `${message.trim()}\n` : undefined,
      "We will be in touch soon with further details regarding your onboarding process.",
      "",
      "If you have any questions, please feel free to reach out.",
      "",
      "Best regards,",
      "JPM Security Agency Recruitment Team",
    ]
      .filter(Boolean)
      .join("\n");

      const logoUrl = "http://localhost:5000/assets/headerpdf/jpmlogo.png";



    const htmlMessage = `
      <div style="margin:0;padding:0;background:#f5f7fb;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
          <tr>
            <td align="center" style="padding:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#065f46 0%,#059669 50%,#10b981 100%);padding:36px 24px;">
                    <img src="${logoUrl}" alt="JPM Security Agency" width="160" style="display:block;height:auto;margin:0 auto 12px auto;" />
                    <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.2px;">Congratulations</div>
                    <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,.9);font-size:14px;margin-top:6px;">Offer of Employment</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                    <p style="margin:0 0 12px 0;">Dear <strong>${applicant.name || "Applicant"}</strong>,</p>
                    <p style="margin:0 0 16px 0;">${defaultMessage}</p>
                  </td>
                </tr>
                ${
                  applicant.position
                    ? `<tr>
                         <td style="padding:0 24px 0 24px;">
                           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
                             <tr>
                               <td style="padding:14px 16px 6px 16px;font-family:Arial,Helvetica,sans-serif;color:#166534;font-size:13px;font-weight:700;">Position</td>
                             </tr>
                             <tr>
                               <td style="padding:0 16px 16px 16px;font-family:Arial,Helvetica,sans-serif;color:#15803d;font-size:16px;font-weight:700;">${applicant.position}</td>
                             </tr>
                           </table>
                         </td>
                       </tr>`
                    : ""
                }
                ${
                  message?.trim()
                    ? `<tr>
                         <td style="padding:18px 24px 0 24px;">
                           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                             <tr>
                               <td style="padding:14px 16px 6px 16px;font-family:Arial,Helvetica,sans-serif;color:#1e40af;font-size:13px;font-weight:700;">Additional Details</td>
                             </tr>
                             <tr>
                               <td style="padding:0 16px 16px 16px;font-family:Arial,Helvetica,sans-serif;color:#1e3a8a;font-size:14px;line-height:1.7;">${message.trim().replace(/\n/g, '<br />')}</td>
                             </tr>
                           </table>
                         </td>
                       </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:18px 24px 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;color:#155e75;font-size:13px;line-height:1.7;">
                          Our team will contact you shortly with onboarding steps including start date, required documents, and training schedule.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                    Welcome aboard. We’re excited to have you join us.
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 24px 26px 24px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;border-top:1px solid #e2e8f0;">
                    Sincerely,<br />
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending hire email:", error);
    res.status(500).json({ message: "Failed to send hire email." });
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
