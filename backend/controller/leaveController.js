import LeaveRequest from "../models/leaveRequest.model.js";
import Guard from "../models/guard.model.js";
import User from "../models/User.model.js";
import Attendance from "../models/Attendance.model.js";
import AdminAttendance from "../models/AdminAttendance.model.js";
import { sendMail } from "../utils/mailer.js";

const LEAVE_TYPES = ["Sick Leave", "Vacation Leave", "Paternity Leave", "Maternity Leave"];
const logoUrl = "https://jpm-security.onrender.com/assets/headerpdf/jpmlogo.png";

const normalizeDates = (dates = []) => {
  return [...new Set(
    dates
      .map((date) => {
        if (!date) return null;
        if (typeof date === "string") {
          return date.includes("T") ? date.slice(0, 10) : date.slice(0, 10);
        }
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString().slice(0, 10);
      })
      .filter(Boolean)
  )].sort();
};

const expandDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const dates = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const populateLeaveRequest = (query) =>
  query
    .populate("guard", "firstName lastName fullName guardId position email")
    .populate("staff", "name email position role")
    .populate("reviewedBy", "name role")
    .populate("revokedBy", "name role")
    .populate("editHistory.editedBy", "name role");

const getGuardDisplayName = (guard) => {
  if (!guard) return "Unknown Guard";
  const combinedName = `${guard.firstName || ""} ${guard.lastName || ""}`.trim();
  return combinedName || guard.fullName || "Unknown Guard";
};

const getLeaveRequester = (request) => {
  const person = request.requesterRole === "Guard" ? request.guard : request.staff;
  if (!person) return { name: "Personnel", email: "" };

  const name =
    request.requesterRole === "Guard"
      ? getGuardDisplayName(person)
      : `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.name || request.requesterRole;

  return {
    name,
    email: person.email || "",
  };
};

const leaveEmailDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const formatLeaveEmailDate = (value) => {
  if (!value) return "";
  const dateValue = typeof value === "string" ? value.slice(0, 10) : value;
  const date = new Date(typeof dateValue === "string" ? `${dateValue}T00:00:00` : dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return leaveEmailDateFormatter.format(date);
};

const formatLeaveDates = (dates = []) => {
  if (!Array.isArray(dates) || dates.length === 0) return "No dates listed";
  return dates
    .map(formatLeaveEmailDate)
    .filter(Boolean)
    .join(", ");
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendLeaveStatusEmail = async (request, status, remarks = "") => {
  const { name, email } = getLeaveRequester(request);
  if (!email) {
    console.warn(`Leave ${status} email skipped: requester has no email. Leave ID: ${request._id}`);
    return;
  }

  const statusText = status.toLowerCase();
  const subject = `Leave Request ${status} - JPM Security`;
  const reviewer = request.reviewedBy?.name || request.revokedBy?.name || "JPM Security";
  const note = String(remarks || "").trim();
  const dates = formatLeaveDates(request.dates);
  const safeName = escapeHtml(name);
  const safeLeaveType = escapeHtml(request.leaveType);
  const safeStatus = escapeHtml(status);
  const safeStatusText = escapeHtml(statusText);
  const safeReviewer = escapeHtml(reviewer);
  const safeDates = escapeHtml(dates);
  const safeNote = escapeHtml(note);
  const statusTheme = {
    Approved: {
      header: "linear-gradient(135deg,#065f46 0%,#059669 50%,#10b981 100%)",
      panelBg: "#ecfdf5",
      panelBorder: "#a7f3d0",
      panelText: "#065f46",
    },
    Declined: {
      header: "linear-gradient(135deg,#7f1d1d 0%,#dc2626 50%,#ef4444 100%)",
      panelBg: "#fef2f2",
      panelBorder: "#fecaca",
      panelText: "#991b1b",
    },
    Revoked: {
      header: "linear-gradient(135deg,#7c2d12 0%,#ea580c 50%,#f97316 100%)",
      panelBg: "#fff7ed",
      panelBorder: "#fed7aa",
      panelText: "#9a3412",
    },
  }[status] || {
    header: "linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)",
    panelBg: "#eff6ff",
    panelBorder: "#bfdbfe",
    panelText: "#1e3a8a",
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
                  <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.2px;">Leave Request ${safeStatus}</div>
                  <div style="font-family:Arial,Helvetica,sans-serif;color:rgba(255,255,255,0.9);font-size:14px;margin-top:5px;">Personnel Leave Update</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.7;">
                  <p style="margin:0 0 12px 0;">Hello <strong>${safeName}</strong>,</p>
                  <p style="margin:0 0 16px 0;">Your <strong>${safeLeaveType}</strong> request has been <strong>${safeStatusText}</strong>. Please review the details below.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 0 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <tr>
                      <td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;font-weight:700;">Leave Details</td>
                    </tr>
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Leave Type</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safeLeaveType}</td>
                    </tr>
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Dates</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safeDates}</td>
                    </tr>
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Status</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:14px;font-weight:bold;">${safeStatus}</td>
                    </tr>
                    <tr>
                      <td style="width:36%;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#475569;font-size:13px;font-weight:600;">Processed By</td>
                      <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px;">${safeReviewer}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${
                note
                  ? `<tr>
                      <td style="padding:18px 24px 0 24px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${statusTheme.panelBg};border:1px solid ${statusTheme.panelBorder};border-radius:10px;">
                          <tr>
                            <td style="padding:14px 16px 6px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:13px;font-weight:700;">Review Note</td>
                          </tr>
                          <tr>
                            <td style="padding:0 16px 16px 16px;font-family:Arial,Helvetica,sans-serif;color:${statusTheme.panelText};font-size:14px;line-height:1.7;">${safeNote.replace(/\n/g, "<br />")}</td>
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
                        Please contact HR if you have questions about this leave update.
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

  const text = [
    `Hello ${name},`,
    `Your ${request.leaveType} request has been ${statusText}.`,
    `Dates: ${dates}`,
    `Status: ${status}`,
    `Processed by: ${reviewer}`,
    note ? `Note: ${note}` : "",
    "Please contact HR if you have questions about this update.",
  ].filter(Boolean).join("\n");

  try {
    await sendMail({ to: email, subject, html, text });
  } catch (error) {
    console.error(`Failed to send leave ${statusText} email:`, error.message);
  }
};

