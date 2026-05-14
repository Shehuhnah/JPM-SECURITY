import LeaveRequest from "../models/leaveRequest.model.js";
import Schedule from "../models/schedule.model.js";
import Guard from "../models/guard.model.js";
import User from "../models/User.model.js";

const LEAVE_TYPES = ["Sick Leave", "Vacation Leave", "Paternity Leave", "Maternity Leave"];

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

const buildScheduleDateMatch = (dates) => ({
  $or: dates.map((date) => ({ timeIn: { $regex: `^${date}` } })),
});

const populateLeaveRequest = (query) =>
  query
    .populate("guard", "firstName lastName fullName guardId position email")
    .populate("staff", "name email position role")
    .populate("reviewedBy", "name role");

const getGuardDisplayName = (guard) => {
  if (!guard) return "Unknown Guard";
  const combinedName = `${guard.firstName || ""} ${guard.lastName || ""}`.trim();
  return combinedName || guard.fullName || "Unknown Guard";
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

const getScheduleConflictForGuard = async (guardId, dates) => {
  if (!guardId || dates.length === 0) return null;

  return Schedule.findOne({
    guardId,
    isApproved: { $ne: "Declined" },
    status: { $ne: "Cancelled" },
    ...buildScheduleDateMatch(dates),
  }).populate("guardId", "fullName guardId");
};

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

export const createLeaveRequest = async (req, res) => {
  try {
    if (!["Guard", "Subadmin", "Admin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "This account cannot request leave." });
    }

    const dates = normalizeDates(req.body?.dates);
    const reason = String(req.body?.reason || "").trim();
    const leaveType = String(req.body?.leaveType || "").trim();

    if (dates.length === 0) {
      return res.status(400).json({ message: "Please select at least one leave date." });
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
    let targetSex = req.user.role === "Guard" ? req.user.sex || "" : "";

    if (req.user.role === "Admin" && req.body?.targetRole && req.body?.targetId) {
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
        }).select("_id");

        if (!staff) {
          return res.status(404).json({ message: "Selected staff member was not found." });
        }

        targetStaffId = staff._id;
        targetGuardId = null;
        targetSex = "";
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

    if (targetRole === "Guard" && targetGuardId) {
      const conflictingSchedule = await getScheduleConflictForGuard(targetGuardId, dates);
      if (conflictingSchedule) {
        return res.status(400).json({
          message: `Leave request denied. This guard already has a deployment on ${conflictingSchedule.timeIn.slice(0, 10)}.`,
        });
      }
    }

    const targetFilter = getLeaveFilterForTarget({
      requesterRole: targetRole,
      guardId: targetGuardId,
      staffId: targetStaffId,
    });

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

    if (req.user.role === "Subadmin") {
      query.requesterRole = "Subadmin";
      query.staff = req.user._id;
    } else if (req.user.role !== "Admin") {
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

    if (!["Approved", "Declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid review status." });
    }

    const request = await LeaveRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Only pending leave requests can be reviewed." });
    }

    if (status === "Approved" && request.requesterRole === "Guard" && request.guard) {
      const conflictingSchedule = await getScheduleConflictForGuard(request.guard, request.dates);
      if (conflictingSchedule) {
        return res.status(400).json({
          message: `Cannot approve leave. ${getGuardDisplayName(conflictingSchedule.guardId) || "This guard"} is scheduled on ${conflictingSchedule.timeIn.slice(0, 10)}.`,
        });
      }
    }

    request.status = status;
    request.reviewRemarks = String(reviewRemarks).trim();
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    const populated = await populateLeaveRequest(LeaveRequest.findById(request._id));
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
