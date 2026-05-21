const REGULAR_MINUTES_PER_DAY = 8 * 60;

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getAttendanceMinutesBreakdown = ({ timeIn, timeOut, accumulatedWorkedMinutes = null, scheduleId = null }) => {
  const start = toDate(timeIn);
  const normalizedAccumulatedWorkedMinutes = Number.isFinite(accumulatedWorkedMinutes)
    ? Math.max(0, accumulatedWorkedMinutes)
    : null;

  // For guards (scheduleId present), the shift is a 12-hour regular shift.
  // Otherwise, default to 8 hours regular limit for admin/staff.
  const regularLimit = scheduleId ? 12 * 60 : 8 * 60;

  if (normalizedAccumulatedWorkedMinutes !== null) {
    let workedMinutes = normalizedAccumulatedWorkedMinutes;

    if (!timeOut && start) {
      workedMinutes += Math.max(0, Math.round((new Date() - start) / 60000));
    }

    // Strict 24-hour shift working limit
    workedMinutes = Math.min(workedMinutes, 24 * 60);

    const regularMinutes = Math.min(workedMinutes, regularLimit);
    const overtimeMinutes = Math.max(0, workedMinutes - regularLimit);

    return {
      regularMinutes,
      overtimeMinutes,
      totalMinutes: regularMinutes + overtimeMinutes,
    };
  }

  if (!start) {
    return {
      regularMinutes: 0,
      overtimeMinutes: 0,
      totalMinutes: 0,
    };
  }

  if (!timeOut) {
    const elapsedMinutes = Math.min(Math.max(0, Math.round((new Date() - start) / 60000)), 24 * 60);
    const regularMinutes = Math.min(elapsedMinutes, regularLimit);
    const overtimeMinutes = Math.max(0, elapsedMinutes - regularLimit);
    return {
      regularMinutes,
      overtimeMinutes,
      totalMinutes: elapsedMinutes,
    };
  }

  let end = toDate(timeOut);
  if (!end) {
    const elapsedMinutes = Math.min(Math.max(0, Math.round((new Date() - start) / 60000)), 24 * 60);
    const regularMinutes = Math.min(elapsedMinutes, regularLimit);
    const overtimeMinutes = Math.max(0, elapsedMinutes - regularLimit);
    return {
      regularMinutes,
      overtimeMinutes,
      totalMinutes: elapsedMinutes,
    };
  }

  if (end < start) {
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }

  let workedMinutes = Math.max(0, Math.round((end - start) / 60000));
  
  // Strict 24-hour shift working limit
  workedMinutes = Math.min(workedMinutes, 24 * 60);

  const regularMinutes = Math.min(workedMinutes, regularLimit);
  const overtimeMinutes = Math.max(0, workedMinutes - regularLimit);

  return {
    regularMinutes,
    overtimeMinutes,
    totalMinutes: regularMinutes + overtimeMinutes,
  };
};

export const toHours = (minutes) => Number((minutes / 60).toFixed(2));

export { REGULAR_MINUTES_PER_DAY };

