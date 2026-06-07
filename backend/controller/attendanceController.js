import Attendance from "../models/Attendance.model.js";
import Schedule from "../models/schedule.model.js";
import Guard from "../models/guard.model.js";
import LeaveRequest from "../models/leaveRequest.model.js";
import { generateWorkHoursByClientPDF, generateStaffAttendancePDF } from "../utils/workingHoursPdfGenerator.js";
import { getAttendanceMinutesBreakdown } from "../utils/attendanceHours.js";

const getGuardDisplayName = (guard = {}) => {
  const combinedName = `${guard?.firstName || ""} ${guard?.lastName || ""}`.trim();
  return combinedName || guard?.fullName || "Unknown Guard";
};

const getRequesterDisplayName = (user = {}) => {
  const combinedName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return combinedName || user?.fullName || user?.name || user?.email || "N/A";
};

const parseAsPHT = (value) =>
  value ? new Date(`${String(value).slice(0, 16)}:00+08:00`) : null;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getManilaDateKey = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const getManilaDateLabel = (value) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const getLastDayOfMonth = (year, month) => new Date(year, month, 0).getDate();

const getAttendanceRecordDate = (attendance) =>
  attendance?.timeIn
    ? new Date(attendance.timeIn)
    : parseAsPHT(attendance?.scheduleId?.timeIn);

const getAttendanceStatusPriority = (attendance) => {
  const status = attendance?.status || "";
  if (status === "On Duty") return 4;
  if (status === "Off Duty" || status === "Present") return 3;
  if (status === "Leave") return 2;
  if (status === "Absent") return 1;
  return 0;
};

const sortAttendanceForDisplay = (a, b) => {
  const dateA = getAttendanceRecordDate(a);
  const dateB = getAttendanceRecordDate(b);
  const timeA = dateA && !Number.isNaN(dateA.getTime()) ? dateA.getTime() : 0;
  const timeB = dateB && !Number.isNaN(dateB.getTime()) ? dateB.getTime() : 0;

  if (timeA !== timeB) {
    return timeB - timeA;
  }

  const priorityDiff = getAttendanceStatusPriority(b) - getAttendanceStatusPriority(a);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
};

const isScheduleOnDate = (schedule, dateKey) => {
  if (!schedule?.timeIn && !schedule?.timeOut) return false;
  return String(schedule.timeIn || "").slice(0, 10) === dateKey || String(schedule.timeOut || "").slice(0, 10) === dateKey;
};

const attachTodayStatuses = async (records) => {
  const todayKey = getManilaDateKey();
  const now = new Date();
  const guardIds = [
    ...new Set(records.map((record) => record.guard?._id?.toString()).filter(Boolean)),
  ];

  if (guardIds.length === 0) return records;

  const [todaySchedules, todayAttendance, todayLeaves] = await Promise.all([
    Schedule.find({
      guardId: { $in: guardIds },
      isApproved: "Approved",
      status: { $ne: "Cancelled" },
    }).select("guardId client deploymentLocation position shiftType timeIn timeOut"),
    Attendance.find({ guard: { $in: guardIds } })
      .select("guard scheduleId timeIn status")
      .populate({ path: "scheduleId", select: "timeIn timeOut" }),
    LeaveRequest.find({
      requesterRole: "Guard",
      guard: { $in: guardIds },
      status: "Approved",
      dates: todayKey,
    }).select("guard"),
  ]);

  const schedulesByGuard = new Map();
  todaySchedules
    .filter((schedule) => isScheduleOnDate(schedule, todayKey))
    .forEach((schedule) => {
      const guardId = schedule.guardId?.toString();
      if (!guardId) return;
      const current = schedulesByGuard.get(guardId);
      const currentStart = current ? parseAsPHT(current.timeIn)?.getTime() || Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      const nextStart = parseAsPHT(schedule.timeIn)?.getTime() || Number.MAX_SAFE_INTEGER;
      if (!current || nextStart < currentStart) schedulesByGuard.set(guardId, schedule);
    });

  const attendedGuardIds = new Set(
    todayAttendance
      .filter((attendance) => {
        if (!attendance.timeIn) return false;
        const timeInKey = getManilaDateKey(attendance.timeIn);
        const scheduleKeyMatches = isScheduleOnDate(attendance.scheduleId, todayKey);
        return timeInKey === todayKey || scheduleKeyMatches;
      })
      .map((attendance) => attendance.guard?.toString())
      .filter(Boolean)
  );

  const leaveGuardIds = new Set(
    todayLeaves.map((leave) => leave.guard?.toString()).filter(Boolean)
  );

  return records.map((record) => {
    const guardId = record.guard?._id?.toString();
    const todaySchedule = schedulesByGuard.get(guardId);
    let todayStatus = "Off Duty";

    if (leaveGuardIds.has(guardId)) {
      todayStatus = "On Leave";
    } else if (attendedGuardIds.has(guardId)) {
      todayStatus = "On Duty";
    } else if (todaySchedule) {
      const shiftStart = parseAsPHT(todaySchedule.timeIn);
      todayStatus = shiftStart && now >= shiftStart ? "Absent" : "Off Duty";
    }

    const objectRecord = typeof record.toObject === "function" ? record.toObject() : record;
    return {
      ...objectRecord,
      todayStatus,
      todaySchedule: todaySchedule ? todaySchedule.toObject() : null,
    };
  });
};

