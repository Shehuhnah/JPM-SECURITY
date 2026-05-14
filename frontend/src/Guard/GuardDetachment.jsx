import { useEffect, useState, useMemo } from "react";
import { CalendarDays, Clock, MapPin, List, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { format, getMonth, getYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";

const api = import.meta.env.VITE_API_URL;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Helper Functions ---
const formatTimeDisplay = (timeString) => {
  if (!timeString) return "N/A";
  try {
    const dateObj = new Date(timeString);
    if (isNaN(dateObj.getTime())) return "Invalid Time";
    let h = dateObj.getHours();
    const m = dateObj.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const mFormatted = String(m).padStart(2, '0');
    return `${String(h).padStart(2, '0')}:${mFormatted} ${ampm}`;
  } catch (e) {
    return "Invalid Time";
  }
};

const formatDateDisplay = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    const defaultOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
  } catch (e) {
    return "Invalid Date";
  }
};

const formatMonthValue = (value) => {
  if (!value) return "Unknown month";
  const [year, month] = String(value).split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
};

const getCoveredMonthsFromSchedules = (schedules = []) => {
  const metadataMonths = schedules.flatMap((schedule) => schedule?.batchMeta?.coveredMonths || []);
  const validMetadataMonths = [...new Set(metadataMonths.filter((value) => /^\d{4}-\d{2}$/.test(String(value))))].sort();
  if (validMetadataMonths.length > 0) {
    return validMetadataMonths;
  }

  return [...new Set(
    schedules
      .map((schedule) => String(schedule?.timeIn || "").slice(0, 7))
      .filter((value) => /^\d{4}-\d{2}$/.test(value))
  )].sort();
};

const getScopeLabel = (batchMeta, coveredMonths) => {
  if (batchMeta?.scopeType === "count") {
    return `Next ${batchMeta?.monthCount || coveredMonths.length || 1} Months`;
  }
  if (batchMeta?.scopeType === "custom") {
    return "Custom Months";
  }
  return "One Month";
};

// --- Child Components ---

