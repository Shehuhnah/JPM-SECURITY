import Logbook from "../models/logbook.model.js";
import Schedule from "../models/schedule.model.js";
import Attendance from "../models/Attendance.model.js";

export const createLogbook = async (req, res) => {
  try {
    const guardId = req.user._id; 
    const { scheduleId, post, type, remarks } = req.body;
    
    if (!scheduleId) {
      return res.status(400).json({ message: "Cannot create log entry without an active schedule." });
    }

    // Check if guard has an active "On Duty" attendance for this schedule
    const activeAttendance = await Attendance.findOne({ 
      scheduleId: scheduleId,
      status: "On Duty" 
    });
    if (!activeAttendance) {
      return res.status(403).json({ message: "You must time-in before creating a log entry." });
    }
    
    if (!post || !type || !remarks) {
        return res.status(400).json({ message: "Post, log type and remarks are required." });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Associated schedule not found." });
    }
    
    const shift = schedule.shiftType;

    const logbook = await Logbook.create({
      guard: guardId,
      scheduleId: scheduleId,
      post,
      shift,
      type,
      remarks,
    });
    res.status(201).json(logbook);
  } catch (error) {
    console.error("Error creating logbook:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getLogbooks = async (req, res) => {
    try {
        const { guardId } = req.query; 
        let query = {};
        
        if (guardId) {
            query.guard = guardId;
        }
        
        const logbooks = await Logbook.find(query)
            .populate("guard", "fullName guardId dutyStation position") // Populate guard details
            .sort({ createdAt: -1 });
        res.json(logbooks);
    } catch (error) {
        console.error("Error fetching logbooks:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getLogbookById = async (req, res) => {
    try {
        const logbook = await Logbook.findById(req.params.id).populate("guard", "fullName email guardId"); // Populate with correct guard fields
        if (!logbook) {
            return res.status(404).json({ message: "Logbook entry not found" });
        }
        res.json(logbook);
    } catch (error) {
        console.error("Error fetching logbook by ID:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateLogbook = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedLogbook = await Logbook.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedLogbook) {
            return res.status(404).json({ message: "Logbook entry not found" });
        }
        res.json(updatedLogbook);
    } catch (error) {
        console.error("Error updating logbook:", error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE logbook entry
export const deleteLogbook = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLogbook = await Logbook.findByIdAndDelete(id);
        if (!deletedLogbook) {
            return res.status(404).json({ message: "Logbook entry not found" });
        }
        res.json({ message: "Logbook entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting logbook:", error);
        res.status(500).json({ message: error.message });
    }
};

// In your logbook controller
export const getLogsByGuard = async (req, res) => {
    try {
      const { guardId } = req.params; // This guardId is an ObjectId from the route
      const logs = await Logbook.find({ guard: guardId }) // Filter by guard ObjectId
        .populate('guard', 'fullName guardId dutyStation position') // Populate guard details
        .sort({ createdAt: -1 });
      
      res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching logs by guard:", error);
      res.status(500).json({ message: "Error fetching logs", error: error.message });
    }
  };

export const getCurrentScheduleInfo = async (req, res) => {
  try {
    const guardId = req.user._id;
    const now = new Date();

    // Find all approved schedules for the guard
    const allApprovedSchedules = await Schedule.find({
      guardId: guardId,
      isApproved: "Approved",
    });

    // Find the currently active schedule by comparing dates in JavaScript
    const schedule = allApprovedSchedules.find(sched => {
      const timeInDate = new Date(sched.timeIn);
      const timeOutDate = new Date(sched.timeOut);
      return timeInDate <= now && timeOutDate >= now;
    });

    if (!schedule) {
      return res.status(404).json({ message: "No active schedule found for the current time." });
    }

    // Check for an active attendance record for this schedule
    const activeAttendance = await Attendance.findOne({
      scheduleId: schedule._id,
      status: "On Duty",
    });

    res.status(200).json({
      scheduleId: schedule._id,
      client: schedule.client,
      deploymentLocation: schedule.deploymentLocation,
      shiftType: schedule.shiftType,
      hasTimedIn: !!activeAttendance, // Convert to boolean
    });
  } catch (error) {
    console.error("Error fetching current schedule info:", error);
    res.status(500).json({ message: "Error fetching current schedule info." });
  }
};