const getLeaveFilterForTarget = ({ requesterRole, guardId = null, staffId = null }) => {
  if (requesterRole === "Guard" && guardId) return { requesterRole: "Guard", guard: guardId };
  if (["Admin", "Subadmin"].includes(requesterRole) && staffId) {
    return { requesterRole, staff: staffId };
  }
  return null;
};

const getOwnLeaveFilter = (user) =>
  getLeaveFilterForTarget({
    requesterRole: user.role,
    guardId: user.role === "Guard" ? user._id : null,
    staffId: ["Admin", "Subadmin"].includes(user.role) ? user._id : null,
  });

const getExistingLeaveOverlap = async (targetFilter, dates) => {
  if (!targetFilter) return null;

  return LeaveRequest.findOne({
    ...targetFilter,
    status: { $in: ["Pending", "Approved"] },
    dates: { $in: dates },
  });
};

const getAllowedLeaveTypes = (sex) => {
  if (sex === "Male") {
    return ["Sick Leave", "Vacation Leave", "Paternity Leave"];
  }

  if (sex === "Female") {
    return ["Sick Leave", "Vacation Leave", "Maternity Leave"];
  }

  return ["Sick Leave", "Vacation Leave"];
};

const toManilaDateKey = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
};

const getAttendanceOverlapDates = async ({ requesterRole, guardId = null, staffId = null }, dates) => {
  if (!Array.isArray(dates) || dates.length === 0) return [];

  if (requesterRole === "Guard" && guardId) {
    const records = await Attendance.find({ guard: guardId }).select("timeIn createdAt");
    const attendanceDates = new Set(
      records
        .map((record) => toManilaDateKey(record.timeIn || record.createdAt))
        .filter(Boolean)
    );
    return dates.filter((date) => attendanceDates.has(date));
  }

  if (["Admin", "Subadmin"].includes(requesterRole) && staffId) {
    const records = await AdminAttendance.find({ user: staffId }).select("dateKey timeIn createdAt");
    const attendanceDates = new Set(
      records
        .map((record) => record.dateKey || toManilaDateKey(record.timeIn || record.createdAt))
        .filter(Boolean)
    );
    return dates.filter((date) => attendanceDates.has(date));
  }

  return [];
};

const resolveRequestTargets = (request) => ({
  requesterRole: request.requesterRole,
  guardId: request.guard?._id || request.guard || null,
  staffId: request.staff?._id || request.staff || null,
});