const ScheduleCard = ({ schedule }) => {
  const shiftColors = {
    "Day Shift": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    "Night Shift": "bg-red-500/20 text-red-400 border border-red-500/30",
  };
  
  const badgeClass = shiftColors[schedule.shiftType] || "bg-blue-500/20 text-blue-400 border border-blue-500/30";

  return (
    <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
            <h3 className="font-bold text-white text-base leading-tight">{schedule.client}</h3>
            <p className="text-xs text-gray-400 mt-1">Position: {schedule.position || "Guard"}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide whitespace-nowrap ${badgeClass}`}>
          {schedule.shiftType}
        </span>
      </div>
      
      <div className="border-t border-gray-700/50 pt-3 space-y-2">
        <div className="flex items-center gap-2.5 text-sm text-gray-300">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{formatTimeDisplay(schedule.timeIn)} - {formatTimeDisplay(schedule.timeOut)}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-300">
          <MapPin className="w-4 h-4 text-red-400 shrink-0" />
          <span className="truncate">{schedule.deploymentLocation}</span>
        </div>
      </div>
    </div>
  );
};

const MiniSchedulePill = ({ schedule }) => {
  const isNightShift = schedule.shiftType === "Night Shift";

  return (
    <div className={`rounded-lg border px-2 py-1.5 text-left ${
      isNightShift
        ? "border-red-500/20 bg-red-500/10"
        : "border-amber-500/20 bg-amber-500/10"
    }`}>
      <div className={`truncate text-[10px] font-bold uppercase tracking-[0.16em] ${
        isNightShift ? "text-red-300" : "text-amber-300"
      }`}>
        {schedule.shiftType}
      </div>
      <div className="mt-1 truncate text-[11px] font-medium text-white">
        {schedule.client}
      </div>
      <div className="mt-1 truncate text-[10px] text-slate-300">
        {formatTimeDisplay(schedule.timeIn)}
      </div>
    </div>
  );
};

const useIsMobileScreen = (breakpoint = 768) => {
  const getValue = () =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false;

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const handleResize = () => setIsMobile(getValue());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
};

const MonthNavigator = ({ currentMonth, setCurrentMonth }) => {
  const handleMonthChange = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };
  return (
    <div className="flex justify-between items-center p-3 bg-[#1e293b] border border-gray-700 rounded-xl mb-6 shadow-sm">
      <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition">
        <ChevronLeft size={20} />
      </button>
      <span className="font-bold text-lg text-white capitalize">{format(currentMonth, "MMMM yyyy")}</span>
      <button onClick={() => handleMonthChange(1)} className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition">
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

const ListView = ({ schedules, currentMonth, setCurrentMonth }) => {
  const filteredSchedules = schedules.filter(s => {
    try {
      const scheduleDate = new Date(s.timeIn);
      return getYear(scheduleDate) === getYear(currentMonth) && getMonth(scheduleDate) === getMonth(currentMonth);
    } catch {
      return false;
    }
  });

  const groupedByDate = filteredSchedules.reduce((acc, s) => {
    const dateKey = s.timeIn.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6 pb-20">
      <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-gray-800 border-dashed">
            <CalendarDays size={48} className="mb-4 opacity-20"/>
            <p>No schedules found for this month.</p>
        </div>
      ) : (
        sortedDates.map((date) => (
          <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur py-2 mb-2 border-b border-gray-800 flex items-center">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></div>
                <h2 className="font-semibold text-white text-sm uppercase tracking-wide">
                    {formatDateDisplay(date, { weekday: 'long', month: 'short', day: 'numeric' })}
                </h2>
            </div>
            <div className="space-y-3 pl-4 border-l border-gray-800 ml-0.5">
              {groupedByDate[date].map((s, i) => <ScheduleCard key={i} schedule={s} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const MobileCalendarView = ({ monthSchedules, schedulesByDay, selectedDay, setSelectedDate }) => {
  const dutyDays = Object.keys(schedulesByDay).sort();
  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedDaySchedules = selectedDayKey ? (schedulesByDay[selectedDayKey] || []) : [];

  return (
    <div className="space-y-5">
      <div className="rounded-[26px] border border-slate-700/60 bg-gradient-to-br from-[#1b2435] via-[#111827] to-[#0f172a] p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Mobile Duty View
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Tap a scheduled day to inspect approved shift details.
            </p>
          </div>
          <span className="rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-300">
            {monthSchedules.length} shift{monthSchedules.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">Duty Days</div>
            <div className="mt-2 text-2xl font-black text-white">{dutyDays.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Selected Day</div>
            <div className="mt-2 text-sm font-bold text-white">
              {selectedDay ? formatDateDisplay(selectedDay, { month: "short", day: "numeric", weekday: "short" }) : "None"}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Scheduled Days
          </div>
          {dutyDays.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {dutyDays.map((dayKey) => {
                const dayDate = new Date(`${dayKey}T00:00:00`);
                const daySchedules = schedulesByDay[dayKey] || [];
                const isSelected = selectedDay ? isSameDay(dayDate, selectedDay) : false;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDate(dayDate)}
                    className={`min-w-[118px] rounded-2xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-blue-500/40 bg-blue-500/15"
                        : "border-slate-700 bg-slate-900/70 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {format(dayDate, "EEE")}
                    </div>
                    <div className="mt-2 text-lg font-black text-white">
                      {format(dayDate, "d")}
                    </div>
                    <div className="text-xs text-slate-400">
                      {format(dayDate, "MMM")}
                    </div>
                    <div className="mt-3 rounded-full bg-blue-500/10 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300">
                      {daySchedules.length} shift{daySchedules.length === 1 ? "" : "s"}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-500">
              No approved schedules found for this month.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[26px] border border-slate-700/60 bg-[#1e293b]/45 p-4 shadow-lg backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
            {selectedDay ? `Duty Details For ${formatDateDisplay(selectedDay, { weekday: "short", month: "short", day: "numeric" })}` : "Duty Details"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Approved schedule details for the selected day.
          </p>
        </div>

        {selectedDaySchedules.length > 0 ? (
          <div className="space-y-3">
            {selectedDaySchedules.map((schedule) => (
              <ScheduleCard key={`${schedule._id}-${schedule.timeIn}`} schedule={schedule} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-500">
            Select a scheduled day to view details.
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarView = ({ schedules, currentMonth, setCurrentMonth, isMobile }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  const monthSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      try {
        const scheduleDate = new Date(schedule.timeIn);
        return getYear(scheduleDate) === getYear(currentMonth) && getMonth(scheduleDate) === getMonth(currentMonth);
      } catch {
        return false;
      }
    }).sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
  }, [currentMonth, schedules]);

  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentMonth));
    const gridEnd = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const schedulesByDay = useMemo(() => {
    return monthSchedules.reduce((acc, schedule) => {
      const key = String(schedule.timeIn).slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(schedule);
      acc[key].sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
      return acc;
    }, {});
  }, [monthSchedules]);

  const selectedDay = selectedDate && isSameMonth(selectedDate, currentMonth)
    ? selectedDate
    : monthSchedules.length > 0
      ? new Date(`${String(monthSchedules[0].timeIn).slice(0, 10)}T00:00:00`)
      : null;

  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedDaySchedules = selectedDayKey ? (schedulesByDay[selectedDayKey] || []) : [];
  const dutyDayCount = Object.keys(schedulesByDay).length;

  if (isMobile) {
    return (
      <MobileCalendarView
        monthSchedules={monthSchedules}
        schedulesByDay={schedulesByDay}
        selectedDay={selectedDay}
        setSelectedDate={setSelectedDate}
      />
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="rounded-[28px] border border-slate-700/60 bg-gradient-to-br from-[#1b2435] via-[#111827] to-[#0f172a] p-4 sm:p-5 shadow-xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Monthly Duty Calendar
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Approved shifts are shown directly inside each calendar day.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-300">
              {dutyDayCount} duty day{dutyDayCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-300">
              {monthSchedules.length} shift{monthSchedules.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />

        <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500 sm:hidden">
          <span>Swipe horizontally to inspect each day.</span>
          <span>{format(currentMonth, "MMMM yyyy")}</span>
        </div>

        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[820px] overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1220]/80">
            <div className="grid grid-cols-7 border-b border-slate-700/60 bg-slate-900/70">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const daySchedules = schedulesByDay[dayKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[118px] sm:min-h-[132px] border-r border-b border-slate-800/80 p-2 text-left align-top transition ${
                      isSelected
                        ? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/40"
                        : "bg-transparent hover:bg-slate-800/45"
                    } ${!isCurrentMonth ? "bg-slate-950/35" : ""}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : isCurrentMonth
                            ? "text-slate-200"
                            : "text-slate-600"
                      }`}>
                        {format(day, "d")}
                      </span>
                      {daySchedules.length > 0 && (
                        <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                          {daySchedules.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {daySchedules.slice(0, 2).map((schedule) => (
                        <MiniSchedulePill
                          key={`${schedule._id}-${schedule.timeIn}`}
                          schedule={schedule}
                        />
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="rounded-lg border border-slate-700/70 bg-slate-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          +{daySchedules.length - 2} more shifts
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-700/60 bg-[#1e293b]/45 p-5 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              {selectedDay ? `Duty Details For ${formatDateDisplay(selectedDay, { weekday: "short", month: "short", day: "numeric" })}` : "Duty Details"}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Select a calendar day to review approved deployment details.
            </p>
          </div>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-blue-500/40 hover:text-white"
            >
              Reset Selection
            </button>
          )}
        </div>

        {selectedDaySchedules.length > 0 ? (
          <div className="space-y-3">
            {selectedDaySchedules.map((schedule) => (
              <ScheduleCard key={`${schedule._id}-${schedule.timeIn}`} schedule={schedule} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-500">
            {selectedDay
              ? "No approved schedules for the selected day."
              : "No approved schedules found for this month."}
          </div>
        )}
      </div>
    </div>
  );
};


// --- Main Component ---

export default function GuardUpcomingSchedule() {
    const { user: guard, loading } = useAuth();
    const navigate = useNavigate();
    const isMobileScreen = useIsMobileScreen();
    const [schedules, setSchedules] = useState([]);
    const [viewMode, setViewMode] = useState("list");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const coveredMonths = useMemo(() => getCoveredMonthsFromSchedules(schedules), [schedules]);
    const monthKey = format(currentMonth, "yyyy-MM");
    const currentMonthSchedules = useMemo(
      () => schedules.filter((schedule) => String(schedule?.timeIn || "").startsWith(monthKey)),
      [monthKey, schedules]
    );
    const upcomingSchedule = useMemo(() => {
      const now = new Date();
      return schedules
        .slice()
        .sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn))
        .find((schedule) => new Date(schedule.timeOut) >= now) || null;
    }, [schedules]);
    const primaryScopeLabel = useMemo(() => {
      if (schedules.length === 0) return null;

      const firstSchedule = schedules[0];
      const coveredMonthsForBatch = Array.isArray(firstSchedule?.batchMeta?.coveredMonths) && firstSchedule.batchMeta.coveredMonths.length > 0
        ? [...firstSchedule.batchMeta.coveredMonths].sort()
        : [String(firstSchedule?.timeIn || "").slice(0, 7)].filter(Boolean);

      return getScopeLabel(firstSchedule?.batchMeta, coveredMonthsForBatch);
    }, [schedules]);

    useEffect(() => {
        if (!loading && !guard) {
            navigate("/guard/login");
            return;
        }
        if (guard?._id) {
            document.title = "My Schedule | JPM Security";
            const fetchSchedulesByGuard = async () => {
                try {
                    const res = await fetch(`${api}/api/schedules/guard/${guard._id}`, { credentials: "include" });
                    if (!res.ok) throw new Error("Failed to fetch schedules");
                    const data = await res.json();
                    setSchedules(Array.isArray(data) ? data : []);
                } catch (err) {
                    console.error("Error fetching schedules:", err);
                    setSchedules([]);
                }
            };
            fetchSchedulesByGuard();
        }
    }, [guard, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 text-sm animate-pulse">Loading your schedule...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <CalendarDays className="w-6 h-6 text-blue-400" />
                        </div>
                        My Schedule
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 ml-11">View your upcoming shifts and locations.</p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-[#1e293b] p-1.5 rounded-xl border border-gray-700 w-fit self-end sm:self-auto">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'list' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'text-gray-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        <List size={16} /> List
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'calendar' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'text-gray-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        <Calendar size={16} /> Calendar
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-3xl mx-auto">
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-300">Covered Months</div>
                        <div className="mt-2 text-2xl font-bold text-white">{coveredMonths.length}</div>
                        <div className="mt-2 text-xs text-blue-100">
                            {coveredMonths.length > 0 ? coveredMonths.map(formatMonthValue).join(", ") : "No approved schedule months"}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Month</div>
                        <div className="mt-2 text-2xl font-bold text-white">{currentMonthSchedules.length}</div>
                        <div className="mt-2 text-xs text-slate-300">
                            {format(currentMonth, "MMMM yyyy")} shift{currentMonthSchedules.length === 1 ? "" : "s"}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next Duty</div>
                        <div className="mt-2 text-sm font-bold text-white">
                            {upcomingSchedule ? formatDateDisplay(upcomingSchedule.timeIn, { month: "short", day: "numeric" }) : "No upcoming shift"}
                        </div>
                        <div className="mt-2 text-xs text-slate-300">
                            {upcomingSchedule ? `${upcomingSchedule.client} • ${formatTimeDisplay(upcomingSchedule.timeIn)}` : "Awaiting approved deployment"}
                        </div>
                    </div>
                </div>

                {primaryScopeLabel && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                            {primaryScopeLabel}
                        </span>
                    </div>
                )}

                {viewMode === 'list' ? (
                    <ListView schedules={schedules} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
                ) : (
                    <CalendarView
                      schedules={schedules}
                      currentMonth={currentMonth}
                      setCurrentMonth={setCurrentMonth}
                      isMobile={isMobileScreen}
                    />
                )}
            </div>
        </div>
    );
}
