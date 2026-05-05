import LeaveRequest from "../models/leaveRequest.model.js";

const getManilaDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const attachCurrentLeaveStatusToGuards = async (guards) => {
  const guardList = Array.isArray(guards) ? guards : [guards].filter(Boolean);
  if (guardList.length === 0) {
    return Array.isArray(guards) ? [] : null;
  }

  const todayKey = getManilaDateKey();
  const guardIds = guardList.map((guard) => guard._id?.toString()).filter(Boolean);

  const activeLeaves = await LeaveRequest.find({
    requesterRole: "Guard",
    guard: { $in: guardIds },
    status: "Approved",
    dates: todayKey,
  })
    .select("guard dates status")
    .lean();

  const guardsOnLeave = new Set(
    activeLeaves.map((leave) => leave.guard?.toString()).filter(Boolean)
  );

  const withStatus = guardList.map((guard) => {
    const plainGuard =
      typeof guard?.toObject === "function" ? guard.toObject() : { ...guard };

    if (plainGuard.status === "Active" && guardsOnLeave.has(plainGuard._id?.toString())) {
      plainGuard.status = "On Leave";
    }

    return plainGuard;
  });

  return Array.isArray(guards) ? withStatus : withStatus[0] || null;
};
