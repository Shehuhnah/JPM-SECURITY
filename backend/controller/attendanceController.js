import Attendance from "../models/Attendance.model.js";

// ✅ GET all attendances (admin/subadmin only)
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

// ✅ GET attendance for a specific guard (guard or admin)
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

// ✅ POST new attendance record (guard time-in)
export const createAttendance = async (req, res) => {
  try {
    const guard = req.user; // from auth middleware
    const {
      guardName,
      guardId,
      position,
      shift,
      dutyStation,
      email,
      phoneNumber,
      date,
      timeIn,
      location,
      siteAddress,
      photo,
      status,
      submittedAt,
    } = req.body;

    // 🧠 Prevent multiple time-ins for the same date
    const existing = await Attendance.findOne({
      guard: guard._id,
      date,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already timed in for today." });
    }

    // ✅ Create new attendance record
    const attendance = await Attendance.create({
      guard: guard._id,
      guardName: guardName || guard.fullName,
      guardId: guardId || guard.guardId || guard._id,
      position,
      shift,
      dutyStation,
      email,
      phoneNumber,
      date,
      timeIn,
      location,
      siteAddress,
      photo,
      status: status || "On Duty",
      submittedAt,
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// ✅ PATCH update attendance (time-out or status update)
export const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    // Merge updated fields
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
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    res.json({ message: "Attendance deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