export const createLeaveRequest = async (req, res) => {
  try {
    if (!["Guard", "Subadmin", "Admin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "This account cannot request leave." });
    }

    const startDate = String(req.body?.startDate || "").slice(0, 10);
    const endDate = String(req.body?.endDate || "").slice(0, 10);
    const excludedDates = normalizeDates(req.body?.excludedDates);
    const explicitDates = normalizeDates(req.body?.dates);
    const rangedDates = expandDateRange(startDate, endDate).filter((date) => !excludedDates.includes(date));
    const dates = explicitDates.length > 0 ? explicitDates : rangedDates;
    const reason = String(req.body?.reason || "").trim();
    const leaveType = String(req.body?.leaveType || "").trim();

    if (dates.length === 0) {
      return res.status(400).json({ message: "Please select a valid leave date range with at least one included date." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Leave start date and end date are required." });
    }

    if (startDate > endDate) {
      return res.status(400).json({ message: "Leave end date must be on or after the start date." });
    }

    if (!LEAVE_TYPES.includes(leaveType)) {
      return res.status(400).json({ message: "Leave type is required." });
    }

    if (!reason) {
      return res.status(400).json({ message: "Leave reason is required." });
    }

    let targetRole = req.user.role;
    let targetGuardId = req.user.role === "Guard" ? req.user._id : null;
    let targetStaffId = ["Admin", "Subadmin"].includes(req.user.role) ? req.user._id : null;
    let targetSex = req.user.sex || "";

    if (["Admin", "Subadmin"].includes(req.user.role) && req.body?.targetRole && req.body?.targetId) {
      targetRole = req.body.targetRole;

      if (!["Guard", "Admin", "Subadmin"].includes(targetRole)) {
        return res.status(400).json({ message: "Invalid leave target role." });
      }

      if (targetRole === "Guard") {
        const guard = await Guard.findById(req.body.targetId).select("_id sex");
        if (!guard) {
          return res.status(404).json({ message: "Selected guard was not found." });
        }
        targetGuardId = guard._id;
        targetStaffId = null;
        targetSex = guard.sex || "";
      } else {
        const staff = await User.findOne({
          _id: req.body.targetId,
          role: targetRole,
        }).select("_id sex");

        if (!staff) {
          return res.status(404).json({ message: "Selected staff member was not found." });
        }

        targetStaffId = staff._id;
        targetGuardId = null;
        targetSex = staff.sex || "";
      }
    }

    const allowedLeaveTypes = getAllowedLeaveTypes(targetSex);
    if (!allowedLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        message:
          targetSex === "Male"
            ? "Maternity leave is only allowed for female personnel."
            : targetSex === "Female"
              ? "Paternity leave is only allowed for male personnel."
              : "This personnel can only request sick leave or vacation leave.",
      });
    }

    const targetFilter = getLeaveFilterForTarget({
      requesterRole: targetRole,
      guardId: targetGuardId,
      staffId: targetStaffId,
    });

    const attendanceConflicts = await getAttendanceOverlapDates(
      { requesterRole: targetRole, guardId: targetGuardId, staffId: targetStaffId },
      dates
    );
    if (attendanceConflicts.length > 0) {
      return res.status(400).json({
        message: `Selected date${attendanceConflicts.length > 1 ? "s already have attendance records" : " already has an attendance record"} for this person: ${attendanceConflicts.join(", ")}.`,
      });
    }

    const overlappingLeave = await getExistingLeaveOverlap(targetFilter, dates);
    if (overlappingLeave) {
      return res.status(400).json({
        message: "There is already a pending or approved leave request on one or more selected dates for this person.",
      });
    }

    const leaveRequest = await LeaveRequest.create({
      requesterRole: targetRole,
      guard: targetRole === "Guard" ? targetGuardId : null,
      staff: ["Admin", "Subadmin"].includes(targetRole) ? targetStaffId : null,
      dates,
      startDate,
      endDate,
      excludedDates,
      leaveType,
      reason,
    });

    const populated = await populateLeaveRequest(LeaveRequest.findById(leaveRequest._id));
    res.status(201).json(populated);
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ message: "Error creating leave request", error: error.message });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const ownFilter = getOwnLeaveFilter(req.user);
    if (!ownFilter) {
      return res.status(403).json({ message: "This account cannot access leave requests." });
    }

    const requests = await populateLeaveRequest(
      LeaveRequest.find(ownFilter).sort({ createdAt: -1 })
    );

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leave requests", error: error.message });
  }
};

export const getLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (!["Admin", "Subadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view leave requests." });
    }

    const requests = await populateLeaveRequest(
      LeaveRequest.find(query).sort({ createdAt: -1 })
    );

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leave requests", error: error.message });
  }
};

export const reviewLeaveRequest = async (req, res) => {
  try {
    const { status, reviewRemarks = "" } = req.body;
    const trimmedRemarks = String(reviewRemarks).trim();

    if (!["Admin", "Subadmin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Not authorized to review leave requests." });
    }

    if (!["Approved", "Declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid review status." });
    }

    if (status === "Declined" && !trimmedRemarks) {
      return res.status(400).json({ message: "A reason is required when declining a leave request." });
    }

    const request = await LeaveRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Only pending leave requests can be reviewed." });
    }

    request.status = status;
    request.reviewRemarks = trimmedRemarks;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    const populated = await populateLeaveRequest(LeaveRequest.findById(request._id));
    await sendLeaveStatusEmail(populated, status, trimmedRemarks);
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error reviewing leave request", error: error.message });
  }
};

