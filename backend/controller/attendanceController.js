import Attendance from "../models/Attendance.model.js";
import User from "../models/User.model.js";

// ✅ GET all attendances (admin/subadmin only)
export const getAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find().populate("guard", "name email role");
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET attendance for a specific guard (guard or admin)
export const getGuardAttendance = async (req, res) => {
  try {
    const guardId = req.params.id;
    const attendance = await Attendance.find({ guard: guardId });
    if (!attendance) return res.status(404).json({ message: "No records found" });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ POST new attendance record (guard time-in)
export const createAttendance = async (req, res) => {
  try {
    const { date, timeIn, location, status } = req.body;
    const guardId = req.user._id; // from token

    const attendance = await Attendance.create({
      guard: guardId,
      date,
      timeIn,
      location,
      status,
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ PATCH update attendance (time-out or status)
export const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });

    Object.assign(attendance, req.body);
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ DELETE attendance (admin only)
export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });
    res.json({ message: "Attendance deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
