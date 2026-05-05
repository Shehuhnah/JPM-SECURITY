import AdminAttendance from "../models/AdminAttendance.model.js";
import { getAttendanceMinutesBreakdown, toHours } from "../utils/attendanceHours.js";

const STAFF_ROLES = ["Admin", "Subadmin"];

const getDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const isStaff = (user) => STAFF_ROLES.includes(user?.role);

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const getWorkedMinutesFromSegment = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0;

  const start = new Date(timeIn);
  const end = new Date(timeOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, Math.round((end - start) / 60000));
};

export const getMyAttendanceDashboard = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can access this page." });
    }

    const userId = req.user._id;
    const todayKey = getDateKey();
    const { start, end } = getMonthRange();

    const [todayRecord, recentRecords, monthlyRecords] = await Promise.all([
      AdminAttendance.findOne({ user: userId, dateKey: todayKey }).sort({ createdAt: -1 }),
      AdminAttendance.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
      AdminAttendance.find({
        user: userId,
        timeIn: { $gte: start, $lte: end },
      }).sort({ createdAt: -1 }),
    ]);

    let totalMinutesThisMonth = 0;
    let regularMinutesThisMonth = 0;
    let overtimeMinutesThisMonth = 0;
    for (const record of monthlyRecords) {
      const breakdown = getAttendanceMinutesBreakdown(record);
      totalMinutesThisMonth += breakdown.totalMinutes;
      regularMinutesThisMonth += breakdown.regularMinutes;
      overtimeMinutesThisMonth += breakdown.overtimeMinutes;
    }

    res.status(200).json({
      todayRecord,
      recentRecords,
      stats: {
        presentDaysThisMonth: monthlyRecords.length,
        totalHoursThisMonth: toHours(totalMinutesThisMonth),
        regularHoursThisMonth: toHours(regularMinutesThisMonth),
        overtimeHoursThisMonth: toHours(overtimeMinutesThisMonth),
        currentStatus: todayRecord?.status || "Not Timed In",
      },
    });
  } catch (error) {
    console.error("Error fetching admin attendance dashboard:", error);
    res.status(500).json({ message: "Failed to load attendance dashboard." });
  }
};

export const timeInStaff = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can time in." });
    }

    const todayKey = getDateKey();
    const existing = await AdminAttendance.findOne({ user: req.user._id, dateKey: todayKey });
    if (existing) {
      if (!existing.timeOut) {
        return res.status(400).json({
          message: "You are already timed in today.",
        });
      }

      if (!existing.firstTimeIn) {
        existing.firstTimeIn = existing.timeIn;
      }

      if (!Number.isFinite(existing.accumulatedWorkedMinutes)) {
        existing.accumulatedWorkedMinutes = getWorkedMinutesFromSegment(existing.timeIn, existing.timeOut);
      }

      existing.timeIn = new Date();
      existing.timeOut = null;
      existing.status = "Timed In";
      if (typeof req.body?.notes === "string") {
        existing.notes = req.body.notes.trim();
      }
      await existing.save();

      return res.status(200).json(existing);
    }

    const record = await AdminAttendance.create({
      user: req.user._id,
      dateKey: todayKey,
      timeIn: new Date(),
      firstTimeIn: new Date(),
      notes: req.body?.notes?.trim?.() || "",
    });

    res.status(201).json(record);
  } catch (error) {
    console.error("Error timing in staff:", error);
    res.status(500).json({ message: "Failed to time in." });
  }
};

export const timeOutStaff = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can time out." });
    }

    const record = await AdminAttendance.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!record) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    if (record.timeOut) {
      return res.status(400).json({ message: "You already timed out for this record." });
    }

    record.timeOut = new Date();
    record.firstTimeIn = record.firstTimeIn || record.timeIn;
    record.accumulatedWorkedMinutes =
      Math.max(0, record.accumulatedWorkedMinutes || 0) +
      getWorkedMinutesFromSegment(record.timeIn, record.timeOut);
    record.status = "Timed Out";
    if (typeof req.body?.notes === "string") {
      record.notes = req.body.notes.trim();
    }
    await record.save();

    res.status(200).json(record);
  } catch (error) {
    console.error("Error timing out staff:", error);
    res.status(500).json({ message: "Failed to time out." });
  }
};
