import Attendance from "../models/Attendance.model.js";
import Schedule from "../models/schedule.model.js";
import Guard from "../models/guard.model.js";
import { generateWorkHoursPDF, generateWorkHoursByClientPDF } from "../utils/workingHoursPdfGenerator.js";

/**
 * @desc    Guard performs time-in for a specific schedule
 * @route   POST /api/attendance/time-in
 * @access  Private (Guard)
 */

export const createAttendance = async (req, res) => {
  try {
    const guardId = req.user.id;
    const { scheduleId, location, photo } = req.body;


    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    const existingAttendance = await Attendance.findOne({ scheduleId });
    if (existingAttendance) {
      return res.status(400).json({ message: "You have already timed in for this schedule." });
    }

    const now = new Date();

    const timeZoneOffset = "+08:00"; 
    
    const timeInString = schedule.timeIn.endsWith("Z") || schedule.timeIn.includes("+") 
      ? schedule.timeIn 
      : `${schedule.timeIn}${timeZoneOffset}`;
      
    const timeOutString = schedule.timeOut.endsWith("Z") || schedule.timeOut.includes("+") 
      ? schedule.timeOut 
      : `${schedule.timeOut}${timeZoneOffset}`;

    const scheduledTimeIn = new Date(timeInString);
    const scheduledTimeOut = new Date(timeOutString);

    const validTimeInStart = new Date(scheduledTimeIn);
    validTimeInStart.setHours(validTimeInStart.getHours() - 2); 
    

    if (now < validTimeInStart) {
      const localValidStart = validTimeInStart.toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Manila', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return res.status(400).json({
        message: `Cannot time-in yet. You can time-in starting at ${localValidStart}.`,
      });
    }

    if (now > scheduledTimeOut) {
      return res.status(400).json({
        message: "Cannot time-in. The schedule has already ended.",
      });
    }

    const newAttendance = new Attendance({
      guard: guardId,
      scheduleId,
      timeIn: now,
      location,
      photo,
      status: "On Duty",
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

    attendance.timeOut = new Date();
    attendance.status = "Off Duty";
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendanceId).populate({
        path: 'scheduleId',
        select: 'client deploymentLocation timeIn timeOut'
    }).populate({
        path: 'guard',
        select: 'fullName'
    });

    res.status(200).json(populatedAttendance);
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
    const attendances = await Attendance.find()
      .populate({
          path: 'guard',
          select: 'fullName email guardId' 
      })
      .populate({
          path: 'scheduleId',
          select: 'client deploymentLocation position shiftType timeIn timeOut'
      })
      .sort({ createdAt: -1 });

    res.json(attendances);
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
    const attendance = await Attendance.find({ guard: guardId })
        .populate({
            path: 'scheduleId',
            select: 'client deploymentLocation shiftType timeIn timeOut'
        })
        .sort({ createdAt: -1 });

    res.json(attendance);
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

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        let startDate, endDate, periodCover;

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

        const allAttendance = await Attendance.find({ guard: guardId }).populate('scheduleId');

        const attendanceRecords = allAttendance.filter(record => {
            if (!record.timeIn) return false;
            const recordDate = new Date(record.timeIn);
            return recordDate >= startDate && recordDate <= endDate;
        });

        attendanceRecords.sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
        
        const pdfBuffer = await generateWorkHoursPDF(guard, attendanceRecords, periodCover);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=DTR_${guard.fullName.replace(' ', '_')}_${periodCover.replace(/, /g, '_').replace(/ /g, '_')}.pdf`);
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
        
        let startDate, endDate, periodCover;

        // 1. SETUP DATES (Target Range)
        if (from && to) {
            startDate = new Date(from);
            endDate = new Date(to);
            periodCover = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        } else {
            // Default Fallback
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            if (today.getDate() <= 15) {
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month, 15);
            } else {
                startDate = new Date(year, month, 16);
                endDate = new Date(year, month + 1, 0); 
            }
            periodCover = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        }

        // Set strict boundaries for the REQUESTED range
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

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
            if (!record.timeIn || !record.scheduleId || !record.guard) return false;

            // A. CHECK CLIENT NAME (String Comparison)
            // Your schema has 'client' as a direct string in Schedule
            const recordClient = record.scheduleId.client || "";
            if (recordClient.trim().toLowerCase() !== clientName.trim().toLowerCase()) {
                return false;
            }

            // B. CHECK DATE (String -> Date Conversion)
            // We must manually parse the "Wed Dec 03..." string
            const recordDate = new Date(record.timeIn);
            
            // Invalid Date Check
            if (isNaN(recordDate.getTime())) return false;

            // Manual Timezone Adjustment (UTC -> PH Time +8h)
            // If your server considers the string as UTC, shift it to match your local expectation
            const phTime = new Date(recordDate.getTime() + (8 * 60 * 60 * 1000));
            const checkTime = phTime.getTime();

            // C. WIDENED SEARCH LOGIC (Buffer of +/- 24 hours)
            // Since we are comparing timestamps, we accept records from "The day before" 
            // to account for the timezone shift.
            const searchStart = startDate.getTime() - (24 * 60 * 60 * 1000); 
            const searchEnd = endDate.getTime() + (24 * 60 * 60 * 1000);

            return checkTime >= searchStart && checkTime <= searchEnd;
        });

        if (clientAttendance.length === 0) {
            console.log(`[PDF] 0 records match.`);
            return res.status(404).json({ 
                message: `No records found for ${clientName}. (Checked ${allAttendance.length} total records)` 
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
        const pdfBuffer = await generateWorkHoursByClientPDF(clientName, guardsMap, periodCover);
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
