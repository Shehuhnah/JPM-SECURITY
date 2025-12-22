import Schedule from "../models/schedule.model.js";
import { v4 as uuidv4 } from "uuid";
// Helper
const findConflict = async (scheduleData) => {
  const { timeIn, _id, shiftType, position, deploymentLocation, guardId } = scheduleData;

  const newScheduleDateOnly = timeIn.split("T")[0];

  // Prevent another guard in SAME CLIENT with same Day + ShiftType + Position
  const clientConflictQuery = {
    deploymentLocation,  // same client
    position,
    shiftType,
    $expr: {
      $eq: [
        { $substrCP: ["$timeIn", 0, 10] },
        newScheduleDateOnly,
      ],
    },
  };

  if (_id) {
    clientConflictQuery._id = { $ne: _id };
  }

  const clientConflict = await Schedule.findOne(clientConflictQuery);

  if (clientConflict) {
    return {
      ...scheduleData,
      reason: `This client already has a guard assigned on this date for the same Shift Type and Position.`,
    };
  }

  // Prevent guard from working in ANY OTHER CLIENT on the same day
  const guardConflictQuery = {
    guardId,
    $expr: {
      $eq: [
        { $substrCP: ["$timeIn", 0, 10] },
        newScheduleDateOnly,
      ],
    },
  };

  // Exclude itself if updating
  if (_id) {
    guardConflictQuery._id = { $ne: _id };
  }

  const guardConflict = await Schedule.findOne(guardConflictQuery);

  if (guardConflict) {
    return {
      ...scheduleData,
      reason: `This guard is already scheduled on this date at another client ("${guardConflict.deploymentLocation}").`,
    };
  }

  return null;
};

// Create a Schedule
export const createSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;

    // Assign a single batchId for all schedules submitted together
    const batchId = uuidv4();

    // Handle multiple schedule submissions
    if (Array.isArray(schedules)) {
      for (const schedule of schedules) {
        const conflict = await findConflict(schedule);
        if (conflict) {
          return res.status(400).json({
            message: "A schedule conflict was detected. Please review and fix it.",
            conflicts: [conflict],
          });
        }
        schedule.batchId = batchId; // attach batchId
      }

      const createdSchedules = await Schedule.insertMany(schedules);
      return res.status(201).json(createdSchedules);
    }

    // Handle single schedule submission
    const conflict = await findConflict(req.body);
    if (conflict) {
      return res.status(400).json({
        message: "Conflict detected. Cannot create schedule.",
        conflicts: [conflict],
      });
    }

    req.body.batchId = batchId; // attach batchId
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
    if (status) filter.isApproved = status; 

    const schedules = await Schedule.find(filter).populate("guardId", "fullName email guardId");
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error: error.message });
  }
};

// Get single schedule by ID
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate("guardId", "fullName email guardId");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule", error: error.message });
  }
};

// Get schedules by guard ID only approved
export const getSchedulesByGuard = async (req, res) => {
  try {
    const { id } = req.params;
    const schedules = await Schedule.find({
      guardId: id,
      isApproved: "Approved"
    }).populate("guardId", "fullName email");

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules for guard", error: error.message });
  }
};

// Get schedule today of guard
export const getTodayScheduleByGuard = async (req, res) => {
  try {
    const { id } = req.params;
    
   
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); 
    
    const getDateStr = (date) => {
      return date.toISOString().split('T')[0];
    };

    const todayDateStr = getDateStr(phTime); 
    
    const yesterday = new Date(phTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = getDateStr(yesterday);

    const currentPHTimeString = phTime.toISOString().slice(0, 16); 

    const allPotentialSchedules = await Schedule.find({
      guardId: id,
      isApproved: "Approved",
      $or: [
        { timeIn: { $regex: `^${todayDateStr}` } },    // Starts Today
        { timeIn: { $regex: `^${yesterdayDateStr}` } } // Starts Yesterday
      ]
    }).populate("guardId", "fullName email");

    
    const validSchedules = allPotentialSchedules.filter(schedule => {
      const startsToday = schedule.timeIn.startsWith(todayDateStr);
      
      
      const isActiveOvernight = 
        schedule.timeIn.startsWith(yesterdayDateStr) && 
        schedule.timeOut > currentPHTimeString;

      return startsToday || isActiveOvernight;
    });

    res.status(200).json({ 
      hasSchedule: validSchedules.length > 0, 
      schedules: validSchedules 
    });

  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ message: "Error fetching today's schedule", error: error.message });
  }
};

