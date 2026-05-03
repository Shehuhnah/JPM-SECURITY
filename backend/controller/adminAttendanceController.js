import AdminAttendance from "../models/AdminAttendance.model.js";
import AdminReport from "../models/AdminReport.model.js";

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

const toHours = (minutes) => Number((minutes / 60).toFixed(2));

export const getMyAttendanceDashboard = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can access this page." });
    }

    const userId = req.user._id;
    const todayKey = getDateKey();
    const { start, end } = getMonthRange();

    const [todayRecord, recentRecords, monthlyRecords, reportCount] = await Promise.all([
      AdminAttendance.findOne({ user: userId, dateKey: todayKey }).sort({ createdAt: -1 }),
      AdminAttendance.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
      AdminAttendance.find({
        user: userId,
        timeIn: { $gte: start, $lte: end },
      }).sort({ createdAt: -1 }),
      AdminReport.countDocuments({ createdBy: userId }),
    ]);

    let totalMinutesThisMonth = 0;
    for (const record of monthlyRecords) {
      if (!record.timeIn || !record.timeOut) continue;
      totalMinutesThisMonth += Math.max(
        0,
        Math.round((new Date(record.timeOut) - new Date(record.timeIn)) / 60000)
      );
    }

    res.status(200).json({
      todayRecord,
      recentRecords,
      stats: {
        presentDaysThisMonth: monthlyRecords.length,
        totalHoursThisMonth: toHours(totalMinutesThisMonth),
        reportsCreated: reportCount,
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
      return res.status(400).json({
        message: existing.timeOut
          ? "You already completed attendance for today."
          : "You are already timed in today.",
      });
    }

    const record = await AdminAttendance.create({
      user: req.user._id,
      dateKey: todayKey,
      timeIn: new Date(),
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
