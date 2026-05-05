const REGULAR_MINUTES_PER_DAY = 8 * 60;

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getAttendanceMinutesBreakdown = ({ timeIn, timeOut, accumulatedWorkedMinutes = null }) => {
  const start = toDate(timeIn);
  const normalizedAccumulatedWorkedMinutes = Number.isFinite(accumulatedWorkedMinutes)
    ? Math.max(0, accumulatedWorkedMinutes)
    : null;

  if (normalizedAccumulatedWorkedMinutes !== null) {
    let workedMinutes = normalizedAccumulatedWorkedMinutes;

    if (!timeOut && start) {
      workedMinutes += Math.max(0, Math.round((new Date() - start) / 60000));
    }

    const regularMinutes = Math.min(workedMinutes, REGULAR_MINUTES_PER_DAY);
    const overtimeMinutes = Math.max(0, workedMinutes - REGULAR_MINUTES_PER_DAY);

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
    return {
      regularMinutes: REGULAR_MINUTES_PER_DAY,
      overtimeMinutes: 0,
      totalMinutes: REGULAR_MINUTES_PER_DAY,
    };
  }

  let end = toDate(timeOut);
  if (!end) {
    return {
      regularMinutes: REGULAR_MINUTES_PER_DAY,
      overtimeMinutes: 0,
      totalMinutes: REGULAR_MINUTES_PER_DAY,
    };
  }

  if (end < start) {
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }

  const workedMinutes = Math.max(0, Math.round((end - start) / 60000));
  const regularMinutes = Math.min(workedMinutes, REGULAR_MINUTES_PER_DAY);
  const overtimeMinutes = Math.max(0, workedMinutes - REGULAR_MINUTES_PER_DAY);

  return {
    regularMinutes,
    overtimeMinutes,
    totalMinutes: regularMinutes + overtimeMinutes,
  };
};

export const toHours = (minutes) => Number((minutes / 60).toFixed(2));

export { REGULAR_MINUTES_PER_DAY };
