import Schedule from "../models/schedule.model.js";

// POST /api/schedules/create-schedule
export const createSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;

    if (Array.isArray(schedules)) {
      const created = await Schedule.insertMany(schedules);
      return res.status(201).json(created);
    }

    // fallback for single
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: "Error creating schedule", error: err.message });
  }
};


// Get all schedules
export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().populate("guardId", "fullName email");
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
    const { guardId } = req.params;
    const schedules = await Schedule.find({ "guard._id": guardId })
      .populate("guard") // if your schema has a reference
      .sort({ timeIn: 1 }); // sort by upcoming schedule

    if (!schedules || schedules.length === 0)
      return res.status(404).json({ message: "No schedules found for this guard" });

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error: error.message });
  }
};

// Update schedule
export const updateSchedule = async (req, res) => {
  try {
    const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json({ message: "Schedule updated", schedule: updated });
  } catch (error) {
    res.status(400).json({ message: "Error updating schedule", error: error.message });
  }
};

// Delete schedule
export const deleteSchedule = async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting schedule", error: error.message });
  }
};
