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

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required for time-in." });
    }

    // 1️⃣ Find the schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // 2️⃣ Validate schedule ownership
    if (schedule.guardId.toString() !== guardId) {
      return res.status(403).json({ message: "You are not authorized for this schedule." });
    }

    // 3️⃣ Validate approval status
    if (schedule.isApproved !== 'Approved') {
      return res.status(403).json({ message: "Cannot time-in for a schedule that is not approved." });
    }

    const now = new Date();
    const scheduledTimeIn = new Date(schedule.timeIn);
    const scheduledTimeOut = new Date(schedule.timeOut);

    // 4️⃣ Define time-in window: 1 hour before → 2 hours after scheduled start
    const validTimeInStart = new Date(scheduledTimeIn);
    validTimeInStart.setHours(validTimeInStart.getHours() - 1);

    // const validTimeInEnd = new Date(scheduledTimeIn);
    // validTimeInEnd.setHours(validTimeInEnd.getHours() + 2);

    console.log("🕒 Now:          ", now.toLocaleString());
    console.log("🕒 Scheduled In: ", scheduledTimeIn.toLocaleString());
    console.log("🕒 Scheduled Out:", scheduledTimeOut.toLocaleString());
    console.log("🕒 Valid Start:  ", validTimeInStart.toLocaleString());
    // console.log("🕒 Valid End:    ", validTimeInEnd.toLocaleString());

    // 5️⃣ Block time-in if shift hasn't started yet
    if (now < validTimeInStart) {
      return res.status(400).json({
        message: `Cannot time-in yet. You can time-in starting at ${validTimeInStart.toLocaleTimeString()}.`,
      });
    }

    // // 6️⃣ Block time-in if the time-in window passed
    // if (now > validTimeInEnd) {
    //   return res.status(400).json({
    //     message: "Time-in window has passed. Please contact your supervisor.",
    //   });
    // }

    // 7️⃣ Block if shift already ended
    if (now > scheduledTimeOut) {
      return res.status(400).json({
        message: "Cannot time-in. Your shift has already ended.",
      });
    }

    // 8️⃣ Prevent duplicate time-in
    const existingAttendance = await Attendance.findOne({ scheduleId });
    if (existingAttendance) {
      return res.status(400).json({ message: "You have already timed in for this schedule." });
    }

    // 9️⃣ Create attendance
    const attendance = await Attendance.create({
      guard: guardId,
      scheduleId: scheduleId,
      timeIn: now,
      status: "On Duty",
      location: location || {},
      photo: photo || null,
    });

    const populatedAttendance = await attendance.populate([
      { path: 'guard', select: 'fullName guardId' },
      { path: 'scheduleId' }
    ]);

    res.status(201).json(populatedAttendance);

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
    console.log(attendances);
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

        // Fetch all attendance, populate schedule and guard
        const allAttendance = await Attendance.find({})
            .populate('scheduleId')
            .populate('guard');

        // Filter records by client and date
        const clientAttendance = allAttendance.filter(record => {
            if (!record.timeIn || !record.scheduleId || !record.guard) return false;
            const recordDate = new Date(record.timeIn);
            return record.scheduleId.client === clientName && recordDate >= startDate && recordDate <= endDate;
        });

        if (clientAttendance.length === 0) {
            return res.status(404).json({ message: "No attendance records found for this client in the current period." });
        }

        // Group attendance by guard ID
        const groupedByGuard = new Map();
        clientAttendance.forEach(record => {
            const guardId = record.guard._id.toString();
            if (!groupedByGuard.has(guardId)) {
                groupedByGuard.set(guardId, { guard: record.guard, records: [] });
            }
            groupedByGuard.get(guardId).records.push(record);
        });
        
        // The PDF generator expects a Map where keys are guard objects. Let's create that.
        const guardsMap = new Map();
        for (const { guard, records } of groupedByGuard.values()) {
            // Sort records for each guard by date
            records.sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
            guardsMap.set(guard, records);
        }

        const pdfBuffer = await generateWorkHoursByClientPDF(clientName, guardsMap, periodCover);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=DTR_${clientName.replace(' ', '_')}_${periodCover.replace(/, /g, '_').replace(/ /g, '_')}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating work hours PDF for client:", error);
        res.status(500).json({ message: "Failed to generate PDF for client", error: error.message });
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
