import LeaveRequest from "../models/leaveRequest.model.js";
import Schedule from "../models/schedule.model.js";

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
    .populate("guard", "fullName guardId position email")
    .populate("staff", "name email position role")
    .populate("reviewedBy", "name role");

const getOwnLeaveFilter = (user) => {
  if (user.role === "Guard") return { requesterRole: "Guard", guard: user._id };
  if (user.role === "Subadmin") return { requesterRole: "Subadmin", staff: user._id };
  return null;
};

const getScheduleConflictForGuard = async (guardId, dates) => {
  if (!guardId || dates.length === 0) return null;

  return Schedule.findOne({
    guardId,
    isApproved: { $ne: "Declined" },
    status: { $ne: "Cancelled" },
    ...buildScheduleDateMatch(dates),
  }).populate("guardId", "fullName guardId");
};

const getExistingLeaveOverlap = async (user, dates) => {
  const ownFilter = getOwnLeaveFilter(user);
  if (!ownFilter) return null;

  return LeaveRequest.findOne({
    ...ownFilter,
    status: { $in: ["Pending", "Approved"] },
    dates: { $in: dates },
  });
};

export const createLeaveRequest = async (req, res) => {
  try {
    if (!["Guard", "Subadmin"].includes(req.user?.role)) {
      return res.status(403).json({ message: "Only guards and subadmins can request leave." });
    }

    const dates = normalizeDates(req.body?.dates);
    const reason = String(req.body?.reason || "").trim();

    if (dates.length === 0) {
      return res.status(400).json({ message: "Please select at least one leave date." });
    }

    if (!reason) {
      return res.status(400).json({ message: "Leave reason is required." });
    }

    if (req.user.role === "Guard") {
      const conflictingSchedule = await getScheduleConflictForGuard(req.user._id, dates);
      if (conflictingSchedule) {
        return res.status(400).json({
          message: `Leave request denied. You already have a deployment on ${conflictingSchedule.timeIn.slice(0, 10)}.`,
        });
      }
    }

    const overlappingLeave = await getExistingLeaveOverlap(req.user, dates);
    if (overlappingLeave) {
      return res.status(400).json({
        message: "You already have a pending or approved leave request on one or more selected dates.",
      });
    }

    const leaveRequest = await LeaveRequest.create({
      requesterRole: req.user.role,
      guard: req.user.role === "Guard" ? req.user._id : null,
      staff: req.user.role === "Subadmin" ? req.user._id : null,
      dates,
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
          message: `Cannot approve leave. ${conflictingSchedule.guardId?.fullName || "This guard"} is scheduled on ${conflictingSchedule.timeIn.slice(0, 10)}.`,
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
      guardName: request.guard?.fullName || "Unknown Guard",
      dates: request.dates,
      reason: request.reason,
      status: request.status,
    }));

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deployment leave availability", error: error.message });
  }
};
