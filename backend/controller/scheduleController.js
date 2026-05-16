import Schedule from "../models/schedule.model.js";
import LeaveRequest from "../models/leaveRequest.model.js";
import { v4 as uuidv4 } from "uuid";
// Helper
const getScheduleDateOnly = (value = "") => String(value).split("T")[0];
const getScheduleMonth = (value = "") => getScheduleDateOnly(value).slice(0, 7);
const isValidMonthValue = (value = "") => /^\d{4}-\d{2}$/.test(String(value));
const MIN_REST_HOURS = 8;

const deriveCoveredMonthsFromSchedules = (schedules = []) =>
  [...new Set(
    schedules
      .map((schedule) => getScheduleMonth(schedule?.timeIn))
      .filter((monthValue) => isValidMonthValue(monthValue))
  )].sort();

const normalizeBatchMeta = (batchMeta = {}, schedules = []) => {
  const derivedCoveredMonths = deriveCoveredMonthsFromSchedules(schedules);
  const fallbackAnchorMonth = derivedCoveredMonths[0] || null;

  const scopeType = ["single", "count", "custom"].includes(batchMeta?.scopeType)
    ? batchMeta.scopeType
    : derivedCoveredMonths.length > 1
      ? "custom"
      : "single";

  const coveredMonths = Array.isArray(batchMeta?.coveredMonths)
    ? [...new Set(batchMeta.coveredMonths.filter((monthValue) => isValidMonthValue(monthValue)))]
        .sort()
    : derivedCoveredMonths;

  const resolvedCoveredMonths = coveredMonths.length > 0 ? coveredMonths : derivedCoveredMonths;
  const anchorMonth = isValidMonthValue(batchMeta?.anchorMonth)
    ? batchMeta.anchorMonth
    : fallbackAnchorMonth;
  const numericMonthCount = Number(batchMeta?.monthCount);
  const monthCount = Number.isFinite(numericMonthCount) && numericMonthCount > 0
    ? numericMonthCount
    : resolvedCoveredMonths.length || 1;

  return {
    scopeType,
    anchorMonth,
    monthCount,
    coveredMonths: resolvedCoveredMonths,
  };
};

const attachBatchMetaToSchedules = (schedules = [], batchMeta = {}) =>
  schedules.map((schedule) => ({
    ...schedule,
    batchMeta,
  }));

const getScheduleWindow = (schedule = {}) => {
  const start = new Date(schedule.timeIn);
  const end = new Date(schedule.timeOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return { start, end };
};

const getRestGapHours = (firstWindow, secondWindow) => {
  if (!firstWindow || !secondWindow) return null;

  if (firstWindow.end <= secondWindow.start) {
    return (secondWindow.start.getTime() - firstWindow.end.getTime()) / (1000 * 60 * 60);
  }

  if (secondWindow.end <= firstWindow.start) {
    return (firstWindow.start.getTime() - secondWindow.end.getTime()) / (1000 * 60 * 60);
  }

  return -1;
};

const findConflict = async (scheduleData, options = {}) => {
  const { timeIn, _id, guardId } = scheduleData;
  const { excludedBatchId, excludedIds = [] } = options;
  const newWindow = getScheduleWindow(scheduleData);

  const newScheduleDateOnly = getScheduleDateOnly(timeIn);

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

  if (excludedIds.length > 0) {
    guardConflictQuery._id = {
      ...(guardConflictQuery._id || {}),
      $nin: excludedIds,
    };
  }

  if (excludedBatchId) {
    guardConflictQuery.batchId = { $ne: excludedBatchId };
  }

  const guardConflict = await Schedule.findOne(guardConflictQuery);

  if (guardConflict) {
    return {
      ...scheduleData,
      reason: `This guard is already scheduled on ${newScheduleDateOnly} at "${guardConflict.deploymentLocation}".`,
    };
  }

  const nearbySchedules = await Schedule.find({
    guardId,
    ...(excludedBatchId ? { batchId: { $ne: excludedBatchId } } : {}),
    ...(excludedIds.length > 0 ? { _id: { $nin: excludedIds } } : {}),
  }).select("timeIn timeOut deploymentLocation");

  const restGapConflict = nearbySchedules.find((existingSchedule) => {
    const existingWindow = getScheduleWindow(existingSchedule);
    const gapHours = getRestGapHours(existingWindow, newWindow);
    return gapHours !== null && gapHours < MIN_REST_HOURS;
  });

  if (restGapConflict) {
    return {
      ...scheduleData,
      reason: `This guard must have at least ${MIN_REST_HOURS} hours of rest between shifts. Another duty ends or starts too close to ${newScheduleDateOnly}.`,
    };
  }

  const leaveConflict = await LeaveRequest.findOne({
    requesterRole: "Guard",
    guard: guardId,
    status: "Approved",
    dates: newScheduleDateOnly,
  });

  if (leaveConflict) {
    return {
      ...scheduleData,
      reason: `This guard is on approved leave on ${newScheduleDateOnly}.`,
    };
  }

  return null;
};

const findBatchDuplicateConflict = (schedules = []) => {
  const seen = new Set();

  for (const schedule of schedules) {
    const key = `${schedule.guardId}-${getScheduleDateOnly(schedule.timeIn)}`;
    if (seen.has(key)) {
      return {
        ...schedule,
        reason: `This guard is already included in the selected batch on ${getScheduleDateOnly(schedule.timeIn)}.`,
      };
    }
    seen.add(key);
  }

  return null;
};

// Create a Schedule
export const createSchedule = async (req, res) => {
  try {
    const { schedules, batchMeta } = req.body;

    // Assign a single batchId for all schedules submitted together
    const batchId = uuidv4();

    // Handle multiple schedule submissions
    if (Array.isArray(schedules)) {
      if (schedules.length === 0) {
        return res.status(400).json({
          message: "At least one schedule is required.",
        });
      }

      const normalizedBatchMeta = normalizeBatchMeta(batchMeta, schedules);
      const duplicateConflict = findBatchDuplicateConflict(schedules);
      if (duplicateConflict) {
        return res.status(400).json({
          message: "A schedule conflict was detected. Please review and fix it.",
          conflicts: [duplicateConflict],
        });
      }

      for (const schedule of schedules) {
        const conflict = await findConflict(schedule);
        if (conflict) {
          return res.status(400).json({
            message: "A schedule conflict was detected. Please review and fix it.",
            conflicts: [conflict],
          });
        }
        schedule.batchId = batchId; // attach batchId
        schedule.batchMeta = normalizedBatchMeta;
      }

      const createdSchedules = await Schedule.insertMany(
        attachBatchMetaToSchedules(schedules, normalizedBatchMeta)
      );
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

    const normalizedBatchMeta = normalizeBatchMeta(batchMeta, [req.body]);
    req.body.batchId = batchId; // attach batchId
    req.body.batchMeta = normalizedBatchMeta;
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

    const schedules = await Schedule.find(filter).populate("guardId", "firstName lastName fullName email guardId");
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error: error.message });
  }
};

