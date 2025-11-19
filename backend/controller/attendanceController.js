import Attendance from "../models/Attendance.model.js";
import Schedule from "../models/schedule.model.js";

export const getAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find()
      .populate("guard", "fullName email role")
      .sort({ createdAt: -1 });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGuardAttendance = async (req, res) => {
  try {
    const guardId = req.params.id;
    const attendance = await Attendance.find({ guard: guardId }).sort({ createdAt: -1 });

    if (!attendance.length) {
      return res.status(404).json({ message: "No records found" });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAttendance = async (req, res) => {
  try {
    const guard = req.user;
    const {
      guardName,
      guardId,
      position,
      shift,
      dutyStation,
      email,
      phoneNumber,
      location,
      siteAddress,
      photo,
      status,
      submittedAt,
    } = req.body;

    const now = new Date();

    // Fetch all approved schedules for this guard
    const schedules = await Schedule.find({
      guardId: guard._id,
      isApproved: "Approved",
    });

    if (!schedules || schedules.length === 0) {
      return res.status(403).json({
        message: "You cannot time in. You have no schedule.",
      });
    }

    // Check if now is inside any schedule window (overnight-safe)
    const currentSchedule = schedules.find((s) => {
      const timeIn = new Date(s.timeIn);
      const timeOut = new Date(s.timeOut);

      // Overnight shift handling
      if (timeOut < timeIn) {
        return now >= timeIn || now <= timeOut;
      }
      return now >= timeIn && now <= timeOut;
    });

    if (!currentSchedule) {
      return res.status(403).json({
        message: "You cannot time in now. Outside of your schedule window.",
      });
    }

    // Prevent duplicate time-in for the current schedule
    const existing = await Attendance.findOne({
      guardId: guard._id,
      date: now.toISOString().split("T")[0], // check today
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already timed in for today.",
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      guard: guard._id, // required by schema
      guardName: guardName || guard.fullName,
      guardId: guardId || guard.guardId || guard._id, // optional, for convenience
      position: position || guard.position,
      shift: shift || guard.shift,
      dutyStation: dutyStation || guard.dutyStation,
      email: email || guard.email,
      phoneNumber: phoneNumber || guard.phoneNumber,
      date: now.toISOString().split("T")[0],
      timeIn: now.toISOString(),
      location: location || "",
      siteAddress: siteAddress || "",
      photo: photo || null,
      status: status || "On Duty",
      submittedAt: submittedAt || now.toISOString(),
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    Object.assign(attendance, req.body);
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    res.json({ message: "Attendance deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
