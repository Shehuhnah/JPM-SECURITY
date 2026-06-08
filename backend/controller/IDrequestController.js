import IDRequest from "../models/IDRequest.model.js";
import mongoose from "mongoose";
import Guard from "../models/guard.model.js";
import User from "../models/User.model.js";
import { sendMail } from "../utils/mailer.js";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const ALLOWED_REQUEST_TYPES = ["ID only", "Lanyard only", "ID with lanyard"];
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

const getRequestRecipient = (request) => {
  const person = request.guard || request.admin;
  return {
    name: getDisplayName(person) || "Personnel",
    email: person?.email || "",
  };
};

const formatEmailDateTime = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isValidPickupDateTime = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const day = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return day >= 1 && day <= 5 && (hours > 6 || hours === 6) && (hours < 21 || (hours === 21 && minutes === 0));
};

const sendIDRequestStatusEmail = async (request, status) => {
  const { name, email } = getRequestRecipient(request);
  if (!email) {
    console.warn(`ID request ${status} email skipped: requester has no email. ID: ${request._id}`);
    return;
  }

  const statusText = status.toLowerCase();
  const notes = String(request.adminRemarks || "").trim();
  const subject = `ID Request ${status} - JPM Security`;
  const safeName = escapeHtml(name);
  const safeStatus = escapeHtml(status);
  const safeStatusText = escapeHtml(statusText);
  const safeRequestType = escapeHtml(request.requestType);
  const safePickupDate = escapeHtml(formatEmailDateTime(request.pickupDate));
  const safeNotes = escapeHtml(notes);
  const statusTheme = status === "Approved"
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
                  <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.2px;">ID Request ${safeStatus}</div>
                  <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,0.9);font-size:14px;margin-top:5px;">Personnel ID Update</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                  <p style="margin:0 0 12px 0;">Hello <strong>${safeName}</strong>,</p>
                  <p style="margin:0 0 16px 0;">Your <strong>${safeRequestType}</strong> request has been <strong>${safeStatusText}</strong>. Please review the details below.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 0 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <tr>
                      <td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">ID Request Details</td>
                    </tr>
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Request Type</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safeRequestType}</td>
                    </tr>
                    ${status === "Approved" ? `<tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Pickup Date & Time</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safePickupDate}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Status</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:14px;font-weight:bold;">${safeStatus}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${notes ? `<tr>
                <td style="padding:18px 24px 0 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${statusTheme.panelBg};border:1px solid ${statusTheme.panelBorder};border-radius:10px;">
                    <tr>
                      <td style="padding:14px 16px 6px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:13px;font-weight:700;">Admin Notes</td>
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
                        Please contact HR if you have questions about this ID request update.
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
    `Your ${request.requestType} request has been ${statusText}.`,
    status === "Approved" ? `Pickup date and time: ${formatEmailDateTime(request.pickupDate)}` : "",
    `Status: ${status}`,
    notes ? `Notes: ${notes}` : "",
    "Please contact HR if you have questions about this update.",
  ].filter(Boolean).join("\n");

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (error) {
    console.error(`Failed to send ID request ${statusText} email:`, error.message);
  }
};

// --- CREATE REQUEST ---
export const createRequest = async (req, res) => {
  try {
    const { requestType, requestReason, targetRole, targetId } = req.body;

    if (!requestType || !requestReason) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!ALLOWED_REQUEST_TYPES.includes(String(requestType).trim())) {
      return res.status(400).json({ message: "Invalid request type selected." });
    }

    // Identify user type based on the decoded token
    const userId = req.user._id;
    const userRole = req.user.role; // "Guard", "Admin", or "Subadmin"

    const requestData = {
      requestType,
      requestReason,
    };

    if ((userRole === "Admin" || userRole === "Subadmin") && targetRole && targetId) {
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
        requestData.guard = targetGuard._id;
      } else {
        const roleLabel = normalizedTargetRole === "admin" ? "Admin" : "Subadmin";
        const targetStaff = await User.findOne({ _id: targetId, role: roleLabel }).select("_id");
        if (!targetStaff) return res.status(404).json({ message: "Target staff not found." });
        requestData.admin = targetStaff._id;
      }
    } else if (userRole === "Guard") {
      requestData.guard = userId;
    } else {
      requestData.admin = userId; // <--- Uses the new field for Admin/Subadmin
    }

    const now = new Date();
    const activeStatusFilter = {
      $or: [
        { status: "Pending" },
        { status: "Approved", pickupDate: { $exists: false } },
        { status: "Approved", pickupDate: null },
        { status: "Approved", pickupDate: { $gte: now } },
      ],
    };
    const activeRequestFilter = requestData.guard
      ? { guard: requestData.guard, ...activeStatusFilter }
      : { admin: requestData.admin, ...activeStatusFilter };

    const existingActiveRequest = await IDRequest.findOne(activeRequestFilter).select("_id status pickupDate");
    if (existingActiveRequest) {
      const message =
        existingActiveRequest.status === "Pending"
          ? "You already have a pending ID request. Please wait for admin review before submitting another request."
          : "You already have an approved ID request scheduled for pickup. Please complete that request before submitting another one.";
      return res.status(409).json({ message });
    }

    const newRequest = await IDRequest.create(requestData);

    res.status(201).json({
      success: true,
      message: "ID request submitted successfully.",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error creating ID request:", error);
    res.status(500).json({ message: "Server error creating ID request." });
  }
};

