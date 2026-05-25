import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Clock3,
  FileDown,
  LogIn,
  LogOut,
  RefreshCcw,
  UserCircle2,
  CalendarDays,
  FileImage,
  FileText,
  User,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";
import { Dialog, Transition } from "@headlessui/react";
import { format, getDaysInMonth } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const api = import.meta.env.VITE_API_URL;
const SUMMARY_DAYS = 15;

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

const isSameMonthRange = (from, to) =>
  Boolean(
    from &&
      to &&
      from.getFullYear() === to.getFullYear() &&
      from.getMonth() === to.getMonth()
  );

const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 36px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #111827;
    margin: 0;
  }
  .rdp-caption_label { color: #f8fafc; font-weight: 700; }
  .rdp-weekday { color: #ffffff; font-size: 0.75rem; text-transform: uppercase; }
  .rdp-day { color: #f8fafc; }
  .rdp-day_button { color: #f8fafc; }
  .rdp-button_previous, .rdp-button_next, .rdp-nav_button { color: #e2e8f0; }
  .rdp-day:hover:not([disabled]) { background-color: #1e293b; border-radius: 8px; }
  .rdp-selected .rdp-day_button,
  .rdp-range_start .rdp-day_button,
  .rdp-range_end .rdp-day_button { background-color: #2563eb; color: #ffffff; border-radius: 8px; font-weight: 700; }
  .rdp-range_middle .rdp-day_button { background-color: rgba(59,130,246,0.35); color: #ffffff; border-radius: 0; font-weight: 600; }
  .rdp-day_button:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
`;

const formatDateTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDurationLabel = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return "--";
  const diff = Math.max(0, new Date(timeOut) - new Date(timeIn));
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const getWorkedMilliseconds = (record, currentTime = new Date()) => {
  if (!record) return 0;

  const accumulatedWorkedMinutes = Number.isFinite(record.accumulatedWorkedMinutes)
    ? Math.max(0, record.accumulatedWorkedMinutes)
    : 0;
  let totalMs = accumulatedWorkedMinutes * 60000;

  if (record.timeIn && !record.timeOut) {
    const recordDateKey = record.dateKey || getDateKey(record.firstTimeIn || record.timeIn);
    const manila9PM = new Date(`${recordDateKey}T21:00:00+08:00`);
    const end = currentTime < manila9PM ? currentTime : manila9PM;
    totalMs += Math.max(0, end - new Date(record.timeIn));
  }

  return totalMs;
};

const getWorkedDurationLabel = (record, currentTime = new Date()) => {
  const diff = getWorkedMilliseconds(record, currentTime);
  if (!diff) return "Not Timed In";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const getWorkedHoursLabel = (record, currentTime = new Date()) => {
  const diff = getWorkedMilliseconds(record, currentTime);
  if (!diff) return "--";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const getDateKey = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatWordDate = (dateStr) => {
  if (!dateStr) return "--";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  const date = new Date(year, month - 1, day);
  return format(date, "MMMM d, yyyy");
};

const normalizeLeaveDateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, month, day, year] = slashMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return getDateKey(parsed);
    return value.slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return getDateKey(parsed);
};

const getLastNDays = (count) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return date;
  });
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const getHeatmapTone = (status) => {
  if (status === "present") {
    return "bg-emerald-500/90 border-emerald-300/70";
  }

  if (status === "leave-approved") {
    return "bg-[repeating-linear-gradient(135deg,rgba(251,191,36,0.96),rgba(251,191,36,0.96)_8px,rgba(245,158,11,0.96)_8px,rgba(245,158,11,0.96)_16px)] border-amber-100 ring-2 ring-amber-300/80 shadow-[0_0_0_1px_rgba(253,224,71,0.45)]";
  }

  if (status === "leave-pending") {
    return "bg-[repeating-linear-gradient(135deg,rgba(96,165,250,0.9),rgba(96,165,250,0.9)_8px,rgba(59,130,246,0.9)_8px,rgba(59,130,246,0.9)_16px)] border-sky-100 ring-2 ring-sky-300/80 shadow-[0_0_0_1px_rgba(125,211,252,0.35)]";
  }

  return "bg-slate-700/70 border-slate-500/60";
};

const getHeatmapLabel = (status) => {
  if (status === "present") return "Present";
  if (status === "leave-approved") return "Approved Leave";
  if (status === "leave-pending") return "Pending Leave";
  return "No Record / Day Off";
};

const getHeatmapStatus = (date, attendanceMap, leaveDateMap) => {
  const key = getDateKey(date);
  const record = attendanceMap.get(key);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (record?.timeIn) return "present";
  if (leaveDateMap.has(key)) return leaveDateMap.get(key);
  if (date > endOfToday || isWeekend(date)) return "dayoff";
  return "dayoff";
};

export default function AdminStaffAttendance() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liveNow, setLiveNow] = useState(new Date());
  const [historyDateFilter, setHistoryDateFilter] = useState("");

  // ── Download DTR modal state ──────────────────────────────────────────
  const [dtrModalOpen, setDtrModalOpen] = useState(false);
  const [reportMode, setReportMode] = useState("cutoff");
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [reportCutoff, setReportCutoff] = useState("first-half");
  const [reportDateRange, setReportDateRange] = useState({ from: null, to: null });
  const [dtrSubmitting, setDtrSubmitting] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [attendanceDetailOpen, setAttendanceDetailOpen] = useState(false);
  const [userReports, setUserReports] = useState([]);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }
    document.title = "My Attendance | JPM Security Agency";
  }, [user, loading, navigate]);

  const fetchDashboard = async () => {
    try {
      setPageLoading(true);
      const [attendanceRes, leaveRes, reportsRes] = await Promise.all([
        fetch(`${api}/api/admin-attendance/me`, {
          credentials: "include",
        }),
        fetch(`${api}/api/leaves/my`, {
          credentials: "include",
        }),
        fetch(`${api}/api/admin-reports?mine=true`, {
          credentials: "include",
        }),
      ]);

      const [attendanceData, leaveData, reportsData] = await Promise.all([
        attendanceRes.json(),
        leaveRes.json(),
        reportsRes.json().catch(() => []),
      ]);

      if (!attendanceRes.ok) throw new Error(attendanceData.message || "Failed to load attendance.");
      if (!leaveRes.ok) throw new Error(leaveData.message || "Failed to load leave requests.");

      setDashboard(attendanceData);
      setLeaveRequests(Array.isArray(leaveData) ? leaveData : []);
      setUserReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (error) {
      toast.error(error.message || "Failed to load attendance.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeIn = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`${api}/api/admin-attendance/time-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to time in.");
      toast.success("Attendance timed in.");
      await fetchDashboard();
    } catch (error) {
      toast.error(error.message || "Failed to time in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeOut = async () => {
    if (!dashboard?.todayRecord?._id) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${api}/api/admin-attendance/time-out/${dashboard.todayRecord._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to time out.");
      toast.success("Attendance timed out.");
      await fetchDashboard();
    } catch (error) {
      toast.error(error.message || "Failed to time out.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── DTR download handlers ─────────────────────────────────────────────
  const handleReportRangeSelect = (range) => {
    if (!range) { setReportDateRange({ from: null, to: null }); return; }
    if (range.from && range.to && !isSameMonthRange(range.from, range.to)) {
      toast.warn("Date range must stay within one month only.", { position: "top-center", theme: "dark" });
      setReportDateRange({ from: range.from, to: range.from });
      return;
    }
    setReportDateRange(range);
  };

  const handleConfirmDownload = async () => {
    let fromDate, toDate;
    if (reportMode === "cutoff") {
      if (!reportYear || !reportMonth) {
        toast.warn("Please select a year and month.", { position: "top-center", theme: "dark" }); return;
      }
      const year = Number(reportYear);
      const month = Number(reportMonth);
      const monthDate = new Date(year, month - 1, 1);
      const lastDay = getDaysInMonth(monthDate);
      const startDay = reportCutoff === "second-half" ? 16 : 1;
      const endDay   = reportCutoff === "first-half"  ? 15 : lastDay;
      fromDate = new Date(year, month - 1, startDay);
      toDate   = new Date(year, month - 1, endDay);
    } else {
      if (!reportDateRange?.from || !reportDateRange?.to) {
        toast.warn("Please select a start and end date.", { position: "top-center", theme: "dark" }); return;
      }
      if (!isSameMonthRange(reportDateRange.from, reportDateRange.to)) {
        toast.warn("Date range must stay within one month only.", { position: "top-center", theme: "dark" }); return;
      }
      fromDate = reportDateRange.from;
      toDate   = reportDateRange.to;
    }

    setDtrSubmitting(true);
    try {
      const fromStr = format(fromDate, "yyyy-MM-dd");
      const toStr   = format(toDate,   "yyyy-MM-dd");
      const res = await fetch(
        `${api}/api/admin-attendance/download-my-attendance?from=${fromStr}&to=${toStr}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("No data found for the selected dates. Please select the correct date period.");
        }
        const errData = await res.json().catch(() => ({ message: "Download failed." }));
        throw new Error(errData.message);
      }
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const disposition = res.headers.get("content-disposition");
      let filename = `DTR_${fromStr}_${toStr}.pdf`;
      if (disposition) {
        const m = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (m?.[1]) filename = m[1].replace(/["']/g, "");
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("DTR downloaded successfully!", { theme: "dark" });
      setDtrModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Download failed.", { theme: "dark" });
    } finally {
      setDtrSubmitting(false);
    }
  };

  const reportCoverage = useMemo(() => {
    if (reportMode === "pick-dates") {
      if (!reportDateRange?.from || !reportDateRange?.to) return null;
      return { start: format(reportDateRange.from, "MMM dd, yyyy"), end: format(reportDateRange.to, "MMM dd, yyyy") };
    }
    if (!reportYear || !reportMonth) return null;
    const year = Number(reportYear); const month = Number(reportMonth);
    const monthDate = new Date(year, month - 1, 1);
    const lastDay = getDaysInMonth(monthDate);
    const startDay = reportCutoff === "second-half" ? 16 : 1;
    const endDay   = reportCutoff === "first-half"  ? 15 : lastDay;
    return {
      start: format(new Date(year, month - 1, startDay), "MMM dd, yyyy"),
      end:   format(new Date(year, month - 1, endDay),   "MMM dd, yyyy"),
    };
  }, [reportCutoff, reportDateRange, reportMode, reportMonth, reportYear]);

  const todayRecord = dashboard?.todayRecord;
  const hasTimedIn = Boolean(todayRecord?.timeIn);
  const hasTimedOut = Boolean(todayRecord?.timeOut);
  const liveTimeInLabel = getWorkedDurationLabel(todayRecord, liveNow);

  // Determine if the logged-in staff member is on approved leave today
  const todayKey = new Date().toISOString().slice(0, 10);
  const activeLeave = leaveRequests.find(
    (leave) =>
      leave.status === "Approved" &&
      Array.isArray(leave.dates) &&
      leave.dates.map(normalizeLeaveDateKey).includes(todayKey)
  ) || null;
  const isOnLeave = Boolean(activeLeave);

  const primaryAction = !isOnLeave && (!hasTimedIn || hasTimedOut)
    ? { label: "Time In", icon: <LogIn size={18} />, onClick: handleTimeIn }
    : !isOnLeave
      ? { label: "Time Out", icon: <LogOut size={18} />, onClick: handleTimeOut }
      : null;

  const recentAttendance = useMemo(() => dashboard?.recentRecords || [], [dashboard]);
  const sortedAttendanceHistory = useMemo(
    () =>
      [...recentAttendance].sort((a, b) => {
        const aDate = new Date(a.timeIn || a.createdAt || 0).getTime();
        const bDate = new Date(b.timeIn || b.createdAt || 0).getTime();
        return bDate - aDate;
      }),
    [recentAttendance]
  );
  const filteredAttendanceHistory = useMemo(() => {
    if (!historyDateFilter) return sortedAttendanceHistory;
    return sortedAttendanceHistory.filter((record) => record.dateKey === historyDateFilter);
  }, [historyDateFilter, sortedAttendanceHistory]);

  const leaveDateMap = useMemo(() => {
    const map = new Map();

    leaveRequests
      .filter((request) => request.status !== "Declined")
      .forEach((request) => {
        const leaveStatus = request.status === "Approved" ? "leave-approved" : "leave-pending";
        (request.dates || []).forEach((date) => {
          const normalizedDate = normalizeLeaveDateKey(date);
          if (normalizedDate) {
            map.set(normalizedDate, leaveStatus);
          }
        });
      });

    return map;
  }, [leaveRequests]);

  const attendanceMap = useMemo(
    () =>
      new Map(
        recentAttendance.map((record) => [
          getDateKey(record.timeIn || record.createdAt),
          record,
        ])
      ),
    [recentAttendance]
  );

  const fifteenDaySummary = useMemo(() => {
    const days = getLastNDays(SUMMARY_DAYS);

    return days.reduce(
      (acc, date) => {
        const status = getHeatmapStatus(date, attendanceMap, leaveDateMap);
        acc.total += 1;
        if (status === "present") acc.present += 1;
        else if (status === "leave-approved" || status === "leave-pending") acc.leave += 1;
        else acc.noRecord += 1;
        return acc;
      },
      { total: 0, present: 0, leave: 0, noRecord: 0 }
    );
  }, [attendanceMap, leaveDateMap]);

  const hoursLast15Days = useMemo(() => {
    const validKeys = new Set(getLastNDays(SUMMARY_DAYS).map((date) => getDateKey(date)));

    const totalMinutes = recentAttendance.reduce((sum, record) => {
      const recordKey = record.dateKey || getDateKey(record.firstTimeIn || record.timeIn || record.createdAt);
      if (!validKeys.has(recordKey)) {
        return sum;
      }

      return sum + Math.round(getWorkedMilliseconds(record) / 60000);
    }, 0);

    return Number((totalMinutes / 60).toFixed(2));
  }, [recentAttendance]);

  const attendanceHeatmap = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const key = getDateKey(date);
      const status = getHeatmapStatus(date, attendanceMap, leaveDateMap);

      return {
        key,
        dayNumber: index + 1,
        fullLabel: date.toLocaleDateString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        status,
      };
    });

    const summary = days.reduce(
      (acc, day) => {
        if (day.status === "present") acc.present += 1;
        else if (day.status === "leave-approved" || day.status === "leave-pending") acc.leave += 1;
        else acc.dayoff += 1;
        return acc;
      },
      { present: 0, leave: 0, dayoff: 0 }
    );

    const leadingEmptyDays = Array.from({ length: firstDayOfMonth }, (_, index) => ({
      key: `leading-empty-${index}`,
      empty: true,
    }));

    const totalFilledCells = leadingEmptyDays.length + days.length;
    const trailingEmptyCount = totalFilledCells % 7 === 0 ? 0 : 7 - (totalFilledCells % 7);
    const trailingEmptyDays = Array.from({ length: trailingEmptyCount }, (_, index) => ({
      key: `trailing-empty-${index}`,
      empty: true,
    }));

    return {
      summary,
      calendarCells: [...leadingEmptyDays, ...days, ...trailingEmptyDays],
    };
  }, [attendanceMap, leaveDateMap]);

  const openAttendanceDetail = (record) => {
    setSelectedAttendance(record);
    setAttendanceDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 md:p-8">
      <ToastContainer theme="dark" />

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CalendarClock className="text-cyan-400" size={30} />
            My Attendance
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Daily attendance and reporting dashboard for {user?.name}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isOnLeave ? (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-semibold text-yellow-300 select-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              On Leave
            </div>
          ) : (
            primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={submitting}
                className="px-5 py-3 rounded-xl bg-[#2B7FFF] hover:bg-[#2460b9] text-white font-semibold flex items-center gap-2 transition disabled:opacity-60"
              >
                {submitting ? <RefreshCcw className="animate-spin" size={18} /> : primaryAction.icon}
                {primaryAction.label}
              </button>
            )
          )}

          <button
            onClick={fetchDashboard}
            className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition flex items-center gap-2"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>

          <button
            onClick={() => {
              setReportMode("cutoff");
              setReportYear(new Date().getFullYear());
              setReportMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
              setReportCutoff("first-half");
              setReportDateRange({ from: null, to: null });
              setDtrModalOpen(true);
            }}
            className="px-4 py-3 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 transition flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/10"
          >
            <FileDown size={18} />
            Download DTR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Status Today"
          value={dashboard?.stats?.currentStatus || "Loading"}
          icon={<Clock3 className="text-cyan-400" size={20} />}
          accent="cyan"
        />
        <StatCard
          title={hasTimedOut ? "Worked Time Today" : "Live Time Since In"}
          value={liveTimeInLabel}
          icon={<CalendarClock className="text-amber-400" size={20} />}
          accent="amber"
        />
        <StatCard
          title="Hours Last 15 Days"
          value={hoursLast15Days}
          icon={<Clock3 className="text-emerald-400" size={20} />}
        />
        <StatCard
          title="Present Last 15 Days"
          value={fifteenDaySummary.present}
          icon={<CalendarClock className="text-blue-400" size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Today&apos;s Attendance</h2>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          {pageLoading ? (
            <div className="text-slate-400 text-sm flex items-center gap-2">
              <RefreshCcw className="animate-spin" size={16} />
              Loading attendance...
            </div>
          ) : (
            <>
              {isOnLeave && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-yellow-300">On Leave</p>
                    <p className="mt-0.5 text-xs text-yellow-200/70">
                      You have an approved {activeLeave?.leaveType || "leave"} today. Time-in is not available.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PanelItem label="Time In" value={formatDateTime(todayRecord?.firstTimeIn || todayRecord?.timeIn)} />
                <PanelItem label="Time Out" value={formatDateTime(todayRecord?.timeOut)} />
                <PanelItem label="Worked Hours" value={getWorkedHoursLabel(todayRecord, liveNow)} />
              </div>
            </>
          )}

          <div className="mt-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-start gap-3">
              <UserCircle2 className="text-slate-500 mt-0.5" size={20} />
              <div>
                <div className="text-white font-medium">{user?.name}</div>
                <div className="text-sm text-slate-400">
                  {user?.position || "Staff"} | {user?.role}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Attendance Snapshot</h2>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
              Last 15 days
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniMetric label="Present" value={fifteenDaySummary.present} tone="text-emerald-300" />
            <MiniMetric label="Leave" value={fifteenDaySummary.leave} tone="text-amber-300" />
            <MiniMetric label="No Record" value={fifteenDaySummary.noRecord} tone="text-slate-300" />
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-medium text-white">Legend</div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-400">
              <LegendItem label="Present" tone="bg-emerald-500/90 border-emerald-300/70" />
              <LegendItem label="Approved leave" tone="bg-amber-500/90 border-amber-300/70" />
              <LegendItem label="Pending leave" tone="bg-sky-500/90 border-sky-300/70" />
              <LegendItem label="No record / day off" tone="bg-slate-700/70 border-slate-500/60" />
            </div>
          </div>
        </section>

        <div className="xl:col-span-3 grid grid-cols-1 2xl:grid-cols-[1.35fr_0.95fr] gap-6 items-start">
          <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Attendance Calendar Heatmap</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Daily pattern for {new Date().toLocaleDateString([], { month: "long", year: "numeric" })}.
                </p>
              </div>
              <div className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 w-fit">
                Personal discipline overview
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:p-5">
              <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3">
                {WEEKDAY_HEADERS.map((label) => (
                  <div
                    key={label}
                    className="text-[10px] md:text-xs uppercase tracking-wide text-slate-500 text-center"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-3">
                {attendanceHeatmap.calendarCells.map((day) =>
                  day.empty ? (
                    <div
                      key={day.key}
                      className="h-11 md:h-12 rounded-xl border border-transparent bg-transparent"
                      aria-hidden="true"
                    />
                  ) : (
                    <div key={day.key} className="group" title={`${day.fullLabel} | ${getHeatmapLabel(day.status)}`}>
                      <div
                        className={`relative h-11 md:h-12 rounded-xl border ${getHeatmapTone(day.status)} flex flex-col items-center justify-center text-sm font-semibold ${day.status === "leave-approved" ? "text-slate-950" : day.status === "leave-pending" ? "text-slate-950" : "text-white"} shadow-sm transition-transform group-hover:scale-[1.04] overflow-hidden`}
                      >
                        {day.status === "leave-approved" ? (
                          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-slate-950/85 text-[9px] font-bold leading-4 text-amber-300 text-center">L</span>
                        ) : day.status === "leave-pending" ? (
                          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-slate-950/85 text-[9px] font-bold leading-4 text-sky-300 text-center">L</span>
                        ) : null}
                        {day.dayNumber}
                        {day.status === "leave-approved" || day.status === "leave-pending" ? (
                          <span className="text-[9px] leading-none font-bold uppercase tracking-wide">
                            Leave
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <LegendItem label="Present" tone="bg-emerald-500/90 border-emerald-300/70" />
              <LegendItem label="Approved leave" tone="bg-amber-500/90 border-amber-300/70" />
              <LegendItem label="Pending leave" tone="bg-sky-500/90 border-sky-300/70" />
              <LegendItem label="No record / day off" tone="bg-slate-700/70 border-slate-500/60" />
            </div>
          </section>

          <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Attendance History</h2>
                <p className="text-sm text-slate-400 mt-1">Current logged-in user attendance records.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                  title="Filter attendance history by date"
                />
                {historyDateFilter && (
                  <button
                    type="button"
                    onClick={() => setHistoryDateFilter("")}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    Clear
                  </button>
                )}
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                  {filteredAttendanceHistory.length} records
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredAttendanceHistory.length === 0 ? (
                <div className="text-sm text-slate-500 py-6">No attendance records yet.</div>
              ) : (
                filteredAttendanceHistory.map((record) => (
                  <button
                    key={record._id}
                    type="button"
                    onClick={() => openAttendanceDetail(record)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex items-center justify-between gap-4 text-left transition hover:border-cyan-500/30 hover:bg-slate-950/60"
                  >
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">{user?.name || "Current User"}</div>
                      <div className="text-sm text-slate-400">
                        {formatWordDate(record.dateKey)}
                        <span className="mx-2 text-slate-600">•</span>
                        {formatTime(record.firstTimeIn || record.timeIn)} to {formatTime(record.timeOut)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 truncate">
                        {record.notes?.trim() ? `Log report: ${record.notes}` : "No log report attached"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-cyan-300">{record.status}</div>
                      <div className="text-xs text-slate-500">{getWorkedHoursLabel(record, liveNow)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ─── Download DTR Modal ─────────────────────────────────────────── */}
      <style>{datePickerStyles}</style>
      <Transition appear show={dtrModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDtrModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] border border-slate-700 shadow-2xl shadow-blue-900/20 transition-all flex flex-col max-h-[90vh]">

                  {/* Header */}
                  <div className="p-6 pb-2 text-center shrink-0">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                      <FileDown className="text-blue-400" size={28} />
                    </div>
                    <Dialog.Title as="h3" className="text-xl font-bold text-white">Download My DTR</Dialog.Title>
                    <p className="text-sm text-slate-400 mt-2 px-4">
                      Select the date period for your Daily Time Record PDF.
                    </p>
                  </div>

                  {/* Period Picker */}
                  <div className="px-4 sm:px-6 py-3 overflow-y-auto">
                    <div className="space-y-4 rounded-xl border border-slate-700 bg-[#0f172a] p-4">

                      {/* Mode toggle */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Download Mode</label>
                        <div className="flex gap-2">
                          {["cutoff", "pick-dates"].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setReportMode(m)}
                              className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                reportMode === m
                                  ? "border-blue-500/50 bg-blue-500/10 text-white"
                                  : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                              }`}
                            >
                              {m === "cutoff" ? "Cut-off" : "Pick dates"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {reportMode === "cutoff" ? (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Year</label>
                              <select
                                value={reportYear}
                                onChange={e => setReportYear(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              >
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Month</label>
                              <select
                                value={reportMonth}
                                onChange={e => setReportMonth(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              >
                                {Array.from({ length: 12 }, (_, i) => {
                                  const mv = String(i + 1).padStart(2, "0");
                                  const ml = format(new Date(2026, i, 1), "MMMM");
                                  return <option key={mv} value={mv}>{ml}</option>;
                                })}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cut-off Period</label>
                            <div className="grid gap-3">
                              {[
                                { value: "first-half",  title: "1st to 15th day",        sub: "First cut-off of the month" },
                                { value: "second-half", title: "16th to last day",         sub: "Last cut-off of the month" },
                                { value: "whole-month", title: "Whole month",              sub: "Both cut-offs combined" },
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setReportCutoff(opt.value)}
                                  className={`rounded-xl border px-4 py-3 text-left transition ${
                                    reportCutoff === opt.value
                                      ? "border-blue-500/50 bg-blue-500/10 text-white"
                                      : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                                  }`}
                                >
                                  <div className="text-sm font-semibold">{opt.title}</div>
                                  <div className="mt-1 text-xs text-slate-400">{opt.sub}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pick Date Range</label>
                          <div className="rounded-xl border border-slate-700 bg-[#111827] p-3">
                            <DayPicker
                              mode="range"
                              selected={reportDateRange}
                              onSelect={handleReportRangeSelect}
                              className="text-sm"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Date range must stay within one month only.</p>
                        </div>
                      )}

                      {reportCoverage && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Selected Coverage</span>
                          <span className="mt-1 block font-medium">{reportCoverage.start} — {reportCoverage.end}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 pt-4 flex gap-3 bg-[#1e293b] shrink-0 border-t border-slate-700/50 mt-2">
                    <button
                      onClick={() => setDtrModalOpen(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-sm font-medium transition active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDownload}
                      disabled={dtrSubmitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {dtrSubmitting
                        ? <><RefreshCcw className="animate-spin size-4" /> Generating...</>
                        : "Confirm Download"
                      }
                    </button>
                  </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={attendanceDetailOpen && Boolean(selectedAttendance)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setAttendanceDetailOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-[#1e293b] border border-slate-700 shadow-2xl transition-all text-left">
                  {(() => {
                    const associatedReport = selectedAttendance
                      ? userReports.find(
                          (rep) =>
                            rep.attendanceId?._id === selectedAttendance._id ||
                            rep.attendanceId?.dateKey === selectedAttendance.dateKey ||
                            (rep.reportDate && new Date(rep.reportDate).toISOString().slice(0, 10) === selectedAttendance.dateKey)
                        )
                      : null;

                    return (
                      <>
                        {/* Premium Header */}
                        <div className="p-6 border-b border-slate-700/60 bg-gradient-to-r from-slate-900/60 via-slate-900/30 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 shadow-inner">
                              <CalendarDays className="text-cyan-400" size={24} />
                            </div>
                            <div>
                              <Dialog.Title className="text-lg font-bold text-white leading-tight">
                                {formatWordDate(selectedAttendance?.dateKey)}
                              </Dialog.Title>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Attendance and Log Details
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              selectedAttendance?.status === "Timed Out"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            }`}>
                              {selectedAttendance?.status || "Active"}
                            </span>
                          </div>
                        </div>

                        {/* Modal Content Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                          {/* Staff Info / Metadata Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                                {user?.name?.slice(0, 2).toUpperCase() || "ST"}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Employee</div>
                                <div className="text-sm font-semibold text-white truncate">{user?.name || "Current Staff"}</div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-300">
                                <Clock3 className="text-slate-400" size={20} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Working Hours</div>
                                <div className="text-sm font-semibold text-white truncate">
                                  {getWorkedHoursLabel(selectedAttendance, liveNow)}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex items-center gap-3 md:col-span-2 lg:col-span-1">
                              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-300">
                                <CalendarDays className="text-slate-400" size={20} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Date Key</div>
                                <div className="text-sm font-semibold text-white truncate">{selectedAttendance?.dateKey || "--"}</div>
                              </div>
                            </div>
                          </div>

                          {/* Time In / Out details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-800/80 bg-slate-950/20 p-4 relative overflow-hidden group hover:border-slate-700/80 transition duration-300">
                              <div className="absolute top-0 left-0 h-1 w-full bg-cyan-500/50" />
                              <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">Time In Session</div>
                              <div className="text-lg font-bold text-white flex items-center gap-2">
                                <LogIn className="text-cyan-400 shrink-0" size={18} />
                                {formatTime(selectedAttendance?.firstTimeIn || selectedAttendance?.timeIn)}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                First logged time: {formatDateTime(selectedAttendance?.firstTimeIn || selectedAttendance?.timeIn)}
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-800/80 bg-slate-950/20 p-4 relative overflow-hidden group hover:border-slate-700/80 transition duration-300">
                              <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500/50" />
                              <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">Time Out Session</div>
                              <div className="text-lg font-bold text-white flex items-center gap-2">
                                <LogOut className="text-emerald-400 shrink-0" size={18} />
                                {selectedAttendance?.timeOut ? formatTime(selectedAttendance.timeOut) : "Active Shift"}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {selectedAttendance?.timeOut ? `Logged out at: ${formatDateTime(selectedAttendance.timeOut)}` : "Still timed-in/active"}
                              </div>
                            </div>
                          </div>

                          {/* Report / Log details */}
                          <div className="border-t border-slate-800 pt-6">
                            <div className="bg-[#0f172a]/50 rounded-2xl border border-slate-850 p-5 space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                  <FileText className="text-[#2B7FFF]" size={15} />
                                  {associatedReport ? "Linked Log Report" : "Attendance Notes"}
                                </div>
                                {associatedReport && (
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-[#2B7FFF]/10 text-[#2B7FFF] border border-[#2B7FFF]/20 uppercase">
                                    {associatedReport.category}
                                  </span>
                                )}
                              </div>

                              {associatedReport && (
                                <h4 className="text-base font-bold text-white mt-1">
                                  {associatedReport.title}
                                </h4>
                              )}

                              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[50px] bg-slate-950/35 rounded-xl p-4 border border-slate-850">
                                {associatedReport?.details?.trim() || selectedAttendance?.notes?.trim() || "No detailed log or notes attached."}
                              </p>

                              {/* Uploaded Image Rendering */}
                              {associatedReport?.imageUrl && (
                                <div className="mt-6 pt-4 border-t border-slate-800/80">
                                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                    <FileImage className="text-emerald-400" size={15} />
                                    Report Attachment Image
                                  </div>
                                  <div className="relative group rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 p-2 max-w-md shadow-xl transition-all duration-300 hover:border-cyan-500/50">
                                    <img
                                      src={associatedReport.imageUrl}
                                      alt={associatedReport.title || "Uploaded report attachment"}
                                      className="w-full h-auto max-h-72 object-contain rounded-xl"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                      <a
                                        href={associatedReport.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg transition active:scale-95"
                                      >
                                        <FileDown size={14} /> Open Full Size
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Action Footer */}
                        <div className="p-6 flex justify-end border-t border-slate-700 bg-slate-900/30">
                          <button
                            onClick={() => setAttendanceDetailOpen(false)}
                            className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition active:scale-98"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

function StatCard({ title, value, icon, accent = "default" }) {
  const accentClass =
    accent === "cyan"
      ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-slate-900"
      : accent === "amber"
        ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900"
        : "border-slate-800 bg-[#1e293b]";

  return (
    <div className={`rounded-2xl border p-5 shadow-lg ${accentClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

function PanelItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function LegendItem({ label, tone }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex h-3.5 w-3.5 rounded-[4px] border ${tone}`} />
      <span>{label}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-white break-words">{value || "--"}</div>
    </div>
  );
}
