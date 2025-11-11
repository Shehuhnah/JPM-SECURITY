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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
  const { admin, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalGuards: 0,
    applicants: 0,
    announcements: 0,
    logs: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!admin && !token) {
      navigate("/admin/login");
    }

    const fetchDashboardData = async () => {
      try {
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const [guardsRes, postsRes, logsRes] = await Promise.all([
          fetch("http://localhost:5000/api/guards", { headers: authHeaders }),
          fetch("http://localhost:5000/api/posts", { headers: authHeaders }),
          fetch("http://localhost:5000/api/logbook", { headers: authHeaders }),
        ]);

        const [guards, announcements, logs] = await Promise.all([
          guardsRes.ok ? guardsRes.json() : Promise.resolve([]),
          postsRes.ok ? postsRes.json() : Promise.resolve([]),
          logsRes.ok ? logsRes.json() : Promise.resolve([]),
        ]);

        // Try to fetch applicants count from common endpoints; fall back gracefully
        let applicantsCount = 0;
        try {
          const hiringsRes = await fetch("http://localhost:5000/api/hirings", { headers: authHeaders });
          if (hiringsRes.ok) {
            const hirings = await hiringsRes.json();
            applicantsCount = Array.isArray(hirings) ? hirings.length : 0;
          } else {
            // Secondary fallback: a potential applicants endpoint if present
            const applicantsRes = await fetch("http://localhost:5000/api/applicants", { headers: authHeaders });
            if (applicantsRes.ok) {
              const applicants = await applicantsRes.json();
              applicantsCount = Array.isArray(applicants) ? applicants.length : 0;
            }
          }
        } catch (_) {
          // Ignore and keep applicantsCount at 0 if endpoint is unavailable
        }

        setStats({
          totalGuards: Array.isArray(guards) ? guards.length : 0,
          applicants: applicantsCount,
          announcements: Array.isArray(announcements) ? announcements.length : 0,
          logs: Array.isArray(logs) ? logs.length : 0,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 📊 Chart Data
  const guardStatusData = {
    labels: ["On Duty", "Off Duty", "Leave"],
    datasets: [
      {
        data: [28, 16, 4],
        backgroundColor: ["#3b82f6", "#64748b", "#f97316"],
        borderWidth: 1,
      },
    ],
  };

  const applicantData = {
    labels: ["Pending", "Interview", "Hired", "Rejected"],
    datasets: [
      {
        label: "Applicants",
        data: [8, 4, 3, 1],
        backgroundColor: ["#eab308", "#3b82f6", "#22c55e", "#ef4444"],
      },
    ],
  };

  const attendanceTrendData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Attendance Count",
        data: [35, 37, 34, 39, 42, 41, 40],
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
            <KpiCard icon={<Shield className="text-blue-400" />} title="Total Guards" value={stats.totalGuards} />
            <KpiCard icon={<Users className="text-yellow-400" />} title="Applicants" value={stats.applicants} />
            <KpiCard icon={<FileText className="text-green-400" />} title="Announcements" value={stats.announcements} />
            <KpiCard icon={<Clock className="text-orange-400" />} title="Total Logs" value={stats.logs} />
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
                    <UserCheck className="text-blue-400" /> Recent Guard Activities
                </h2>

                {/* Scrollable List */}
                <ul className="divide-y divide-gray-700 text-gray-300 overflow-y-auto max-h-64 pr-2">
                    <li className="py-2 flex justify-between">
                    <span>Guard Mark Dela Cruz logged duty at Post A</span>
                    <span className="text-gray-500 text-sm">10:32 AM</span>
                    </li>
                    <li className="py-2 flex justify-between">
                    <span>Guard Ana Santos submitted incident report</span>
                    <span className="text-gray-500 text-sm">09:18 AM</span>
                    </li>
                    <li className="py-2 flex justify-between">
                    <span>Guard Tony Reyes marked off-duty</span>
                    <span className="text-gray-500 text-sm">08:45 AM</span>
                    </li>
                    <li className="py-2 flex justify-between">
                    <span>Guard Carlo Lopez resumed shift</span>
                    <span className="text-gray-500 text-sm">08:20 AM</span>
                    </li>
                    <li className="py-2 flex justify-between">
                    <span>Guard Ricky Perez submitted attendance</span>
                    <span className="text-gray-500 text-sm">07:55 AM</span>
                    </li>
                    <li className="py-2 flex justify-between">
                    <span>Guard Maria Cruz reported incident</span>
                    <span className="text-gray-500 text-sm">07:40 AM</span>
                    </li>
                    <li className="py-2 flex justify-between">
                    <span>Guard Leo Santos checked in at Post C</span>
                    <span className="text-gray-500 text-sm">07:30 AM</span>
                    </li>
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
      <p className="text-2xl font-bold text-white">{value}</p>
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