// --- GET ALL REQUESTS (For Admin Dashboard) ---
export const getAllRequests = async (req, res) => {
  try {
    const shouldPaginate =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.status !== undefined ||
      req.query.q !== undefined;

    if (!shouldPaginate) {
      const requests = await IDRequest.find()
        .populate("guard", "firstName lastName fullName position email guardId")
        .populate("admin", "name firstName lastName email position role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const status = req.query.status;
    const q = req.query.q?.trim().toLowerCase();

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    const requests = await IDRequest.find(filter)
      .populate("guard", "firstName lastName fullName position email guardId")
      .populate("admin", "name firstName lastName email position role")
      .sort({ createdAt: -1 });

    let filteredRequests = q
      ? requests.filter((request) => {
          const guardName = getDisplayName(request.guard).toLowerCase();
          const adminName = getDisplayName(request.admin).toLowerCase();
          const requestType = request.requestType?.toLowerCase() || "";
          return guardName.includes(q) || adminName.includes(q) || requestType.includes(q);
        })
      : requests;

    // optional date range filter (based on createdAt)
    const { dateFrom, dateTo } = req.query;
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : null;
      const to   = dateTo   ? new Date(`${dateTo}T23:59:59.999Z`)   : null;
      filteredRequests = filteredRequests.filter(r => {
        if (!r.createdAt) return false;
        const ts = new Date(r.createdAt);
        if (from && ts < from) return false;
        if (to   && ts > to)   return false;
        return true;
      });
    }

    const total = filteredRequests.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const items = filteredRequests.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      count: total,
      data: items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching ID requests:", error);
    res.status(500).json({ message: "Server error fetching ID requests." });
  }
};

// --- GET MY REQUESTS (For logged-in user) ---
export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find requests where either 'guard' matches OR 'admin' matches the user ID
    const myRequests = await IDRequest.find({
      $or: [
        { guard: userId },
        { admin: userId }
      ]
    })
    .populate("guard", "firstName lastName fullName email guardId")
    .populate("admin", "name firstName lastName email role")
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: myRequests.length,
      data: myRequests,
    });
  } catch (error) {
    console.error("Error fetching your requests:", error);
    res.status(500).json({ message: "Server error fetching your requests." });
  }
};

// --- GET SINGLE REQUEST BY ID ---
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const request = await IDRequest.findById(id)
      .populate("guard", "firstName lastName fullName email guardId")
      .populate("admin", "name firstName lastName email position role");

    if (!request) {
      return res.status(404).json({ message: "ID request not found." });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error fetching ID request:", error);
    res.status(500).json({ message: "Server error fetching ID request." });
  }
};

// --- UPDATE REQUEST (Approve/Decline) ---
export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, pickupDate } = req.body;

    if (!["Approved", "Declined", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const updateFields = {
      status,
      adminRemarks: adminRemarks || "",
    };

    if (status === "Approved") {
      if (!pickupDate) {
        return res.status(400).json({ message: "Pickup date and time is required for approved ID requests." });
      }
      if (!isValidPickupDateTime(pickupDate)) {
        return res.status(400).json({ message: "Pickup must be scheduled on a weekday between 6:00 AM and 9:00 PM." });
      }
      updateFields.pickupDate = pickupDate;
    }

    const updatedRequest = await IDRequest.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    )
    .populate("guard", "firstName lastName fullName email guardId")
    .populate("admin", "name firstName lastName email position role");

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (["Approved", "Declined"].includes(status)) {
      await sendIDRequestStatusEmail(updatedRequest, status);
    }

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully.`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating ID request:", error);
    res.status(500).json({ message: "Server error updating ID request." });
  }
};

// --- DELETE REQUEST ---
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const deletedRequest = await IDRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    res.status(200).json({ success: true, message: "Request deleted successfully." });
  } catch (error) {
    console.error("Error deleting ID request:", error);
    res.status(500).json({ message: "Server error deleting ID request." });
  }
};

// --- DELETE REQUEST (Bulk) ---
export const deleteRequests = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided." });
    }

    const result = await IDRequest.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ 
      success: true, 
      message: `${result.deletedCount} request(s) deleted successfully.`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("Error bulk deleting ID requests:", error);
    res.status(500).json({ message: "Server error bulk deleting ID requests." });
  }
};