// Approve all pending schedules for a client 
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
      return res.status(404).json({ message: "No pending schedules found for this client" });

    res.status(200).json({
      message: `Approved ${result.modifiedCount} schedule(s) for ${client}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error approving schedules", error: error.message });
  }
};

// Decline all pending schedules for a client 
export const declineClientSchedules = async (req, res) => {
  const { client, remarks } = req.body;
  if (!client)
    return res.status(400).json({ message: "Client name is required" });

  try {
    const result = await Schedule.updateMany(
    { client, isApproved: "Pending" },
    { isApproved: "Declined", remarks: remarks });

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "No pending schedules found for this client" });

    res.status(200).json({
      message: `Declined ${result.modifiedCount} schedule(s) for ${client}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error declining schedules", error: error.message });
  }
};

//  Delete single schedule 
export const deleteSchedule = async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Schedule not found" });

    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting schedule", error: error.message });
  }
};

// edit schedule by batch id
export const updateSchedulesByBatchId = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules: newSchedules } = req.body;

    const originalSchedule = await Schedule.findById(id);
    if (!originalSchedule) {
      return res.status(404).json({ message: "Original schedule not found, cannot identify batch." });
    }

    const { client, deploymentLocation, shiftType, isApproved } = originalSchedule;

    await Schedule.deleteMany({ client, deploymentLocation, shiftType, isApproved });

    for (const schedule of newSchedules) {
      const conflict = await findConflict(schedule);
      if (conflict) {
        return res.status(400).json({
          message: "A schedule conflict was detected. The old batch was deleted, but the new one was not created.",
          conflicts: [conflict],
        });
      }
    }

    const createdSchedules = await Schedule.insertMany(newSchedules);
    res.status(200).json({ message: 'Batch updated successfully', schedules: createdSchedules });

  } catch (err) {
    console.error("Error updating schedule batch:", err);
    res.status(500).json({ message: "Error updating schedule batch", error: err.message });
  }
};

// Get schedule by batch id
export const getSchedulesByBatchId = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const { client, deploymentLocation, shiftType, isApproved } = schedule;

    const batchSchedules = await Schedule.find({
      client,
      deploymentLocation,
      shiftType,
      isApproved,
    }).populate('guardId', 'fullName');

    res.status(200).json(batchSchedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule batch", error: error.message });
  }
};

// Delete schedule by batch id
export const deleteScheduleByBatch = async (req, res) => {
  try {
      const { id } = req.params;
      const schedule = await Schedule.findById(id);

      if (!schedule) {
          return res.status(404).json({ message: "Schedule not found, cannot identify batch to delete." });
      }

      const { client, deploymentLocation, shiftType, isApproved } = schedule;

      const result = await Schedule.deleteMany({ batchId: schedule.batchId });

      if (result.deletedCount === 0) {
          return res.status(404).json({ message: "No schedules found for this batch to delete."})
      }

      res.status(200).json({ message: `${result.deletedCount} schedules from the batch were deleted successfully.`});

  } catch (error) {
      res.status(500).json({ message: "Error deleting schedule batch", error: error.message });
  }
};

// Approve schedule by batch id
export const approveScheduleBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const result = await Schedule.updateMany(
      { batchId: schedule.batchId, isApproved: "Pending" },
      { $set: { isApproved: "Approved" } }
    );

    res.status(200).json({
      message: `${result.modifiedCount} schedules approved.`,
    });
  } catch (err) {
    res.status(500).json({ message: "Error approving batch", error: err });
  }
};

// Decline schedule by batch id
export const declineScheduleBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({ message: "Remarks required" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const result = await Schedule.updateMany(
      { batchId: schedule.batchId, isApproved: "Pending" },
      { $set: { isApproved: "Declined", remarks } }
    );

    res.status(200).json({
      message: `${result.modifiedCount} schedules declined.`,
    });
  } catch (err) {
    res.status(500).json({ message: "Error declining batch", error: err });
  }
};
