import { useState, useEffect } from "react";
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
  LayoutDashboardIcon
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

  const [stats, setStats] = useState({
    totalGuards: 0,
    applicants: 0,
    announcements: 0,
    logs: 0,
  });

  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({
    guardStatus: [0, 0, 0],
    attendance7d: { labels: [], data: [] },
    applicantsByStatus: { labels: [], data: [] },
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const credentialsOption = { credentials: "include" };

        // Fetch all necessary data in parallel
        const [
          guardsRes,
          postsRes,
          logsRes,
          attendanceRes,
          applicantsRes,
        ] = await Promise.all([
          fetch("http://localhost:5000/api/guards", credentialsOption),
          fetch("http://localhost:5000/api/posts", credentialsOption),
          fetch("http://localhost:5000/api/logbook", credentialsOption),
          fetch("http://localhost:5000/api/attendance", credentialsOption),
          fetch("http://localhost:5000/api/applicants", credentialsOption),
        ]);

        const guards = guardsRes.ok ? await guardsRes.json() : [];
        const announcements = postsRes.ok ? await postsRes.json() : [];
        const logs = logsRes.ok ? await logsRes.json() : [];
        const attendance = attendanceRes.ok ? await attendanceRes.json() : [];
        const applicants = applicantsRes.ok ? await applicantsRes.json() : [];

        setStats({
          totalGuards: Array.isArray(guards) ? guards.length : 0,
          applicants: Array.isArray(applicants) ? applicants.length : 0,
          announcements: Array.isArray(announcements) ? announcements.length : 0,
          logs: Array.isArray(logs) ? logs.length : 0,
        });

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

        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });
        const labels = days.map((d) =>
          d.toLocaleDateString(undefined, { weekday: "short" })
        );
        const dayKeys = days.map((d) => d.toLocaleDateString());
        const counts7d = dayKeys.map((k) => 0);
        attendance.forEach((a) => {
          const created = a.createdAt
            ? new Date(a.createdAt).toLocaleDateString()
            : null;
          const idx = dayKeys.indexOf(created);
          if (idx >= 0) counts7d[idx]++;
        });

        const aggStatus = {};
        applicants.forEach((a) => {
          const status = (a.status || "Unknown").toString();
          aggStatus[status] = (aggStatus[status] || 0) + 1;
        });
        const applicantsLabels = Object.keys(aggStatus);
        const applicantsData = Object.values(aggStatus);

        const logsSorted = logs
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
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

        // === Update State ===
        setChartData({
          guardStatus,
          attendance7d: { labels, data: counts7d },
          applicantsByStatus: { labels: applicantsLabels, data: applicantsData },
        });
        setRecentActivities(activities);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      }
    };

    fetchDashboardData();
  }, [user]);


  console.log()

  // 📊 Chart Data
  const guardStatusData = {
    labels: ["On Duty", "Off Duty", "Absent"],
    datasets: [
      {
        data: chartData.guardStatus,
        backgroundColor: ["#3b82f6", "#64748b", "#f97316"],
        borderWidth: 1,
      },
    ],
  };

 const statusColorsMap = {
    Review: "#eab308",    // yellow
    Interview: "#3b82f6", // blue
    Hired: "#22c55e",     // green
    Declined: "#ef4444",  // red
  };

  // Build backgroundColor array based on chart labels
  const backgroundColors = chartData.applicantsByStatus.labels.map(
    (status) => statusColorsMap[status] || "#64748b" // fallback gray
  );

  const applicantData = {
    labels: chartData.applicantsByStatus.labels,
    datasets: [
      {
        label: "Applicants",
        data: chartData.applicantsByStatus.data,
        backgroundColor: backgroundColors,
      },
    ],
  };
  
  const attendanceTrendData = {
    labels: chartData.attendance7d.labels,
    datasets: [
      {
        label: "Attendance Count",
        data: chartData.attendance7d.data,
        fill: true,
        backgroundColor: "rgba(59,130,246,0.2)",
        borderColor: "#3b82f6",
        tension: 0.3,
      },
    ],
  };

  const hiringTrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    datasets: [
      {
        label: "Hired Applicants",
        data: [2, 3, 5, 6, 8, 5, 9, 10, 7, 12],
        fill: true,
        backgroundColor: "rgba(34,197,94,0.2)",
        borderColor: "#22c55e",
        pointBackgroundColor: "#22c55e",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="flex items-center justify-center sm:justify-start gap-2 text-3xl font-bold text-white tracking-wide">
            <LayoutDashboard className="w-8 h-8 text-blue-400" />
            Admin Dashboard
        </h1>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg shadow-md transition">
          <Bell className="w-5 h-5" />
          <span>View Alerts</span>
        </button>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Link to="/Admin/AdminGuardsProfile">
              <KpiCard icon={<Shield className="text-blue-400" />} title="Total Guards" value={stats.totalGuards} />
            </Link>
            <Link to="/Admin/ApplicantList">
              <KpiCard icon={<Users className="text-yellow-400" />} title="Applicants" value={stats.applicants} />
            </Link>
            <Link to="/Admin/AdminPosts">
              <KpiCard icon={<FileText className="text-green-400" />} title="Announcements" value={stats.announcements} />
            </Link>
            <Link to="/Admin/AdminGuardUpdates">
              <KpiCard icon={<Clock className="text-orange-400" />} title="Total Logs" value={stats.logs} />
            </Link>
          </>
        )}
      </section>

      {/* Charts Section */}
      {!loading && (
        <>
          {/* Upper Charts Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Monthly Hiring Trend">
              <Line data={hiringTrendData} />
            </ChartCard>
            <ChartCard title="Weekly Attendance Trend">
              <Line data={attendanceTrendData} />
            </ChartCard>
            <ChartCard title="Guard Status Overview">
              <Doughnut data={guardStatusData} />
            </ChartCard>
          </section>

          {/* Lower Charts + Activities */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Applicants by Status">
              <Bar data={applicantData} />
            </ChartCard>

            <div className="lg:col-span-2 bg-[#1e293b] rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <UserCheck className="text-blue-400" /> Recent Guard Logs
                </h2>

                {/* Scrollable List */}
                <ul className="divide-y divide-gray-700 text-gray-300 overflow-y-auto max-h-64 pr-2">
                  {recentActivities.length ? (
                    recentActivities.map((a) => (
                        <li key={a.id} className="py-3 flex flex-col">
                          <Link to={`/admin/AdminGuardUpdates2/${a.guard._id}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-blue-400">{a.type || "Log"}</span>
                              <span className="text-gray-500 text-sm">{a.time}</span>
                            </div>
                            {a.remarks && (
                              <p className="text-gray-300 text-sm mt-1">{a.remarks}</p>
                            )}
                            {a.guard && (
                              <p className="text-gray-500 text-xs mt-1">
                                {a.guard.fullName || "Unknown Guard"}{" "}
                                {a.guard.dutyStation ? `• ${a.guard.dutyStation}` : ""}
                              </p>
                            )}
                          </Link>
                        </li>
                    ))
                  ) : (
                    <li className="py-2 text-gray-500 italic">No recent activities</li>
                  )}
                </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* KPI CARD */
function KpiCard({ icon, title, value }) {
  return (
    <div className="bg-[#1e293b] rounded-xl p-4 shadow-lg flex flex-col items-center justify-center hover:shadow-blue-500/10 transition">
      <div className="mb-2">{icon}</div>
      <h3 className="text-sm text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-white">
        <CountUp
          from={0}
          to={value}
          separator=","
          direction="up"
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
    <div className="bg-[#1e293b] rounded-xl p-5 shadow-lg hover:shadow-blue-500/10 transition flex flex-col justify-center">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="text-green-400" />
        {title}
      </h3>
      <div className="w-full h-64 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* SKELETON LOADER */
function SkeletonCard() {
  return (
    <div className="bg-[#1e293b] rounded-xl p-4 animate-pulse flex flex-col items-center justify-center">
      <div className="w-8 h-8 bg-gray-600 rounded-full mb-2"></div>
      <div className="w-16 h-3 bg-gray-600 rounded mb-1"></div>
      <div className="w-10 h-4 bg-gray-500 rounded"></div>
    </div>
  );
}
