import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, List, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { format, getMonth, getYear } from "date-fns";
import "react-day-picker/dist/style.css";

const api = import.meta.env.VITE_API_URL;

// --- Helper Functions (Top Level) ---
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
    "Day Shift": "bg-yellow-400 text-black",
    "Night Shift": "bg-blue-500 text-white",
  };
  return (
    <div className="bg-[#1e293b]/90 border border-gray-700 rounded-2xl p-4 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-base">{schedule.client}</p>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${shiftColors[schedule.shiftType]}`}>
          {schedule.shiftType}
        </span>
      </div>
      <div className="border-t border-gray-700 pt-3 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{formatTimeDisplay(schedule.timeIn)} - {formatTimeDisplay(schedule.timeOut)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>{schedule.deploymentLocation}</span>
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
    <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg mb-4">
      <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-md hover:bg-[#2a3954] text-gray-400 hover:text-white"><ChevronLeft /></button>
      <span className="font-semibold text-lg text-white">{format(currentMonth, "MMMM yyyy")}</span>
      <button onClick={() => handleMonthChange(1)} className="p-2 rounded-md hover:bg-[#2a3954] text-gray-400 hover:text-white"><ChevronRight /></button>
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
    <div className="space-y-4">
      <MonthNavigator currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      {sortedDates.length === 0 ? (
        <p className="text-gray-400 text-center mt-10 py-8">No schedules for this month.</p>
      ) : (
        sortedDates.map((date) => (
          <div key={date}>
            <h2 className="font-semibold text-md my-3 pl-2 border-l-4 border-blue-500">{formatDateDisplay(date, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
            <div className="space-y-3">
              {groupedByDate[date].map((s, i) => <ScheduleCard key={i} schedule={s} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const CalendarView = ({ schedules, currentMonth, setCurrentMonth }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  const scheduledDays = schedules.map(s => {
    try {
      // Use the date part of the string to avoid timezone shifts
      return new Date(s.timeIn.split('T')[0] + 'T00:00:00');
    } catch { return null }
  }).filter(Boolean);
  
  const handleDayClick = (day, modifiers) => {
    if (modifiers.scheduled) {
      setSelectedDate(day);
    } else {
      setSelectedDate(null);
    }
  };

  const schedulesForSelectedDay = selectedDate
    ? schedules.filter(s => s.timeIn.split('T')[0] === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-[#1e293b]/90 border border-gray-700 rounded-2xl p-2 sm:p-4 shadow-md flex justify-center">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onDayClick={handleDayClick}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={{ scheduled: scheduledDays }}
          className="text-white"
          classNames={{
            caption_label: 'text-lg font-bold text-blue-300',
            nav_button: 'text-blue-400 hover:text-blue-300 p-1',
            head_cell: 'text-gray-400 font-normal text-sm w-10 sm:w-12',
            day: 'h-10 w-10 hover:bg-blue-500/20 rounded-full',
            day_selected: 'bg-blue-600 text-white rounded-full',
            day_today: 'bg-blue-500/30 rounded-full',
            day_outside: 'text-gray-600 opacity-50',
            modifier_scheduled: 'font-bold text-blue-400 border border-blue-500 rounded-full',
          }}
        />
      </div>
      
      {selectedDate && (
        <div className="space-y-2 pt-4 border-t border-gray-700">
          <h2 className="text-lg font-semibold text-center">{formatDateDisplay(selectedDate)}</h2>
          {schedulesForSelectedDay.length > 0 ? (
            schedulesForSelectedDay.map((s, i) => <ScheduleCard key={i} schedule={s} />)
          ) : (
            <p className="text-gray-500 text-center">No schedule for this day.</p>
          )}
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
            document.title = "Detachment | JPM Agency Security";
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
    console.log(schedules);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
                <p className="text-gray-400">Loading schedules...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-blue-400" />
                    My Schedule
                </h1>
                <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('list')}
                        title="List View"
                        className={`p-2 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#2a3954]'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        title="Calendar View"
                        className={`p-2 rounded-md text-sm font-medium transition ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#2a3954]'}`}
                    >
                        <Calendar className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <ListView schedules={schedules} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
            ) : (
                <CalendarView schedules={schedules} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
            )}
        </div>
    );
}