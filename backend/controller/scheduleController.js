import Schedule from "../models/schedule.model.js";

// Create new schedule
export const createSchedule = async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json({ message: "Schedule created successfully", schedule });
  } catch (error) {
    console.error("Schedule creation error:", error); // <— ADD THIS
    res.status(400).json({ message: "Error creating schedule", error: error.message });
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
