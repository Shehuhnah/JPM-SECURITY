import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { format, parseISO } from "date-fns";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  PieChart,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

const api = import.meta.env.VITE_API_URL;

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#cbd5e1", boxWidth: 12, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      borderWidth: 1,
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
    },
  },
  scales: {
    x: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148, 163, 184, 0.12)" },
    },
    y: {
      beginAtZero: true,
      ticks: { color: "#94a3b8", precision: 0 },
      grid: { color: "rgba(148, 163, 184, 0.12)" },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "64%",
  plugins: chartOptions.plugins,
};

const toDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
};

const toDisplayDate = (value) => {
  const key = toDateKey(value);
  if (!key) return "No date";
  return format(parseISO(key), "MMMM d, yyyy");
};

const isDateInRange = (dateKey, from, to) => {
  if (!dateKey) return false;
  if (from && dateKey < from) return false;
  if (to && dateKey > to) return false;
  return true;
};

const getAttendanceDate = (record) => toDateKey(record?.timeIn || record?.scheduleId?.timeIn || record?.createdAt);
const getScheduleDate = (schedule) => toDateKey(schedule?.timeIn || schedule?.createdAt);
const getLogDate = (log) => toDateKey(log?.createdAt);

const getWorkedMinutes = (record) => {
  if (!record?.timeIn || !record?.timeOut) return 0;
  const start = new Date(record.timeIn);
  const end = new Date(record.timeOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round(diff / 60000));
};

