import Schedule from "../models/schedule.model.js";
// Create a Schedule
export const createSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;

    // 🧩 Helper: check if a schedule conflicts with existing ones
    const findConflict = async (scheduleData) => {
      const { client, deploymentLocation, timeIn, timeOut, shiftType, position } = scheduleData;

      const start = new Date(timeIn);
      const end = new Date(timeOut);

      // Check if a schedule already exists with same client, shiftType, and position
      const existing = await Schedule.findOne({
        client,
        shiftType,
        position,
      });

      if (existing) {
        return {
          ...scheduleData,
          reason: `Position "${position}" already exists in ${shiftType} for ${client}`,
        };
      }

      // Check for overlapping schedules for the same client + deploymentLocation
      const overlap = await Schedule.findOne({
        client,
        deploymentLocation,
        shiftType,
        $or: [
          { timeIn: { $lte: end }, timeOut: { $gte: start } },
        ],
      });

      if (overlap) {
        return {
          ...scheduleData,
          reason: `Overlapping time detected at "${deploymentLocation}" for ${client} (${shiftType})`,
        };
      }

      return null; // no conflict
    };

    // ========== MULTIPLE SCHEDULE SUBMISSION ==========
    if (Array.isArray(schedules)) {
      const validSchedules = [];
      const conflicts = [];

      for (const schedule of schedules) {
        const conflict = await findConflict(schedule);
        if (conflict) conflicts.push(conflict);
        else validSchedules.push(schedule);
      }

      // If any conflicts, return them all at once
      if (conflicts.length > 0) {
        return res.status(400).json({
          message: "Some schedules have conflicts. Please review and fix them.",
          conflicts,
        });
      }

      const created = await Schedule.insertMany(validSchedules);
      return res.status(201).json(created);
    }

    // ========== SINGLE SCHEDULE SUBMISSION ==========
    const conflict = await findConflict(req.body);
    if (conflict) {
      return res.status(400).json({
        message: "Conflict detected. Cannot create schedule.",
        conflicts: [conflict],
      });
    }

    const schedule = new Schedule(req.body);
    await schedule.save();

    res.status(201).json(schedule);
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ message: "Error creating schedule", error: err.message });
  }
};

// Get all schedules (optionally filtered by status)
export const getSchedules = async (req, res) => {
  try {
    const { status } = req.query; 

    const filter = {};
    if (status) filter.isApproved  = status; 

    const schedules = await Schedule.find(filter).populate("guardId", "fullName email");
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error: error.message });
  }
};

// Get single schedule by ID
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate("guard");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule", error: error.message });
  }
};

// Get schedules by guard ID
export const getSchedulesByGuard = async (req, res) => {
  try {
    const { id } = req.params;

    // find schedules based on guardId
    const schedules = await Schedule.find({ guardId: id }).populate("guardId");

    if (!schedules || schedules.length === 0) {
      // instead of 404, just return empty array (optional)
      return res.status(200).json([]);
    }

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error: error.message });
  }
};

// ===== Approve all pending schedules for a client =====
export const approveClientSchedules = async (req, res) => {
  const { client } = req.body;
  if (!client)
    return res.status(400).json({ message: "Client name is required" });

  try {
    const result = await Schedule.updateMany(
      { client, isApproved: "Pending" },
      { $set: { isApproved: "Approved" } }
    );

    if (result.matchedCount === 0)
      return res
        .status(404)
        .json({ message: "No pending schedules found for this client" });

    res.status(200).json({
      message: `Approved ${result.modifiedCount} schedule(s) for ${client}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error approving schedules", error: error.message });
  }
};

// ===== Decline all pending schedules for a client =====
export const declineClientSchedules = async (req, res) => {

  const { client, remarks } = req.body;

  if (!client)
    return res.status(400).json({ message: "Client name is required" });

  try {
    const result = await Schedule.updateMany(
    { client, isApproved: "Pending" },
    { isApproved: "Declined", remarks: remarks });

    if (result.matchedCount === 0)
      return res
        .status(404)
        .json({ message: "No pending schedules found for this client" });

    res.status(200).json({
      message: `Declined ${result.modifiedCount} schedule(s) for ${client}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error declining schedules", error: error.message });
  }
};

// ===== Delete single schedule =====
export const deleteSchedule = async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Schedule not found" });

    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting schedule", error: error.message });
  }
};