// Get single schedule by ID
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate("guardId", "firstName lastName fullName email guardId");
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
    }).populate("guardId", "firstName lastName fullName email guardId");

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
    }).populate("guardId", "firstName lastName fullName email guardId");

    
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
  const { batchId, id, client } = req.body;

  try {
    let targetBatchId = batchId;

    if (!targetBatchId && id) {
      const schedule = await Schedule.findById(id).select("batchId");
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      targetBatchId = schedule.batchId;
    }

    if (!targetBatchId) {
      return res.status(400).json({
        message: client
          ? "Batch approval now requires a batch identifier."
          : "Batch ID is required",
      });
    }

    const result = await Schedule.updateMany(
      { batchId: targetBatchId, isApproved: "Pending" },
      { $set: { isApproved: "Approved" } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "No pending schedules found for this batch" });

    res.status(200).json({
      message: `Approved ${result.modifiedCount} schedule(s) for batch ${targetBatchId}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error approving schedules", error: error.message });
  }
};

// Decline all pending schedules for a client 
export const declineClientSchedules = async (req, res) => {
  const { batchId, id, client, remarks } = req.body;

  try {
    let targetBatchId = batchId;

    if (!targetBatchId && id) {
      const schedule = await Schedule.findById(id).select("batchId");
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      targetBatchId = schedule.batchId;
    }

    if (!targetBatchId) {
      return res.status(400).json({
        message: client
          ? "Batch decline now requires a batch identifier."
          : "Batch ID is required",
      });
    }

    const result = await Schedule.updateMany(
    { batchId: targetBatchId, isApproved: "Pending" },
    { isApproved: "Declined", remarks: remarks });

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "No pending schedules found for this batch" });

    res.status(200).json({
      message: `Declined ${result.modifiedCount} schedule(s) for batch ${targetBatchId}`,
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
    const { schedules: newSchedules, batchMeta } = req.body;

    const originalSchedule = await Schedule.findById(id);
    if (!originalSchedule) {
      return res.status(404).json({ message: "Original schedule not found, cannot identify batch." });
    }

    const normalizedBatchMeta = normalizeBatchMeta(batchMeta || originalSchedule.batchMeta, newSchedules);

    const duplicateConflict = findBatchDuplicateConflict(newSchedules);
    if (duplicateConflict) {
      return res.status(400).json({
        message: "A schedule conflict was detected. Please review and fix it.",
        conflicts: [duplicateConflict],
      });
    }

    const existingBatchSchedules = await Schedule.find(
      originalSchedule.batchId ? { batchId: originalSchedule.batchId } : { _id: originalSchedule._id }
    ).select("_id");

    const currentBatchId = originalSchedule.batchId || originalSchedule._id.toString();
    const excludedIds = existingBatchSchedules.map((schedule) => schedule._id);

    for (const schedule of newSchedules) {
      const conflict = await findConflict(schedule, { excludedBatchId: originalSchedule.batchId, excludedIds });
      if (conflict) {
        return res.status(400).json({
          message: "A schedule conflict was detected. Please review and fix it.",
          conflicts: [conflict],
        });
      }
    }

    const deleteQuery = originalSchedule.batchId
      ? { batchId: currentBatchId }
      : { _id: originalSchedule._id };

    await Schedule.deleteMany(deleteQuery);

    const batchId = currentBatchId;
    const schedulesToCreate = newSchedules.map((schedule) => ({
      ...schedule,
      batchId,
      batchMeta: normalizedBatchMeta,
    }));

    const createdSchedules = await Schedule.insertMany(schedulesToCreate);
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

    const batchQuery = schedule.batchId
      ? { batchId: schedule.batchId }
      : { _id: schedule._id };

    const batchSchedules = await Schedule.find(batchQuery).populate('guardId', 'fullName');

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

      const deleteQuery = schedule.batchId
        ? { batchId: schedule.batchId }
        : { _id: schedule._id };

      const result = await Schedule.deleteMany(deleteQuery);

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