const groupCount = (items, getKey) =>
  items.reduce((acc, item) => {
    const key = getKey(item) || "Unspecified";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const sortedEntries = (object) =>
  Object.entries(object).sort(([a], [b]) => a.localeCompare(b));

const emptyChart = {
  labels: ["No data"],
  datasets: [{ data: [1], backgroundColor: ["#334155"], borderWidth: 0 }],
};

export default function GuardDashboard() {
  const { user: guard, loading } = useAuth();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const fetchDashboardData = useCallback(async () => {
    if (!guard?._id) return;

    try {
      setRefreshing(true);
      const [attendanceRes, schedulesRes, leavesRes, logsRes] = await Promise.all([
        fetch(`${api}/api/attendance/${guard._id}`, { credentials: "include" }),
        fetch(`${api}/api/schedules/guard/${guard._id}`, { credentials: "include" }),
        fetch(`${api}/api/leaves/my`, { credentials: "include" }),
        fetch(`${api}/api/logbook/guard/${guard._id}`, { credentials: "include" }),
      ]);

      const [attendanceData, schedulesData, leavesData, logsData] = await Promise.all([
        attendanceRes.json().catch(() => []),
        schedulesRes.json().catch(() => []),
        leavesRes.json().catch(() => []),
        logsRes.json().catch(() => []),
      ]);

      if (!attendanceRes.ok) throw new Error(attendanceData.message || "Failed to load attendance data.");
      if (!schedulesRes.ok) throw new Error(schedulesData.message || "Failed to load schedule data.");
      if (!leavesRes.ok) throw new Error(leavesData.message || "Failed to load leave data.");
      if (!logsRes.ok) throw new Error(logsData.message || "Failed to load logbook data.");

      setAttendance(Array.isArray(attendanceData) ? attendanceData : attendanceData.items || []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      toast.error(error.message || "Failed to load dashboard data.", { theme: "dark" });
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, [guard?._id]);

  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
      return;
    }

    if (guard?._id) {
      document.title = "Guard Dashboard | JPM Security Agency";
      fetchDashboardData();
    }
  }, [fetchDashboardData, guard, loading, navigate]);

  const filtered = useMemo(() => {
    const from = dateRange.from;
    const to = dateRange.to || dateRange.from;

    const filteredAttendance = attendance.filter((record) => isDateInRange(getAttendanceDate(record), from, to));
    const filteredSchedules = schedules.filter((schedule) => isDateInRange(getScheduleDate(schedule), from, to));
    const filteredLeaves = leaves
      .map((leave) => ({
        ...leave,
        filteredDates: (leave.dates || []).filter((date) => isDateInRange(toDateKey(date), from, to)),
      }))
      .filter((leave) => leave.filteredDates.length > 0 || isDateInRange(toDateKey(leave.startDate), from, to));
    const filteredLogs = logs.filter((log) => isDateInRange(getLogDate(log), from, to));

    return {
      attendance: filteredAttendance,
      schedules: filteredSchedules,
      leaves: filteredLeaves,
      logs: filteredLogs,
    };
  }, [attendance, dateRange.from, dateRange.to, leaves, logs, schedules]);

  const metrics = useMemo(() => {
    const completedAttendance = filtered.attendance.filter((record) => record.timeIn && record.timeOut);
    const totalMinutes = completedAttendance.reduce((sum, record) => sum + getWorkedMinutes(record), 0);
    const scheduledApproved = filtered.schedules.filter((schedule) => schedule.isApproved === "Approved");
    const leaveDays = filtered.leaves.reduce((sum, leave) => sum + (leave.filteredDates?.length || leave.dates?.length || 0), 0);
    const uniqueSites = new Set([
      ...filtered.attendance.map((record) => record.scheduleId?.client).filter(Boolean),
      ...filtered.schedules.map((schedule) => schedule.client).filter(Boolean),
    ]);

    return {
      attendanceRecords: filtered.attendance.length,
      completedAttendance: completedAttendance.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      schedules: filtered.schedules.length,
      approvedSchedules: scheduledApproved.length,
      leaveDays,
      logEntries: filtered.logs.length,
      uniqueSites: uniqueSites.size,
      completionRate: filtered.schedules.length
        ? Math.round((completedAttendance.length / filtered.schedules.length) * 100)
        : 0,
    };
  }, [filtered]);

  const statusChart = useMemo(() => {
    const counts = groupCount(filtered.attendance, (record) => record.status || "Off Duty");
    const entries = sortedEntries(counts);
    if (!entries.length) return emptyChart;
    return {
      labels: entries.map(([label]) => label),
      datasets: [
        {
          data: entries.map(([, value]) => value),
          backgroundColor: ["#ef4444", "#1e293b", "#3b82f6", "#ef4444", "#a855f7"],
          borderColor: "#111827",
          borderWidth: 2,
        },
      ],
    };
  }, [filtered.attendance]);

  const hoursByMonthChart = useMemo(() => {
    const monthly = {};
    filtered.attendance.forEach((record) => {
      const key = getAttendanceDate(record);
      if (!key) return;
      const month = key.slice(0, 7);
      monthly[month] = (monthly[month] || 0) + getWorkedMinutes(record) / 60;
    });

    const entries = sortedEntries(monthly);
    return {
      labels: entries.map(([month]) => format(parseISO(`${month}-01`), "MMM yyyy")),
      datasets: [
        {
          label: "Worked hours",
          data: entries.map(([, value]) => Math.round(value * 10) / 10),
          backgroundColor: "rgba(59, 130, 246, 0.72)",
          borderColor: "#60a5fa",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [filtered.attendance]);

  const activityTrendChart = useMemo(() => {
    const daily = {};
    filtered.attendance.forEach((record) => {
      const key = getAttendanceDate(record);
      if (!key) return;
      daily[key] = daily[key] || { attendance: 0, logs: 0, leave: 0 };
      daily[key].attendance += 1;
    });
    filtered.logs.forEach((log) => {
      const key = getLogDate(log);
      if (!key) return;
      daily[key] = daily[key] || { attendance: 0, logs: 0, leave: 0 };
      daily[key].logs += 1;
    });
    filtered.leaves.forEach((leave) => {
      (leave.filteredDates || leave.dates || []).forEach((date) => {
        const key = toDateKey(date);
        if (!key) return;
        daily[key] = daily[key] || { attendance: 0, logs: 0, leave: 0 };
        daily[key].leave += 1;
      });
    });

    const keys = Object.keys(daily).sort();
    return {
      labels: keys.map((key) => format(parseISO(key), "MMM d")),
      datasets: [
        {
          label: "Attendance",
          data: keys.map((key) => daily[key].attendance),
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.18)",
          tension: 0.35,
          fill: true,
        },
        {
          label: "Logbook",
          data: keys.map((key) => daily[key].logs),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          tension: 0.35,
          fill: true,
        },
        {
          label: "Leave days",
          data: keys.map((key) => daily[key].leave),
          borderColor: "#a855f7",
          backgroundColor: "rgba(168, 85, 247, 0.10)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [filtered.attendance, filtered.leaves, filtered.logs]);

  const siteChart = useMemo(() => {
    const siteCounts = groupCount(filtered.schedules, (schedule) => schedule.client || "Unassigned");
    const entries = Object.entries(siteCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: entries.map(([label]) => label),
      datasets: [
        {
          label: "Scheduled shifts",
          data: entries.map(([, value]) => value),
          backgroundColor: "rgba(16, 185, 129, 0.72)",
          borderColor: "#34d399",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [filtered.schedules]);

  const recentActivity = useMemo(() => {
    const attendanceItems = filtered.attendance.map((record) => ({
      id: `attendance-${record._id}`,
      title: record.status || "Attendance",
      detail: record.scheduleId?.client || record.location?.address || "Attendance record",
      date: getAttendanceDate(record),
      tone: "blue",
    }));
    const logItems = filtered.logs.map((log) => ({
      id: `log-${log._id}`,
      title: log.type || "Logbook",
      detail: log.remarks || log.post || "Logbook entry",
      date: getLogDate(log),
      tone: "amber",
    }));
    const leaveItems = filtered.leaves.flatMap((leave) =>
      (leave.filteredDates || leave.dates || []).map((date) => ({
        id: `leave-${leave._id}-${date}`,
        title: leave.leaveType || "Leave",
        detail: leave.status || "Leave request",
        date,
        tone: "purple",
      }))
    );

    return [...attendanceItems, ...logItems, ...leaveItems]
      .filter((item) => item.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [filtered.attendance, filtered.leaves, filtered.logs]);

  const clearDateRange = () => setDateRange({ from: "", to: "" });

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCcw className="size-10 animate-spin text-blue-400" />
          <p>Loading guard dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 text-slate-100">
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
              <Activity size={14} /> Guard Dashboard
            </div>
            <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
              {getPersonName(guard, "Guard")} Performance Overview
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Attendance, schedules, leave activity, sites, and logbook records from your available datasets.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">From</span>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(event) => setDateRange((prev) => ({ ...prev, from: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">To</span>
                <input
                  type="date"
                  value={dateRange.to}
                  min={dateRange.from || undefined}
                  onChange={(event) => setDateRange((prev) => ({ ...prev, to: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <button
                type="button"
                onClick={clearDateRange}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                All Data
              </button>
              <button
                type="button"
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Attendance Records" value={metrics.attendanceRecords} subtitle={`${metrics.completedAttendance} completed`} icon={<ShieldCheck size={22} />} color="blue" />
          <StatCard title="Worked Hours" value={`${metrics.totalHours}h`} subtitle={`${metrics.completionRate}% schedule coverage`} icon={<Clock size={22} />} color="emerald" />
          <StatCard title="Scheduled Shifts" value={metrics.schedules} subtitle={`${metrics.approvedSchedules} approved`} icon={<CalendarDays size={22} />} color="amber" />
          <StatCard title="Operational Logs" value={metrics.logEntries} subtitle={`${metrics.leaveDays} leave day${metrics.leaveDays === 1 ? "" : "s"}`} icon={<ClipboardList size={22} />} color="purple" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <ChartCard title="Daily Activity Trend" subtitle="Attendance, logbook entries, and leave days over the selected period." icon={<TrendingUp size={20} />}>
            {activityTrendChart.labels.length ? <Line data={activityTrendChart} options={chartOptions} /> : <EmptyChartState />}
          </ChartCard>

          <ChartCard title="Attendance Status Mix" subtitle="Distribution of loaded attendance statuses." icon={<PieChart size={20} />}>
            <Doughnut data={statusChart} options={doughnutOptions} />
          </ChartCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-1">
          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-400" size={20} />
              <div>
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                <p className="text-sm text-slate-400">Latest attendance, leave, and logbook events in the selected range.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentActivity.length ? (
                recentActivity.map((item) => <ActivityItem key={item.id} item={item} />)
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 py-12 text-center text-sm text-slate-500">
                  No activity found for the selected range.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  const palette = {
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <div className="mt-2 text-3xl font-bold text-white">{value}</div>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl border p-3 ${palette[color] || palette.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-xl">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-300">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="h-[320px]">{children}</div>
    </section>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
      No chart data for the selected range.
    </div>
  );
}

function CoverageRow({ label, value, filtered }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0f172a] px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-sm font-semibold text-white">
        {filtered} <span className="text-slate-500">/ {value}</span>
      </span>
    </div>
  );
}

function ActivityItem({ item }) {
  const palette = {
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
      <div className={`mt-1 size-3 rounded-full border ${palette[item.tone] || palette.blue}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-white">{item.title}</h3>
          <span className="text-xs text-slate-500">{toDisplayDate(item.date)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.detail}</p>
      </div>
    </div>
  );
}
