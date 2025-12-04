import { useEffect, useState, useMemo } from "react";
import { CalendarDays, Clock, MapPin, List, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { format, getMonth, getYear, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import "react-day-picker/dist/style.css";

const api = import.meta.env.VITE_API_URL;

// --- Custom Styles for Dark Mode DatePicker (Enhanced for Range) ---
const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #3b82f6;
    --rdp-background-color: #1e293b;
    margin: 0;
  }
  .rdp-day:hover:not([disabled]) { 
    background-color: #334155; 
  }
  .rdp-caption_label, .rdp-head_cell, .rdp-day {
    color: #e2e8f0;
  }
  .rdp-button:hover:not([disabled]) {
    background-color: #334155;
  }
  .rdp-nav_button { color: #94a3b8; }

  /* Range Selection Styles */
  .rdp-day_range_start:not(.rdp-day_range_end) {
    background-color: #3b82f6 !important;
    color: white !important;
    border-radius: 100% 0 0 100% !important;
  }
  .rdp-day_range_end:not(.rdp-day_range_start) {
    background-color: #3b82f6 !important;
    color: white !important;
    border-radius: 0 100% 100% 0 !important;
  }
  .rdp-day_range_start.rdp-day_range_end {
    background-color: #3b82f6 !important;
    color: white !important;
    border-radius: 100% !important;
  }
  .rdp-day_range_middle {
    background-color: rgba(59, 130, 246, 0.2) !important;
    color: #93c5fd !important;
    border-radius: 0 !important;
  }
`;

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

const CalendarView = ({ schedules, currentMonth, setCurrentMonth }) => {
  const [selectedRange, setSelectedRange] = useState(); // Change to handle range object { from, to }

  // Extract dates for modifiers (visual dots)
  const scheduledDays = useMemo(() => schedules.map(s => {
    try {
      return new Date(s.timeIn.split('T')[0] + 'T00:00:00');
    } catch { return null }
  }).filter(Boolean), [schedules]);
  
  // Filter schedules based on range
  const schedulesInRange = useMemo(() => {
    if (!selectedRange?.from) return [];

    const start = startOfDay(selectedRange.from);
    const end = selectedRange.to ? endOfDay(selectedRange.to) : endOfDay(selectedRange.from);

    return schedules.filter(s => {
        try {
            const scheduleDate = new Date(s.timeIn);
            return scheduleDate >= start && scheduleDate <= end;
        } catch { return false; }
    }).sort((a,b) => new Date(a.timeIn) - new Date(b.timeIn));
  }, [selectedRange, schedules]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-4 shadow-xl flex justify-center overflow-hidden">
        <div className="w-full overflow-x-auto flex justify-center">
            <DayPicker
                mode="range" // Enabled range mode
                selected={selectedRange}
                onSelect={setSelectedRange}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={{ scheduled: scheduledDays }}
                className="text-white m-0"
                classNames={{
                    caption: 'flex justify-center py-2 mb-4 relative items-center',
                    caption_label: 'text-lg font-bold text-gray-100',
                    nav: 'flex items-center',
                    nav_button: 'h-7 w-7 bg-transparent hover:bg-slate-700 rounded-md flex items-center justify-center p-0 text-gray-400 hover:text-white transition',
                    nav_button_previous: 'absolute left-1',
                    nav_button_next: 'absolute right-1',
                    table: 'w-full border-collapse space-y-1',
                    head_row: 'flex',
                    head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
                    row: 'flex w-full mt-2',
                    cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20',
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-700 rounded-full transition-colors text-gray-300',
                    day_today: 'bg-slate-700 text-white font-bold',
                    day_outside: 'text-gray-600 opacity-50',
                    day_disabled: 'text-gray-600 opacity-50',
                    modifier_scheduled: 'font-bold text-blue-400 border-2 border-blue-500/50',
                }}
            />
        </div>
      </div>
      
      {/* Selection Header */}
      {selectedRange?.from && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300 bg-blue-900/20 p-3 rounded-xl border border-blue-900/50">
            <div>
                <p className="text-xs text-blue-300 font-medium uppercase tracking-wider mb-1">Selected Range</p>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    {formatDateDisplay(selectedRange.from, { month:'short', day:'numeric'})}
                    {selectedRange.to && (
                        <>
                            <span className="text-gray-500">-</span>
                            {formatDateDisplay(selectedRange.to, { month:'short', day:'numeric'})}
                        </>
                    )}
                </h2>
            </div>
            {schedulesInRange.length > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                    {schedulesInRange.length} Shifts
                </span>
            )}
            <button onClick={() => setSelectedRange(undefined)} className="p-1 hover:bg-blue-800/50 rounded-full text-blue-300">
                <X size={16} />
            </button>
        </div>
      )}

      {/* Schedule List for Selected Range */}
      {selectedRange?.from ? (
        schedulesInRange.length > 0 ? (
            <div className="space-y-3">
                {schedulesInRange.map((s, i) => (
                    <div key={i}>
                        {/* Show date header if it changes from previous item */}
                        {(i === 0 || new Date(s.timeIn).toDateString() !== new Date(schedulesInRange[i-1].timeIn).toDateString()) && (
                            <div className="text-xs font-semibold text-gray-500 mt-4 mb-2 uppercase tracking-wide pl-1">
                                {formatDateDisplay(s.timeIn, { weekday: 'short', month:'short', day:'numeric' })}
                            </div>
                        )}
                        <ScheduleCard schedule={s} />
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500 bg-[#1e293b]/30 rounded-xl border border-dashed border-gray-700">
                No schedules in this range.
            </div>
        )
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
            Select a date or range to view schedules.
        </div>
      )}
    </div>
  );
};


// --- Main Component ---

export default function GuardUpcomingSchedule() {
    const { user: guard, loading } = useAuth();
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [viewMode, setViewMode] = useState("list");
    const [currentMonth, setCurrentMonth] = useState(new Date());

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
                    setSchedules(data);
                } catch (err) {
                    console.error("Error fetching schedules:", err);
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
            <style>{datePickerStyles}</style>
            
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
                {viewMode === 'list' ? (
                    <ListView schedules={schedules} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
                ) : (
                    <CalendarView schedules={schedules} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
                )}
            </div>
        </div>
    );
}