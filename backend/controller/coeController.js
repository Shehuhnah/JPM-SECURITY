import COERequest from "../models/COERequest.model.js";
import mongoose from "mongoose";
import { generateAndSaveCOE } from "../utils/pdfGenerator.js";
import Guard from "../models/guard.model.js";
import User from "../models/User.model.js";
import fs from "fs";
import path from "path";
import { sendMail } from "../utils/mailer.js";

const logoUrl = "https://jpm-security.onrender.com/assets/headerpdf/jpmlogo.png";

const getDisplayName = (person) => {
  if (!person) return "";

  const firstName = person.firstName?.trim() || "";
  const lastName = person.lastName?.trim() || "";
  const combinedName = `${firstName} ${lastName}`.trim();

  return combinedName || person.fullName?.trim() || person.name?.trim() || "";
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getCOERequester = (request) => {
  const person = request.requesterRole === "guard" ? request.guard : request.subadmin;
  return {
    name: getDisplayName(person) || "Personnel",
    email: person?.email || "",
  };
};

const formatEmailDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const sendCOEStatusEmail = async (request) => {
  const { name, email } = getCOERequester(request);
  if (!email) {
    console.warn(`COE ${request.status} email skipped: requester has no email. ID: ${request._id}`);
    return;
  }

  const status = request.status;
  const statusText = status.toLowerCase();
  const notes = status === "Declined"
    ? String(request.declineReason || "").trim()
    : String(request.approvedCOE?.adminComments || "").trim();
  const subject = `COE Request ${status} - JPM Security`;
  const safeName = escapeHtml(name);
  const safeStatus = escapeHtml(status);
  const safeStatusText = escapeHtml(statusText);
  const safePurpose = escapeHtml(request.purpose);
  const safeProcessedBy = escapeHtml(request.processedBy || "JPM Security");
  const safeIssuedDate = escapeHtml(formatEmailDate(request.approvedCOE?.issuedDate));
  const safeNotes = escapeHtml(notes);
  const statusTheme = status === "Accepted"
    ? {
        header: "linear-gradient(135deg,#065f46 0%,#059669 50%,#10b981 100%)",
        panelBg: "#ecfdf5",
        panelBorder: "#a7f3d0",
        panelText: "#065f46",
      }
    : {
        header: "linear-gradient(135deg,#7f1d1d 0%,#dc2626 50%,#ef4444 100%)",
        panelBg: "#fef2f2",
        panelBorder: "#fecaca",
        panelText: "#991b1b",
      };

  const html = `
    <div style="margin:0;padding:0;background:#f5f7fb;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
        <tr>
          <td align="center" style="padding:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);">
              <tr>
                <td align="center" style="background:${statusTheme.header};padding:36px 24px;color:#ffffff;">
                  <img src="${logoUrl}" alt="JPM Security Agency" width="160" style="display:block;height:auto;margin:0 auto 12px auto;" />
                  <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.2px;">COE Request ${safeStatus}</div>
                  <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,0.9);font-size:14px;margin-top:5px;">Certificate of Employment Update</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                  <p style="margin:0 0 12px 0;">Hello <strong>${safeName}</strong>,</p>
                  <p style="margin:0 0 16px 0;">Your Certificate of Employment request has been <strong>${safeStatusText}</strong>. Please review the details below.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 0 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <tr>
                      <td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">COE Request Details</td>
                    </tr>
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Purpose</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safePurpose}</td>
                    </tr>
                    ${status === "Accepted" ? `<tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Issued Date</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safeIssuedDate}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Status</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:14px;font-weight:bold;">${safeStatus}</td>
                    </tr>
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Processed By</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safeProcessedBy}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${notes ? `<tr>
                <td style="padding:18px 24px 0 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${statusTheme.panelBg};border:1px solid ${statusTheme.panelBorder};border-radius:10px;">
                    <tr>
                      <td style="padding:14px 16px 6px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:13px;font-weight:700;">Review Note</td>
                    </tr>
                    <tr>
                      <td style="padding:0 16px 16px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:14px;line-height:1.7;">${safeNotes.replace(/\n/g, "<br />")}</td>
                    </tr>
                  </table>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding:18px 24px 0 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                    <tr>
                      <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;color:#1e3a8a;font-size:13px;line-height:1.7;">
                        Please contact HR if you have questions about this COE request update.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 24px 26px 24px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;border-top:1px solid #e2e8f0;">
                  Best regards,<br />
                  <strong>JPM Security Agency HR Team</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    `Hello ${name},`,
    `Your Certificate of Employment request has been ${statusText}.`,
    `Purpose: ${request.purpose}`,
    status === "Accepted" && request.approvedCOE?.issuedDate ? `Issued date: ${formatEmailDate(request.approvedCOE.issuedDate)}` : "",
    `Status: ${status}`,
    `Processed by: ${request.processedBy || "JPM Security"}`,
    notes ? `Note: ${notes}` : "",
    "Please contact HR if you have questions about this update.",
  ].filter(Boolean).join("\n");

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (error) {
    console.error(`Failed to send COE ${statusText} email:`, error.message);
  }
};

// Create new COE request (guard or subadmin)
export const createRequest = async (req, res) => {
  try {
    const { purpose, targetRole, targetId } = req.body;
    if (!purpose || !purpose.trim()) 
      return res.status(400).json({ message: "Purpose is required" });

    const user = req.user;
    if (!user) 
      return res.status(401).json({ message: "Unauthorized: user not authenticated" });

    // Determine role
    let requesterRole = (user.role || "guard").toLowerCase();
    if (!["guard", "subadmin", "admin"].includes(requesterRole)) {
      return res.status(403).json({ message: "This account cannot request a COE." });
    }

    let guard = requesterRole === "guard" ? user._id : undefined;
    let subadmin = requesterRole === "guard" ? undefined : user._id;

    if (user.role === "Admin" && targetRole && targetId) {
      const normalizedTargetRole = String(targetRole).toLowerCase();

      if (!["guard", "admin", "subadmin"].includes(normalizedTargetRole)) {
        return res.status(400).json({ message: "Invalid target role." });
      }

      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ message: "Invalid target user." });
      }

      if (normalizedTargetRole === "guard") {
        const targetGuard = await Guard.findById(targetId).select("_id");
        if (!targetGuard) return res.status(404).json({ message: "Target guard not found." });
        requesterRole = "guard";
        guard = targetGuard._id;
        subadmin = undefined;
      } else {
        const roleLabel = normalizedTargetRole === "admin" ? "Admin" : "Subadmin";
        const targetStaff = await User.findOne({ _id: targetId, role: roleLabel }).select("_id");
        if (!targetStaff) return res.status(404).json({ message: "Target staff not found." });
        requesterRole = normalizedTargetRole;
        guard = undefined;
        subadmin = targetStaff._id;
      }
    }

    // Create request with correct reference based on role
    const newReq = await COERequest.create({
      guard,
      subadmin,
      purpose,
      requesterRole,
    });

    res.status(201).json(newReq);
  } catch (err) {
    console.error('createRequest error:', err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
};


// List requests (admin) or filter
export const listRequests = async (req, res) => {
  try {
    const { status, userId, q } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 10);
    const filter = {};
    if (status && status !== "All") filter.status = status;
    if (userId) filter.$or = [{ guard: userId }, { subadmin: userId }];

    const items = await COERequest.find(filter)
      .populate('guard', 'firstName lastName fullName email guardId phoneNumber position createdAt')
      .populate('subadmin', 'name email position contactNumber createdAt')
      .sort({ requestedAt: -1 });

    // normalize for frontend
    const normalizedItems = items.map(item => {
      const isGuard = item.requesterRole === 'guard';
      const person = isGuard ? item.guard : item.subadmin;
      return {
        id: item._id,
        name: getDisplayName(person) || "N/A",
        guardId: isGuard ? item.guard?.guardId || "N/A" : item.subadmin?._id.toString(),
        phone: isGuard ? item.guard?.phoneNumber || "N/A" : item.subadmin?.contactNumber || "N/A",
        email: person?.email || "N/A",
        position: person?.position || "Undefined",
        createdAt: person?.createdAt,
        purpose: item.purpose,
        status: item.status,
        requesterRole: item.requesterRole,
        requestedAt: item.requestedAt,
        processedAt: item.processedAt,
        processedBy: item.processedBy,
        declineReason: item.declineReason,
        raw: item,
      };
    });

    // optional name search
    let filteredItems = q
      ? normalizedItems.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))
      : normalizedItems;

    // optional date range filter (based on requestedAt)
    const { dateFrom, dateTo } = req.query;
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : null;
      const to   = dateTo   ? new Date(`${dateTo}T23:59:59.999Z`)   : null;
      filteredItems = filteredItems.filter(i => {
        if (!i.requestedAt) return false;
        const ts = new Date(i.requestedAt);
        if (from && ts < from) return false;
        if (to   && ts > to)   return false;
        return true;
      });
    }

    const total = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

    res.json({ items: paginatedItems, total, page, limit, totalPages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get requests for current user (support guard or subadmin accounts)
export const getMyRequests = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    // Ensure role comparison is case-insensitive if roles might vary in capitalization
    const userRole = user.role?.toLowerCase(); 

    if (userRole === "guard") {
      filter.guard = user._id;
    } else if (userRole === "admin" || userRole === "subadmin") {
      filter.subadmin = user._id;
    } else {
      // If the user's role is not recognized, return no requests
      return res.json({ items: [] });
    }

    const items = await COERequest.find(filter)
      .populate('guard', 'firstName lastName fullName email guardId createdAt')
      .populate('subadmin', 'name email position contactNumber createdAt')
      .sort({ requestedAt: -1 });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single request
export const getRequest = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    const reqObj = await COERequest.findById(id)
    .populate('guard', 'firstName lastName fullName email guardId phoneNumber position createdAt')
    .populate('subadmin', 'name email position contactNumber createdAt'); // <-- add this

    if (!reqObj) return res.status(404).json({ message: "Not found" });
    res.json(reqObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update status: accept or decline
export const updateStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { action, declineReason, approvedCOE } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) 
      return res.status(400).json({ message: "Invalid id" });

    // Populate both guard and subadmin
    const reqObj = await COERequest.findById(id)
      .populate('guard', 'firstName lastName fullName email guardId phoneNumber position createdAt')
      .populate('subadmin', 'name email position contactNumber createdAt');

    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    const processedBy = req.user?.name || req.user?.fullName || req.user?.email || "Admin";

    if (action === "accept") {
      reqObj.status = "Accepted";
      reqObj.processedAt = new Date();
      reqObj.processedBy = processedBy;

      const approved = approvedCOE || {};

      // Determine the requester (guard or subadmin)
      const person = reqObj.requesterRole === "guard" ? reqObj.guard : reqObj.subadmin;
      
      const empStartDate = approved.employmentStartDate || (person?.createdAt ? new Date(person.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "November 1, 2023");

      reqObj.approvedCOE = {
        documentNumber: approved.documentNumber || `COE-${reqObj._id}-${new Date().getFullYear()}`,
        issuedDate: approved.issuedDate || new Date(),
        issuedBy: approved.issuedBy || processedBy,
        validUntil: approved.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        position: approved.position || person?.position || "Undefined",
        employmentStartDate: empStartDate,
        employmentEndDate: approved.employmentEndDate || "current date",
        salary: approved.salary || "",
        signatory: approved.signatory || processedBy,
        signatoryTitle: approved.signatoryTitle || req.user?.position || "HR and Head Administrator",
        signatureDataUrl: approved.signatureDataUrl || req.user?.eSignature || "",
        workSchedule: approved.workSchedule || "",
        adminComments: approved.adminComments || "",
        pdfUrl: approved.pdfUrl || null,
        qrCodeUrl: approved.qrCodeUrl || null,
      };

      await reqObj.save();

      // Generate PDF server-side
      try {
        const { fileName, publicPath } = await generateAndSaveCOE(reqObj);
        const host = req.get('host');
        const protocol = req.protocol;
        reqObj.approvedCOE.pdfUrl = `${protocol}://${host}${publicPath}`;
        await reqObj.save();
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr);
      }

      await sendCOEStatusEmail(reqObj);
      return res.json(reqObj);
    }

    if (action === "decline") {
      reqObj.status = "Declined";
      reqObj.declineReason = declineReason || "No reason provided";
      reqObj.processedAt = new Date();
      reqObj.processedBy = processedBy;
      await reqObj.save();
      await sendCOEStatusEmail(reqObj);
      return res.json(reqObj);
    }

    res.status(400).json({ message: "Invalid action" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Download or redirect to PDF (if available)
export const downloadCOE = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    const reqObj = await COERequest.findById(id).populate('guard', 'firstName lastName fullName email guardId');
    if (!reqObj) return res.status(404).json({ message: "Not found" });

    if (reqObj.status !== "Accepted" || !reqObj.approvedCOE) return res.status(404).json({ message: "COE not available" });

    if (reqObj.approvedCOE.pdfUrl) {
      // If pdfUrl is stored (local path or remote), redirect or stream
      return res.redirect(reqObj.approvedCOE.pdfUrl);
    }

    // For now, no server-side PDF generation implemented. Respond with object instead.
    res.json({ message: "PDF not generated server-side yet", approvedCOE: reqObj.approvedCOE });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete requests (bulk)
export const deleteRequests = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    // Optional: Delete associated PDF files if they exist
    const uploadsDir = path.join(process.cwd(), 'backend', 'uploads', 'coe');
    for (const id of ids) {
      const filePath = path.join(uploadsDir, `COE_${id}.pdf`);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileErr) {
          console.error(`Failed to delete file for request ${id}:`, fileErr);
        }
      }
    }

    const result = await COERequest.deleteMany({ _id: { $in: ids } });

    res.json({ 
      message: `${result.deletedCount} request(s) deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error("deleteRequests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  createRequest,
  listRequests,
  getMyRequests,
  getRequest,
  updateStatus,
  downloadCOE,
  deleteRequests,
};
