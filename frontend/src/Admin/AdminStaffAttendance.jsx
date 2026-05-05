import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Clock3,
  LogIn,
  LogOut,
  RefreshCcw,
  UserCircle2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";

const api = import.meta.env.VITE_API_URL;
const SUMMARY_DAYS = 15;

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

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
    totalMs += Math.max(0, currentTime - new Date(record.timeIn));
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
      const [attendanceRes, leaveRes] = await Promise.all([
        fetch(`${api}/api/admin-attendance/me`, {
          credentials: "include",
        }),
        fetch(`${api}/api/leaves/my`, {
          credentials: "include",
        }),
      ]);

      const [attendanceData, leaveData] = await Promise.all([
        attendanceRes.json(),
        leaveRes.json(),
      ]);

      if (!attendanceRes.ok) throw new Error(attendanceData.message || "Failed to load attendance.");
      if (!leaveRes.ok) throw new Error(leaveData.message || "Failed to load leave requests.");

      setDashboard(attendanceData);
      setLeaveRequests(Array.isArray(leaveData) ? leaveData : []);
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

  const todayRecord = dashboard?.todayRecord;
  const hasTimedIn = Boolean(todayRecord?.timeIn);
  const hasTimedOut = Boolean(todayRecord?.timeOut);
  const liveTimeInLabel = getWorkedDurationLabel(todayRecord, liveNow);
  const primaryAction = !hasTimedIn || hasTimedOut
    ? { label: "Time In", icon: <LogIn size={18} />, onClick: handleTimeIn }
    : { label: "Time Out", icon: <LogOut size={18} />, onClick: handleTimeOut };

  const recentAttendance = useMemo(() => dashboard?.recentRecords || [], [dashboard]);

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
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              disabled={submitting}
              className="px-5 py-3 rounded-xl bg-[#2B7FFF] hover:bg-[#2460b9] text-white font-semibold flex items-center gap-2 transition disabled:opacity-60"
            >
              {submitting ? <RefreshCcw className="animate-spin" size={18} /> : primaryAction.icon}
              {primaryAction.label}
            </button>
          )}

          <button
            onClick={fetchDashboard}
            className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition flex items-center gap-2"
          >
            <RefreshCcw size={18} />
            Refresh
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PanelItem label="Time In" value={formatDateTime(todayRecord?.firstTimeIn || todayRecord?.timeIn)} />
              <PanelItem label="Time Out" value={formatDateTime(todayRecord?.timeOut)} />
              <PanelItem label="Worked Hours" value={getWorkedHoursLabel(todayRecord, liveNow)} />
            </div>
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

          <div className="grid grid-cols-1 gap-6">
            <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Recent Attendance</h2>
                <Link to="/admin/log-reports" className="text-sm text-cyan-400 hover:text-cyan-300">
                  Reports
                </Link>
              </div>

              <div className="space-y-3">
                {recentAttendance.length === 0 ? (
                  <div className="text-sm text-slate-500 py-6">No attendance records yet.</div>
                ) : (
                  recentAttendance.map((record) => (
                    <div
                      key={record._id}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-white font-medium">{record.dateKey}</div>
                        <div className="text-sm text-slate-400">
                          {formatTime(record.firstTimeIn || record.timeIn)} to {formatTime(record.timeOut)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-cyan-300">{record.status}</div>
                        <div className="text-xs text-slate-500">{getWorkedHoursLabel(record, liveNow)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
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