export const getDeploymentLeaveAvailability = async (req, res) => {
  try {
    const leaveRequests = await populateLeaveRequest(
      LeaveRequest.find({
        requesterRole: "Guard",
        status: "Approved",
      }).sort({ createdAt: -1 })
    );

    const payload = leaveRequests.map((request) => ({
      _id: request._id,
      guardId: request.guard?._id || null,
      guardName: getGuardDisplayName(request.guard),
      dates: request.dates,
      reason: request.reason,
      status: request.status,
    }));

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deployment leave availability", error: error.message });
  }
};

/**
 * @desc    Revoke an approved leave request
 * @route   PATCH /api/leaves/:id/revoke
 * @access  Admin, Subadmin
 */
export const revokeLeaveRequest = async (req, res) => {
  try {
    if (!["Admin", "Subadmin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Not authorized to revoke leave requests." });
    }

    const revokeReason = String(req.body?.revokeReason || "").trim();
    if (!revokeReason) {
      return res.status(400).json({ message: "A reason is required to revoke an approved leave." });
    }

    const request = await LeaveRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (request.status !== "Approved") {
      return res.status(400).json({ message: "Only approved leave requests can be revoked." });
    }

    request.status = "Revoked";
    request.revokeReason = revokeReason;
    request.revokedBy = req.user._id;
    request.revokedAt = new Date();
    await request.save();

    const populated = await populateLeaveRequest(LeaveRequest.findById(request._id));
    await sendLeaveStatusEmail(populated, "Revoked", revokeReason);
    res.status(200).json(populated);
  } catch (error) {
    console.error("Error revoking leave request:", error);
    res.status(500).json({ message: "Error revoking leave request", error: error.message });
  }
};

/**
 * @desc    Edit an approved leave request (dates, type, reason) — logs history
 * @route   PATCH /api/leaves/:id/edit
 * @access  Admin, Subadmin
 */
export const editLeaveRequest = async (req, res) => {
  try {
    if (!["Admin", "Subadmin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Not authorized to edit leave requests." });
    }

    const editReason = String(req.body?.editReason || "").trim();
    if (!editReason) {
      return res.status(400).json({ message: "An edit reason is required." });
    }

    const request = await LeaveRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (request.status !== "Approved") {
      return res.status(400).json({ message: "Only approved leave requests can be edited." });
    }

    // Snapshot previous values before applying changes
    const historyEntry = {
      editedBy: req.user._id,
      editedAt: new Date(),
      editReason,
      previousDates: [...(request.dates || [])],
      previousStartDate: request.startDate,
      previousEndDate: request.endDate,
      previousLeaveType: request.leaveType,
      previousReason: request.reason,
    };

    // Apply new values if provided
    const newStartDate = String(req.body?.startDate || request.startDate).slice(0, 10);
    const newEndDate   = String(req.body?.endDate   || request.endDate).slice(0, 10);
    const newExcluded  = req.body?.excludedDates ? normalizeDates(req.body.excludedDates) : request.excludedDates;
    const newDates     = req.body?.dates ? normalizeDates(req.body.dates) : request.dates;
    const newLeaveType = String(req.body?.leaveType || request.leaveType).trim();
    const newReason    = String(req.body?.reason    || request.reason).trim();

    if (!LEAVE_TYPES.includes(newLeaveType)) {
      return res.status(400).json({ message: "Invalid leave type." });
    }

    if (newDates.length === 0) {
      return res.status(400).json({ message: "At least one leave date is required." });
    }

    const attendanceConflicts = await getAttendanceOverlapDates(
      resolveRequestTargets(request),
      newDates
    );
    if (attendanceConflicts.length > 0) {
      return res.status(400).json({
        message: `Selected date${attendanceConflicts.length > 1 ? "s already have attendance records" : " already has an attendance record"} for this person: ${attendanceConflicts.join(", ")}.`,
      });
    }

    request.startDate    = newStartDate;
    request.endDate      = newEndDate;
    request.excludedDates = newExcluded;
    request.dates        = newDates;
    request.leaveType    = newLeaveType;
    request.reason       = newReason;
    request.editHistory.push(historyEntry);

    await request.save();

    const populated = await populateLeaveRequest(LeaveRequest.findById(request._id));
    res.status(200).json(populated);
  } catch (error) {
    console.error("Error editing leave request:", error);
    res.status(500).json({ message: "Error editing leave request", error: error.message });
  }
};
