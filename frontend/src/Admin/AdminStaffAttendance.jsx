import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  CalendarClock,
  Clock3,
  FileText,
  LogIn,
  LogOut,
  RefreshCcw,
  UserCircle2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";

const api = import.meta.env.VITE_API_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

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

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const getHeatmapTone = (status) => {
  if (status === "present") {
    return "bg-emerald-500/90 border-emerald-300/70";
  }

  return "bg-slate-700/70 border-slate-500/60";
};

const getHeatmapStatus = (date, attendanceMap) => {
  const key = date.toISOString().split("T")[0];
  const record = attendanceMap.get(key);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (record?.timeIn) return "present";
  if (date > endOfToday || isWeekend(date)) return "dayoff";
  return "dayoff";
};

export default function AdminStaffAttendance() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      const res = await fetch(`${api}/api/admin-attendance/me`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attendance.");
      setDashboard(data);
    } catch (error) {
      toast.error(error.message || "Failed to load attendance.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

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
  const primaryAction = !hasTimedIn
    ? { label: "Time In", icon: <LogIn size={18} />, onClick: handleTimeIn }
    : !hasTimedOut
      ? { label: "Time Out", icon: <LogOut size={18} />, onClick: handleTimeOut }
      : null;

  const recentAttendance = useMemo(() => dashboard?.recentRecords || [], [dashboard]);

  const attendanceRateTrendData = useMemo(() => {
    const sortedRecords = [...recentAttendance]
      .filter((record) => record?.timeIn)
      .sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));

    let runningPresent = 0;
    const points = sortedRecords.map((record, index) => {
      if (record.timeIn) runningPresent += 1;
      return Number(((runningPresent / (index + 1)) * 100).toFixed(1));
    });

    return {
      labels: sortedRecords.map((record) =>
        new Date(record.timeIn).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "Attendance Rate",
          data: points,
          borderColor: "#2B7FFF",
          backgroundColor: "rgba(43, 127, 255, 0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [recentAttendance]);

  const attendanceHeatmap = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const attendanceMap = new Map(
      recentAttendance.map((record) => [
        new Date(record.timeIn || record.createdAt).toISOString().split("T")[0],
        record,
      ])
    );

    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const key = date.toISOString().split("T")[0];
      const status = getHeatmapStatus(date, attendanceMap);

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
        acc[day.status] += 1;
        return acc;
      },
      { present: 0, dayoff: 0 }
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
  }, [recentAttendance]);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <StatCard title="Status Today" value={dashboard?.stats?.currentStatus || "Loading"} icon={<Clock3 className="text-cyan-400" size={20} />} />
        <StatCard title="Days This Month" value={dashboard?.stats?.presentDaysThisMonth ?? 0} icon={<CalendarClock className="text-blue-400" size={20} />} />
        <StatCard title="Hours This Month" value={dashboard?.stats?.totalHoursThisMonth ?? 0} icon={<Clock3 className="text-emerald-400" size={20} />} />
        <StatCard title="Reports Created" value={dashboard?.stats?.reportsCreated ?? 0} icon={<FileText className="text-amber-400" size={20} />} />
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
              <PanelItem label="Time In" value={formatDateTime(todayRecord?.timeIn)} />
              <PanelItem label="Time Out" value={formatDateTime(todayRecord?.timeOut)} />
              <PanelItem label="Worked Hours" value={getDurationLabel(todayRecord?.timeIn, todayRecord?.timeOut)} />
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
              This month
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniMetric label="Present" value={attendanceHeatmap.summary.present} tone="text-emerald-300" />
            <MiniMetric label="No Record" value={attendanceHeatmap.summary.dayoff} tone="text-slate-300" />
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-medium text-white">Legend</div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-400">
              <LegendItem label="Present" tone="bg-emerald-500/90 border-emerald-300/70" />
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
                    <div key={day.key} className="group" title={`${day.fullLabel} • ${day.status}`}>
                      <div
                        className={`h-11 md:h-12 rounded-xl border ${getHeatmapTone(day.status)} flex items-center justify-center text-sm font-semibold text-white shadow-sm transition-transform group-hover:scale-[1.04]`}
                      >
                        {day.dayNumber}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <LegendItem label="Present" tone="bg-emerald-500/90 border-emerald-300/70" />
              <LegendItem label="No record / day off" tone="bg-slate-700/70 border-slate-500/60" />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6">
            <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Attendance Rate Over Time</h2>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                  Recent records
                </span>
              </div>

              <div className="h-72">
                {attendanceRateTrendData.labels.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500 border border-dashed border-slate-700 rounded-xl">
                    No attendance trend data yet.
                  </div>
                ) : (
                  <Line
                    data={attendanceRateTrendData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "#0f172a",
                          titleColor: "#f3f4f6",
                          bodyColor: "#d1d5db",
                          borderColor: "#334155",
                          borderWidth: 1,
                          callbacks: {
                            label: (context) => `${context.raw}% attendance rate`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { color: "#94a3b8" },
                          grid: { display: false },
                        },
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            color: "#94a3b8",
                            callback: (value) => `${value}%`,
                          },
                          grid: { color: "rgba(148, 163, 184, 0.12)" },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </section>

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
                          {formatTime(record.timeIn)} to {formatTime(record.timeOut)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-cyan-300">{record.status}</div>
                        <div className="text-xs text-slate-500">{getDurationLabel(record.timeIn, record.timeOut)}</div>
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

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg">
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
