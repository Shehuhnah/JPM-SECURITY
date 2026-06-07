import AdminAttendance from "../models/AdminAttendance.model.js";
import { getAttendanceMinutesBreakdown, toHours } from "../utils/attendanceHours.js";
import { generateStaffAttendancePDF } from "../utils/workingHoursPdfGenerator.js";

const STAFF_ROLES = ["Admin", "Subadmin"];

const getDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const isStaff = (user) => STAFF_ROLES.includes(user?.role);

const getRequesterDisplayName = (user = {}) => {
  const combinedName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return combinedName || user?.fullName || user?.name || user?.email || "N/A";
};

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

const autoTimeoutExpiredRecords = async (userId) => {
  const now = new Date();
  const manilaString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const manilaNow = new Date(manilaString);
  const todayKey = getDateKey(now);

  const activeRecords = await AdminAttendance.find({
    user: userId,
    timeOut: null,
  });

  for (const record of activeRecords) {
    const recordDateKey = record.dateKey;
    const isPastDay = recordDateKey < todayKey;
    const isTodayAndPast9PM = recordDateKey === todayKey && manilaNow.getHours() >= 21;

    if (isPastDay || isTodayAndPast9PM) {
      const timeoutDate = new Date(`${recordDateKey}T21:00:00+08:00`);
      record.timeOut = timeoutDate;
      record.firstTimeIn = record.firstTimeIn || record.timeIn;
      record.accumulatedWorkedMinutes =
        Math.max(0, record.accumulatedWorkedMinutes || 0) +
        getWorkedMinutesFromSegment(record.timeIn, timeoutDate);
      record.status = "Timed Out";
      record.notes = (record.notes ? record.notes + " " : "") + "[Auto Timed Out at 9 PM]";
      await record.save();
    }
  }
};

export const getMyAttendanceDashboard = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can access this page." });
    }

    const userId = req.user._id;

    // Automatically timeout expired active records
    await autoTimeoutExpiredRecords(userId);

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

    const now = new Date();
    const manilaString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
    const manilaNow = new Date(manilaString);
    const manilaHour = manilaNow.getHours();

    if (manilaHour < 5) {
      return res.status(400).json({
        message: "You cannot time in before 5:00 AM (Philippine Time).",
      });
    }

    if (manilaHour >= 21) {
      return res.status(400).json({
        message: "You cannot time in after 9:00 PM (Philippine Time).",
      });
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

export const getStaffAttendanceByUserId = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can access staff attendance." });
    }

    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const records = await AdminAttendance.find({ user: userId }).sort({ dateKey: -1, createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching staff attendance by user:", error);
    res.status(500).json({ message: "Failed to load staff attendance." });
  }
};

/**
 * @desc  Download the logged-in staff's attendance as an A4 Landscape DTR PDF.
 * @route GET /api/admin-attendance/download-my-attendance?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access Private (Admin / Subadmin)
 */
export const downloadMyStaffAttendance = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can download this report." });
    }

    const userId = req.user._id;

    // Automatically timeout expired active records before generating PDF
    await autoTimeoutExpiredRecords(userId);

    const { from, to } = req.query;

    let startDate, endDate, periodCover;

    if (from && to) {
      // Parse as local Manila midnight
      startDate = new Date(`${from}T00:00:00+08:00`);
      endDate   = new Date(`${to}T23:59:59+08:00`);

      const fmtOpt = { timeZone: "Asia/Manila", month: "long", day: "numeric", year: "numeric" };
      const startLabel = startDate.toLocaleDateString("en-PH", fmtOpt);
      const endLabel   = endDate.toLocaleDateString("en-PH", fmtOpt);
      periodCover = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
    } else {
      // Default: current month first half
      const now   = new Date();
      const year  = now.getFullYear();
      const month = now.getMonth();
      startDate   = new Date(year, month, 1, 0, 0, 0, 0);
      endDate     = new Date(year, month, 15, 23, 59, 59, 999);
      periodCover = `${startDate.toLocaleString("default", { month: "long" })} 1-15, ${year}`;
    }

    // Fetch records in date range using dateKey (YYYY-MM-DD) for accuracy
    const startKey = getDateKey(startDate);
    const endKey   = getDateKey(endDate);

    const records = await AdminAttendance.find({
      user: userId,
      dateKey: { $gte: startKey, $lte: endKey },
      timeOut: { $ne: null },
    }).sort({ dateKey: 1 });

    if (records.length === 0) {
      return res.status(404).json({ message: "No completed attendance records found for the selected dates. Ongoing attendance is not included in DTR downloads." });
    }

    const staff = {
      name:     req.user.name     || "N/A",
      position: req.user.position || "",
      role:     req.user.role     || "Staff",
    };

    const pdfBuffer = await generateStaffAttendancePDF(staff, records, periodCover, {
      startDate,
      endDate,
      preparedBy: getRequesterDisplayName(req.user),
    });

    const safeName = staff.name.replace(/[^a-zA-Z0-9]/g, "_");
    const safeDate = `${from || startKey}_${to || endKey}`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=DTR_${safeName}_${safeDate}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating staff DTR PDF:", error);
    res.status(500).json({ message: "Failed to generate DTR PDF.", error: error.message });
  }
};
