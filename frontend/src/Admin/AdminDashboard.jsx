import { useState, useEffect, useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import {
  Shield,
  UserCheck,
  Users,
  FileText,
  Clock,
  Bell,
  AlertTriangle,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import CountUp from "../components/CountUp";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [endMonth, setEndMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [stats, setStats] = useState({
    totalGuards: 0,
    applicants: 0,
    announcements: 0,
    logs: 0,
  });

  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  // 🔥 IMPORTANT: Store applicants in state
  const [applicants, setApplicants] = useState([]);

  const [chartData, setChartData] = useState({
    guardStatus: [0, 0, 0],
    attendance7d: { labels: [], data: [] },
    applicantsByStatus: { labels: [], data: [] },
  });
  // Month range for Attendance Trend (reuse startMonth/endMonth UI below)
  const [attStartMonth, setAttStartMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [attEndMonth, setAttEndMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) navigate("/admin/login");
    document.title = "Dashboard | JPM Security Agency"
  }, [user, loading, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const opt = { credentials: "include" };

        const [guardsRes, postsRes, logsRes, attendanceRes, applicantsRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/guards", opt),
            fetch("http://localhost:5000/api/posts", opt),
            fetch("http://localhost:5000/api/logbook", opt),
            fetch("http://localhost:5000/api/attendance", opt),
            fetch("http://localhost:5000/api/applicants", opt),
          ]);

        const guards = guardsRes.ok ? await guardsRes.json() : [];
        const announcements = postsRes.ok ? await postsRes.json() : [];
        const logs = logsRes.ok ? await logsRes.json() : [];
        const attendance = attendanceRes.ok ? await attendanceRes.json() : [];
        // store raw attendance for dynamic trend
        setRawAttendance(attendance);
        const applicantsData = applicantsRes.ok
          ? await applicantsRes.json()
          : [];

        // Store applicants
        setApplicants(applicantsData);

        // ——— KPIs ———
        setStats({
          totalGuards: guards.length,
          applicants: applicantsData.length,
          announcements: announcements.length,
          logs: logs.length,
        });

        // ——— Guard Status ———
        const statusCounts = { "On Duty": 0, "Off Duty": 0, Absent: 0 };
        attendance.forEach((a) => {
          const key = a.status || "Off Duty";
          statusCounts[key] = (statusCounts[key] || 0) + 1;
        });

        const guardStatus = [
          statusCounts["On Duty"] || 0,
          statusCounts["Off Duty"] || 0,
          statusCounts["Absent"] || 0,
        ];

        // ——— Attendance 7 Days ———
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        const labels = days.map((d) =>
          d.toLocaleDateString(undefined, { weekday: "short" })
        );

        const dayKeys = days.map((d) => d.toLocaleDateString());
        const counts7d = dayKeys.map(() => 0);

        attendance.forEach((a) => {
          const created = a.createdAt
            ? new Date(a.createdAt).toLocaleDateString()
            : null;
          const idx = dayKeys.indexOf(created);
          if (idx >= 0) counts7d[idx]++;
        });

        // ——— Applicant Status Breakdown ———
        const aggStatus = {};
        applicantsData.forEach((a) => {
          const status = a.status || "Unknown";
          aggStatus[status] = (aggStatus[status] || 0) + 1;
        });

        const applicantsLabels = Object.keys(aggStatus);
        const applicantsBarData = Object.values(aggStatus);

        // ——— Recent Logs ———
        const logsSorted = logs
          .slice()
          .sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          )
          .slice(0, 12);

        const activities = logsSorted.map((l, idx) => ({
          id: l._id || idx,
          type: l.type || "Log",
          remarks: l.remarks || "",
          time: l.createdAt
            ? new Date(l.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
          guard: l.guard || {},
        }));

        // Store chart data
        setChartData({
          guardStatus,
          attendance7d: { labels, data: counts7d },
          applicantsByStatus: {
            labels: applicantsLabels,
            data: applicantsBarData,
          },
        });

        setRecentActivities(activities);
      } catch (err) {
        console.error("Dashboard Error:", err);
        setError("Failed to load dashboard data.");
      }
    };

    fetchDashboardData();
  }, [user]);

  // hold raw attendance to compute dynamic trend
  const [rawAttendance, setRawAttendance] = useState([]);

  // compute dynamic attendance trend by month (Time In records per month)
  const dynamicAttendanceTrend = useMemo(() => {
    if (!rawAttendance.length || !attStartMonth || !attEndMonth)
      return { labels: [], datasets: [] };

    const start = new Date(attStartMonth + "-01");
    const end = new Date(attEndMonth + "-01");
    end.setMonth(end.getMonth() + 1);

    const labels = [];
    const data = [];
    const cursor = new Date(start);

    while (cursor < end) {
      const month = cursor.getMonth();
      const year = cursor.getFullYear();
      labels.push(cursor.toLocaleString("default", { month: "short", year: "numeric" }));

      const count = rawAttendance.filter((rec) => {
        const d = rec.createdAt ? new Date(rec.createdAt) : null;
        if (!d) return false;
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;

      data.push(count);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return {
      labels,
      datasets: [
        {
          label: "Attendance Records",
          data,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.2)",
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [rawAttendance, attStartMonth, attEndMonth]);


  const hiringTrendData = useMemo(() => {
    if (!applicants.length || !startMonth || !endMonth)
      return { labels: [], datasets: [] };

    const start = new Date(startMonth + "-01");
    const end = new Date(endMonth + "-01");
    end.setMonth(end.getMonth() + 1);

    const labels = [];
    const data = [];

    const cursor = new Date(start);

    while (cursor < end) {
      const month = cursor.getMonth();
      const year = cursor.getFullYear();

      labels.push(
        cursor.toLocaleString("default", { month: "short", year: "numeric" })
      );

      // Count HIRED applicants only
      const count = applicants.filter((a) => {
        if (a.status !== "Hired") return false;
        const d = new Date(a.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;

      data.push(count);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return {
      labels,
      datasets: [
        {
          label: "Hired Applicants",
          data,
          fill: true,
          backgroundColor: "rgba(34,197,94,0.2)",
          borderColor: "#22c55e",
          tension: 0.3,
        },
      ],
    };
  }, [applicants, startMonth, endMonth]);

  // Chart configs
  const guardStatusData = {
    labels: ["On Duty", "Off Duty", "Absent"],
    datasets: [
      {
        data: chartData.guardStatus,
        backgroundColor: ["#3b82f6", "#64748b", "#f97316"],
      },
    ],
  };

  const statusColors = {
    Review: "#eab308",
    Interview: "#3b82f6",
    Hired: "#22c55e",
    Declined: "#ef4444",
  };

  const applicantBarData = {
    labels: chartData.applicantsByStatus.labels,
    datasets: [
      {
        label: "Applicants",
        data: chartData.applicantsByStatus.data,
        backgroundColor: chartData.applicantsByStatus.labels.map(
          (s) => statusColors[s] || "#64748b"
        ),
      },
    ],
  };

  const attendanceTrendData = useMemo(() => {
    if (!chartData.attendance7d || !attStartMonth || !attEndMonth)
      return { labels: [], datasets: [] };

    return { labels: [], datasets: [] };
  }, [chartData.attendance7d, attStartMonth, attEndMonth]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <LayoutDashboard className="w-8 h-8 text-blue-400" />
          Admin Dashboard
        </h1>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg">
          <Bell size={20} />
          View Alerts
        </button>
      </header>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/Admin/AdminGuardsProfile">
          <KpiCard
            icon={<Shield className="text-blue-400" />}
            title="Total Guards"
            value={stats.totalGuards}
          />
        </Link>

        <Link to="/Admin/ApplicantList">
          <KpiCard
            icon={<Users className="text-yellow-400" />}
            title="Applicants"
            value={stats.applicants}
          />
        </Link>

        <Link to="/Admin/AdminPosts">
          <KpiCard
            icon={<FileText className="text-green-400" />}
            title="Announcements"
            value={stats.announcements}
          />
        </Link>

        <Link to="/Admin/AdminGuardUpdates">
          <KpiCard
            icon={<Clock className="text-orange-400" />}
            title="Total Logs"
            value={stats.logs}
          />
        </Link>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hiring Trend */}
        <div className="">
          {/* Header only */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="text-green-400" /> Hiring Trend
            </h3>

            <div className="flex gap-2 items-center">
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="bg-[#0f172a] border border-gray-700 p-1 rounded-md w-37"
              />

              <span className="text-gray-400">to</span>

              <input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="bg-[#0f172a] border border-gray-700 p-1 rounded-md w-37"
              />
            </div>
          </div>

          <ChartCard>
            {/* Chart below header */}
            <div className="h-64 w-full">
              {hiringTrendData.labels.length ? (
                <Line
                  data={{
                    ...hiringTrendData,
                    datasets: hiringTrendData.datasets.map((ds) => ({
                      ...ds,
                      borderWidth: 2,
                      pointRadius: 3,
                      pointHoverRadius: 5,
                      pointBackgroundColor: ds.borderColor || "#22c55e",
                      pointBorderColor: "#0f172a",
                      pointHoverBorderWidth: 2,
                      fill: true,
                      backgroundColor: (ctx) => {
                        const { chart } = ctx;
                        const { ctx: c } = chart;
                        const gradient = c.createLinearGradient(0, 0, 0, chart.height || 256);
                        gradient.addColorStop(0, "rgba(34,197,94,0.25)");
                        gradient.addColorStop(1, "rgba(34,197,94,0.02)");
                        return gradient;
                      },
                      tension: 0.35,
                    })),
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: {
                        labels: { color: "#e5e7eb" },
                      },
                      tooltip: {
                        backgroundColor: "#0b1220",
                        borderColor: "#1f2937",
                        borderWidth: 1,
                        titleColor: "#e5e7eb",
                        bodyColor: "#cbd5e1",
                        padding: 10,
                        callbacks: {
                          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: "#9ca3af" },
                        grid: { color: "rgba(148,163,184,0.12)" },
                      },
                      y: {
                        beginAtZero: true,
                        ticks: { color: "#9ca3af", precision: 0 },
                        grid: { color: "rgba(148,163,184,0.12)" },
                      },
                    },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  No data for selected range
                </div>
              )}
            </div>
          </ChartCard>
        </div>
        {/* Attendance Trend (Dynamic) */}
        <div className="">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="text-blue-400 " /> Attendance Trend
            </h3>
            <div className="flex gap-2 items-center">
              <input
                type="month"
                value={attStartMonth}
                onChange={(e) => setAttStartMonth(e.target.value)}
                className="bg-[#0f172a] border border-gray-700 p-1 rounded-md w-37"
              />
              <span className="text-gray-400">to</span>
              <input
                type="month"
                value={attEndMonth}
                onChange={(e) => setAttEndMonth(e.target.value)}
                className="bg-[#0f172a] border border-gray-700 p-1 rounded-md w-37"
              />
            </div>
          </div>
          <ChartCard>
            <div className="h-64 w-full">
              {dynamicAttendanceTrend.labels.length ? (
                <Line
                  data={{
                    ...dynamicAttendanceTrend,
                    datasets: dynamicAttendanceTrend.datasets.map((ds) => ({
                      ...ds,
                      borderWidth: 2,
                      pointRadius: 3,
                      pointHoverRadius: 5,
                      pointBackgroundColor: ds.borderColor || "#3b82f6",
                      pointBorderColor: "#0f172a",
                      pointHoverBorderWidth: 2,
                      fill: true,
                      backgroundColor: (ctx) => {
                        const { chart } = ctx;
                        const { ctx: c } = chart;
                        const g = c.createLinearGradient(0, 0, 0, chart.height || 256);
                        g.addColorStop(0, "rgba(59,130,246,0.25)");
                        g.addColorStop(1, "rgba(59,130,246,0.02)");
                        return g;
                      },
                      tension: 0.35,
                    })),
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: { labels: { color: "#e5e7eb" } },
                      tooltip: {
                        backgroundColor: "#0b1220",
                        borderColor: "#1f2937",
                        borderWidth: 1,
                        titleColor: "#e5e7eb",
                        bodyColor: "#cbd5e1",
                        padding: 10,
                        callbacks: {
                          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
                        },
                      },
                    },
                    scales: {
                      x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(148,163,184,0.12)" } },
                      y: { beginAtZero: true, ticks: { color: "#9ca3af", precision: 0 }, grid: { color: "rgba(148,163,184,0.12)" } },
                    },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  No attendance data for selected range
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Guard Status */}
        <ChartCard title="Guard Status Overview">
          <Doughnut data={guardStatusData} />
        </ChartCard>
      </section>

      {/* Applicants + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Applicants by Status">
          <Bar data={applicantBarData} />
        </ChartCard>

        {/* Recent Logs */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserCheck className="text-blue-400" /> Recent Guard Logs
          </h2>

          <ul className="divide-y divide-gray-700 text-gray-300 overflow-y-auto max-h-64 pr-2">
            {recentActivities.length ? (
              recentActivities.map((a) => (
                <li key={a.id} className="py-3">
                  <Link to={`/admin/AdminGuardUpdates2/${a.guard._id}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-400">
                        {a.type}
                      </span>
                      <span className="text-gray-500 text-sm">{a.time}</span>
                    </div>
                    {a.remarks && (
                      <p className="text-gray-300 text-sm mt-1">
                        {a.remarks}
                      </p>
                    )}
                    {a.guard && (
                      <p className="text-gray-500 text-xs mt-1">
                        {a.guard.fullName || "Unknown Guard"}{" "}
                        {a.guard.dutyStation
                          ? `• ${a.guard.dutyStation}`
                          : ""}
                      </p>
                    )}
                  </Link>
                </li>
              ))
            ) : (
              <li className="py-2 text-gray-500 italic">
                No recent activities
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* KPI CARD */
function KpiCard({ icon, title, value }) {
  return (
    <div className="bg-[#1e293b] rounded-xl p-4 shadow-lg flex flex-col items-center justify-center">
      <div className="mb-2">{icon}</div>
      <h3 className="text-sm text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-white">
        <CountUp
          from={0}
          to={value}
          separator=","
          duration={1}
          className="count-up-text"
        />
      </p>
    </div>
  );
}

/* CHART CARD */
function ChartCard({ title, children }) {
  return (
    <div className="bg-[#1e293b] rounded-xl p-5 shadow-lg">
      {title && (
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-400" />
          {title}
        </h3>
      )}
      <div className="w-full h-64 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