const markMissedScheduleAbsences = async ({ guardId = null } = {}) => {
  const now = new Date();
  const scheduleQuery = {
    isApproved: "Approved",
    status: { $ne: "Cancelled" },
  };

  if (guardId) {
    scheduleQuery.guardId = guardId;
  }

  const schedules = await Schedule.find(scheduleQuery).select("guardId timeIn timeOut");
  const endedSchedules = schedules.filter((schedule) => {
    const shiftEnd = parseAsPHT(schedule.timeOut);
    return shiftEnd && shiftEnd < now;
  });

  if (endedSchedules.length === 0) {
    return 0;
  }

  const scheduleIds = endedSchedules.map((schedule) => schedule._id);
  const existingAttendance = await Attendance.find({ scheduleId: { $in: scheduleIds } }).select("scheduleId");
  const attendedScheduleIds = new Set(existingAttendance.map((attendance) => attendance.scheduleId.toString()));

  const absentRecords = endedSchedules
    .filter((schedule) => !attendedScheduleIds.has(schedule._id.toString()))
    .map((schedule) => ({
      guard: schedule.guardId,
      scheduleId: schedule._id,
      status: "Absent",
      remarks: "No attendance recorded for scheduled duty.",
    }));

  if (absentRecords.length === 0) {
    return 0;
  }

  const result = await Attendance.bulkWrite(
    absentRecords.map((record) => ({
      updateOne: {
        filter: { scheduleId: record.scheduleId },
        update: { $setOnInsert: record },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  return result.upsertedCount || 0;
};

const isScheduleWithinCurrentDay = (schedule, now = new Date()) => {
  if (!schedule?.timeIn || !schedule?.timeOut) {
    return false;
  }

  // Use the Manila calendar date for "now" so PHT midnight boundaries are respected.
  const todayKey = getManilaDateKey(now);

  // IMPORTANT: schedule.timeIn / timeOut are stored as timezone-naive strings
  // (e.g. "2026-05-17T19:00:00"). Passing them through `new Date()` on a UTC
  // server incorrectly shifts them +8 h, turning a 7 PM PHT night-shift into
  // "2026-05-18" and blocking the guard from timing in.
  // Fix: treat the stored string as PHT by slicing the raw YYYY-MM-DD prefix.
  const timeInKey  = String(schedule.timeIn).slice(0, 10);
  const timeOutKey = String(schedule.timeOut).slice(0, 10);

  return timeInKey === todayKey || timeOutKey === todayKey;
};

const getLateRemark = (scheduledTimeIn, actualTimeIn) => {
  if (!scheduledTimeIn || !actualTimeIn) return "";

  const scheduledDate = parseAsPHT(scheduledTimeIn);
  const actualDate = new Date(actualTimeIn);

  if (Number.isNaN(scheduledDate.getTime()) || Number.isNaN(actualDate.getTime())) {
    return "";
  }

  const diffMinutes = Math.floor((actualDate.getTime() - scheduledDate.getTime()) / (1000 * 60));
  return diffMinutes > 0 ? "late" : "";
};

/**
 * @desc    Guard performs time-in for a specific schedule
 * @route   POST /api/attendance/time-in
 * @access  Private (Guard)
 */

export const createAttendance = async (req, res) => {
  try {
    const guardId = req.user.id;
    const { scheduleId, location, photo } = req.body;
    await markMissedScheduleAbsences({ guardId });

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    if (schedule.guardId?.toString() !== guardId) {
      return res.status(403).json({ message: "You can only time in for your own schedule." });
    }

    if (schedule.isApproved !== "Approved") {
      return res.status(400).json({ message: "This schedule is not approved for attendance yet." });
    }

    if (!isScheduleWithinCurrentDay(schedule)) {
      return res.status(400).json({
        message: "You can only time in for a schedule assigned for today.",
      });
    }

    // --- Shift time-window enforcement ---
    // Schedule strings are stored as naive PHT datetimes ("YYYY-MM-DDTHH:MM").
    // Append +08:00 so Date() parses them correctly against UTC server time.
    const shiftStart = parseAsPHT(schedule.timeIn);
    const shiftEnd   = parseAsPHT(schedule.timeOut);
    const now        = new Date();
    const EARLY_BUFFER_MS = 2 * 60 * 60 * 1000; // allow time-in up to 2 h before shift starts

    if (shiftEnd && now > shiftEnd) {
      return res.status(400).json({
        message: `This ${schedule.shiftType} has already ended. Please select the correct shift.`,
      });
    }

    if (shiftStart && now < new Date(shiftStart.getTime() - EARLY_BUFFER_MS)) {
      const startLabel = String(schedule.timeIn).slice(11, 16);
      return res.status(400).json({
        message: `This ${schedule.shiftType} starts at ${startLabel}. Time-in is only available from 2 hours before the shift begins.`,
      });
    }

    const existingAttendance = await Attendance.findOne({ scheduleId });
    if (existingAttendance) {
      return res.status(400).json({ message: "You have already timed in for this schedule." });
    }


    const remarks = getLateRemark(schedule.timeIn, now);

    const newAttendance = new Attendance({
      guard: guardId,
      scheduleId,
      timeIn: now,
      location,
      photo,
      status: "On Duty",
      remarks,
    });

    await newAttendance.save();
    res.status(201).json(newAttendance);

  } catch (error) {
    console.error("Error creating attendance:", error);
    res.status(500).json({ message: "Server error during time-in." });
  }
};

/**
 * @desc    Guard performs time-out for a specific shift
 * @route   PATCH /api/attendance/time-out/:attendanceId
 * @access  Private (Guard)
 */
export const updateAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id; 
    const guardId = req.user.id;
    const { photo } = req.body;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found. Cannot time out." });
    }

    if (attendance.guard.toString() !== guardId) {
      return res.status(403).json({ message: "You are not authorized to modify this record." });
    }

    if (attendance.timeOut) {
      return res.status(400).json({ message: "You have already timed out for this shift." });
    }

    if (!photo) {
      return res.status(400).json({ message: "A time-out photo is required." });
    }

    attendance.timeOut = new Date();
    attendance.timeOutPhoto = photo;
    attendance.status = "Off Duty";
    const minutesBreakdown = getAttendanceMinutesBreakdown({
      timeIn: attendance.timeIn,
      timeOut: attendance.timeOut,
      scheduleId: attendance.scheduleId,
    });
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendanceId).populate({
        path: 'scheduleId',
        select: 'client deploymentLocation timeIn timeOut'
    }).populate({
        path: 'guard',
        select: 'firstName lastName fullName'
    });

    res.status(200).json({
      ...populatedAttendance.toObject(),
      workSummary: {
        regularHours: Number((minutesBreakdown.regularMinutes / 60).toFixed(2)),
        overtimeHours: Number((minutesBreakdown.overtimeMinutes / 60).toFixed(2)),
        totalHours: Number((minutesBreakdown.totalMinutes / 60).toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error updating attendance (time-out):", error);
    res.status(500).json({ message: "Server error during time-out." });
  }
};

/**
 * @desc    Get all attendance records (for Admin/Subadmin)
 * @route   GET /api/attendance
 * @access  Private (Admin, Subadmin)
 */
export const getAttendances = async (req, res) => {
  try {
    await markMissedScheduleAbsences();

    const shouldPaginate =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.status !== undefined ||
      req.query.client !== undefined ||
      req.query.q !== undefined ||
      req.query.from !== undefined ||
      req.query.to !== undefined;

    if (!shouldPaginate) {
      const attendances = await Attendance.find()
        .populate({
            path: 'guard',
            select: 'firstName lastName fullName email guardId'
        })
        .populate({
            path: 'scheduleId',
            select: 'client deploymentLocation position shiftType timeIn timeOut'
        });

      attendances.sort(sortAttendanceForDisplay);

      return res.json(await attachTodayStatuses(attendances));
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const status = req.query.status;
    const client = req.query.client;
    const q = req.query.q?.trim().toLowerCase();
    const from = req.query.from;
    const to = req.query.to;

    const attendances = await Attendance.find()
      .populate({
          path: 'guard',
          select: 'firstName lastName fullName email guardId' 
      })
      .populate({
          path: 'scheduleId',
          select: 'client deploymentLocation position shiftType timeIn timeOut'
      });

    const filteredAttendances = attendances.filter((attendance) => {
      const recordClient = attendance.scheduleId?.client || "";
      const guardName = getGuardDisplayName(attendance.guard).toLowerCase();
      const recordStatus = attendance.status || "";

      if (status && status !== "All" && recordStatus.toLowerCase() !== status.toLowerCase()) {
        return false;
      }

      if (client && recordClient.toLowerCase() !== client.toLowerCase()) {
        return false;
      }

      if (q && !guardName.includes(q)) {
        return false;
      }

      if (from || to) {
        const recordDate = getAttendanceRecordDate(attendance);
        if (!recordDate || Number.isNaN(recordDate.getTime())) {
          return false;
        }

        recordDate.setHours(0, 0, 0, 0);

        if (from) {
          const fromDate = new Date(from);
          fromDate.setHours(0, 0, 0, 0);
          if (recordDate < fromDate) {
            return false;
          }
        }

        if (to) {
          const toDate = new Date(to);
          toDate.setHours(0, 0, 0, 0);
          if (recordDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });

    filteredAttendances.sort(sortAttendanceForDisplay);

    const uniqueRecords = [];
    const seen = new Set();

    for (const attendance of filteredAttendances) {
      const guardId = attendance.guard?._id?.toString();
      const recordClient = attendance.scheduleId?.client || "Unassigned Client";
      const key = `${recordClient}:${guardId}`;

      if (!guardId || seen.has(key)) {
        continue;
      }

      seen.add(key);
      uniqueRecords.push(attendance);
    }

    const recordsWithTodayStatuses = await attachTodayStatuses(uniqueRecords);
    const total = recordsWithTodayStatuses.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const items = recordsWithTodayStatuses.slice(startIndex, startIndex + limit);

    res.json({ items, total, page, limit, totalPages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all attendance for a specific guard
 * @route   GET /api/attendance/:id
 * @access  Private
 */
export const getGuardAttendance = async (req, res) => {
  try {
    const guardId = req.params.id;
    await markMissedScheduleAbsences({ guardId });

    const shouldPaginate =
      req.query.page !== undefined ||
      req.query.limit !== undefined;

    if (!shouldPaginate) {
      const attendance = await Attendance.find({ guard: guardId })
        .populate({
            path: 'scheduleId',
            select: 'client deploymentLocation shiftType timeIn timeOut'
        });

      attendance.sort(sortAttendanceForDisplay);

      return res.json(attendance);
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ guard: guardId })
      .populate({
          path: 'scheduleId',
          select: 'client deploymentLocation shiftType timeIn timeOut'
      });
    attendance.sort(sortAttendanceForDisplay);
    const total = attendance.length;
    const items = attendance.slice(skip, skip + limit);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Generate and download a PDF report of a guard's working hours
 * @route   GET /api/attendance/download-working-hours/:id
 * @access  Private
 */
export const downloadWorkHours = async (req, res) => {
    try {
        const guardId = req.params.id;
        const guard = await Guard.findById(guardId);
        if (!guard) {
            return res.status(404).json({ message: "Guard not found" });
        }

        const { from, to } = req.query;
        let startDate, endDate, periodCover;

        if (from && to) {
            startDate = new Date(`${from}T00:00:00+08:00`);
            endDate   = new Date(`${to}T23:59:59+08:00`);

            const fmtOpt = { timeZone: "Asia/Manila", month: "long", day: "numeric", year: "numeric" };
            const startLabel = startDate.toLocaleDateString("en-PH", fmtOpt);
            const endLabel   = endDate.toLocaleDateString("en-PH", fmtOpt);
            periodCover = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
        } else {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();

            if (today.getDate() <= 15) {
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month, 15);
                periodCover = `${startDate.toLocaleString('default', { month: 'long' })} 1-15, ${year}`;
            } else {
                startDate = new Date(year, month, 16);
                endDate = new Date(year, month + 1, 0); 
                periodCover = `${startDate.toLocaleString('default', { month: 'long' })} 16-${endDate.getDate()}, ${year}`;
            }
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        const allAttendance = await Attendance.find({ guard: guardId }).populate('scheduleId');

        const attendanceRecords = allAttendance.filter(record => {
            if (!record.timeIn || !record.timeOut) return false;
            const recordDate = new Date(record.timeIn);
            return recordDate >= startDate && recordDate <= endDate;
        });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: "No completed attendance records found for the selected dates. Ongoing attendance is not included in DTR downloads." });
        }

        attendanceRecords.sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
        
        const detachment = attendanceRecords[0]?.scheduleId?.client || guard.position || "N/A";
        const guardAttendanceMap = new Map([[guard, attendanceRecords]]);
        const pdfBuffer = await generateWorkHoursByClientPDF(detachment, guardAttendanceMap, periodCover, {
          startDate,
          endDate,
          preparedBy: getRequesterDisplayName(req.user),
        });

        res.setHeader('Content-Type', 'application/pdf');
        const guardFileName = getGuardDisplayName(guard).replace(/\s+/g, "_");
        res.setHeader('Content-Disposition', `attachment; filename=DTR_${guardFileName}_${periodCover.replace(/, /g, '_').replace(/ /g, '_')}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating work hours PDF:", error);
        res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
};

/**
 * @desc    Generate and download a PDF report of working hours for all guards of a specific client
 * @route   GET /api/attendance/download-working-hours/client/:clientName
 * @access  Private
 */
export const downloadWorkHoursByClient = async (req, res) => {
    try {
        const { clientName } = req.params;
        const { from, to } = req.query; 
        
        let startDate, endDate, periodCover, startKey, endKey;

        // 1. SETUP DATES (Target Range)
        if (from && to) {
            startKey = String(from).slice(0, 10);
            endKey = String(to).slice(0, 10);
            startDate = new Date(`${startKey}T00:00:00+08:00`);
            endDate = new Date(`${endKey}T23:59:59+08:00`);
            const startLabel = getManilaDateLabel(startDate);
            const endLabel = getManilaDateLabel(endDate);
            periodCover = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
        } else {
            // Default Fallback
            const todayKey = getManilaDateKey(new Date());
            const [yearStr, monthStr, dayStr] = todayKey.split("-");
            const year = Number(yearStr);
            const month = Number(monthStr);
            const day = Number(dayStr);
            if (day <= 15) {
                startKey = `${yearStr}-${monthStr}-01`;
                endKey = `${yearStr}-${monthStr}-15`;
            } else {
                startKey = `${yearStr}-${monthStr}-16`;
                endKey = `${yearStr}-${monthStr}-${String(getLastDayOfMonth(year, month)).padStart(2, "0")}`;
            }
            startDate = new Date(`${startKey}T00:00:00+08:00`);
            endDate = new Date(`${endKey}T23:59:59+08:00`);
            periodCover = `${getManilaDateLabel(startDate)} - ${getManilaDateLabel(endDate)}`;
        }

        console.log(`[PDF] Request: ${clientName}`);
        console.log(`[PDF] Target Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // 2. FETCH ALL ATTENDANCE (Since timeIn is a String, we can't filter by date in DB)
        // We only populate 'scheduleId' and 'guard'. No nested population needed.
        const allAttendance = await Attendance.find()
            .populate('scheduleId')
            .populate('guard');

        // 3. FILTER MANUALLY (JavaScript)
        const clientAttendance = allAttendance.filter(record => {
            // Basic Safety Checks
            if (!record.timeIn || !record.timeOut || !record.scheduleId || !record.guard) return false;

            // A. CHECK CLIENT NAME (String Comparison)
            // Your schema has 'client' as a direct string in Schedule
            const recordClient = record.scheduleId.client || "";
            if (recordClient.trim().toLowerCase() !== clientName.trim().toLowerCase()) {
                return false;
            }

            // B. CHECK DATE using a Manila date key so production timezone does not alter the table range.
            const recordDate = getAttendanceRecordDate(record);
            
            // Invalid Date Check
            if (isNaN(recordDate.getTime())) return false;

            const recordKey = getManilaDateKey(recordDate);
            return recordKey >= startKey && recordKey <= endKey;
        });

        if (clientAttendance.length === 0) {
            console.log(`[PDF] 0 records match.`);
            return res.status(404).json({ 
                message: `No completed attendance records found for ${clientName}. Ongoing attendance is not included in DTR downloads.` 
            });
        }

        console.log(`[PDF] Found ${clientAttendance.length} valid records.`);

        // 4. GROUP DATA
        const groupedByGuard = new Map();
        clientAttendance.forEach(record => {
            const guardId = record.guard._id.toString();
            if (!groupedByGuard.has(guardId)) {
                groupedByGuard.set(guardId, { guard: record.guard, records: [] });
            }
            groupedByGuard.get(guardId).records.push(record);
        });
        
        const guardsMap = new Map();
        for (const { guard, records } of groupedByGuard.values()) {
            // Sort records by Date object
            records.sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
            guardsMap.set(guard, records);
        }

        // 5. GENERATE PDF
        const pdfBuffer = await generateWorkHoursByClientPDF(clientName, guardsMap, periodCover, {
          startDate,
          endDate,
          preparedBy: getRequesterDisplayName(req.user),
        });
        const safeFilename = `Report_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Delete an attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Private (Admin)
 */
export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res.json({ message: "Attendance deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Guard downloads their own DTR in staff DTR format
 *          (Day | Time In | Time Out | Undertime | Hours)
 * @route   GET /api/attendance/download-my-dtr?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access  Private (Guard)
 */
export const downloadMyGuardDTR = async (req, res) => {
  try {
    const fs = await import("fs");
    const logPath = "./debug.log";
    
    const guardId = req.user._id || req.user.id;
    const guard = await Guard.findById(guardId);
    
    fs.appendFileSync(logPath, `\n\n--- downloadMyGuardDTR Triggered at ${new Date().toISOString()} ---\n`);
    fs.appendFileSync(logPath, `Guard ID from token: ${guardId}\n`);
    fs.appendFileSync(logPath, `Guard found in DB: ${guard ? `${guard.firstName} ${guard.lastName} (guardId: ${guard.guardId})` : "null"}\n`);

    const { from, to } = req.query;
    fs.appendFileSync(logPath, `Query Params -> from: ${from}, to: ${to}\n`);
    
    let startDate, endDate, periodCover;

    if (from && to) {
      startDate = new Date(`${from}T00:00:00+08:00`);
      endDate   = new Date(`${to}T23:59:59+08:00`);
      const fmtOpt = { timeZone: "Asia/Manila", month: "long", day: "numeric", year: "numeric" };
      const startLabel = startDate.toLocaleDateString("en-PH", fmtOpt);
      const endLabel   = endDate.toLocaleDateString("en-PH", fmtOpt);
      periodCover = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
    } else {
      const today = new Date();
      const year  = today.getFullYear();
      const month = today.getMonth();
      if (today.getDate() <= 15) {
        startDate   = new Date(year, month, 1);
        endDate     = new Date(year, month, 15, 23, 59, 59, 999);
        periodCover = `${startDate.toLocaleString("default", { month: "long" })} 1-15, ${year}`;
      } else {
        startDate   = new Date(year, month, 16);
        endDate     = new Date(year, month + 1, 0, 23, 59, 59, 999);
        periodCover = `${startDate.toLocaleString("default", { month: "long" })} 16-${endDate.getDate()}, ${year}`;
      }
    }

    fs.appendFileSync(logPath, `Parsed Range -> startDate: ${startDate.toISOString()}, endDate: ${endDate.toISOString()}\n`);

    // Fetch only the guard's own attendance within the date range
    const allRecords = await Attendance.find({ guard: guardId }).populate("scheduleId");
    fs.appendFileSync(logPath, `Raw Attendance Count in DB for Guard: ${allRecords.length}\n`);
    
    allRecords.forEach((r, idx) => {
      fs.appendFileSync(logPath, `  [${idx}] id: ${r._id}, timeIn: "${r.timeIn}", timeOut: "${r.timeOut}", scheduleId: ${r.scheduleId ? "present" : "null"}\n`);
    });

    const attendanceRecords = allRecords
      .filter(r => {
        if (!r.timeIn || !r.timeOut) return false;
        const d = new Date(r.timeIn);
        const match = d >= startDate && d <= endDate;
        fs.appendFileSync(logPath, `  Filtering record id ${r._id}: parsedTimeIn=${d.toISOString()}, inRange=${match}\n`);
        return match;
      })
      .sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));

    fs.appendFileSync(logPath, `Filtered Attendance Count: ${attendanceRecords.length}\n`);

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: "No completed attendance records found for the selected dates. Ongoing attendance is not included in DTR downloads." });
    }

    // Map guard to the shape generateStaffAttendancePDF expects
    const staffObj = {
      name:     `${guard?.firstName || ""} ${guard?.lastName || ""}`.trim() || guard?.fullName || "N/A",
      position: guard?.position || "Security Guard",
      role:     guard?.role || "Guard",
    };


    const pdfBuffer = await generateStaffAttendancePDF(staffObj, attendanceRecords, periodCover, {
      startDate,
      endDate,
      preparedBy: getRequesterDisplayName(req.user),
    });

    const safeName   = staffObj.name.replace(/\s+/g, "_");
    const fromStr    = from || startDate.toISOString().slice(0, 10);
    const toStr      = to   || endDate.toISOString().slice(0, 10);
    const filename   = `DTR_${safeName}_${fromStr}_${toStr}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating guard self DTR:", err);
    res.status(500).json({ message: "Failed to generate DTR", error: err.message });
  }
};
