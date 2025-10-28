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
} from "lucide-react";

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
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth";

export default function AdminDashboard() {

    const { admin, token } = useAuth();
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        totalGuards: 0,
        applicants: 0,
        announcements: 0,
        logs: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🧩 Fetch dashboard data
    useEffect(() => {

        if(!admin && !token){
            navigate("/admin/login")
        }
        console.log("welcome admin: ", token)

        const fetchDashboardData = async () => {
        try {
            const [guardsRes,  annRes, logsRes] = await Promise.all([
            fetch("http://localhost:5000/api/guards"),
            fetch("http://localhost:5000/api/posts"),
            fetch("http://localhost:5000/api/logbook"),
            ]);

            const guards = await guardsRes.json();
            const announcements = await annRes.json();
            const logs = await logsRes.json();

            setStats({
            totalGuards: guards.length,
            announcements: announcements.length,
            logs: logs.length,
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

    // 🟦 Mock chart data for now
    const guardStatusData = {
        labels: ["On Duty", "Off Duty", "Leave"],
        datasets: [
        {
            data: [28, 16, 4],
            backgroundColor: ["#3b82f6", "#1e293b", "#f97316"],
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

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-white tracking-wide">
            🧠 Admin Dashboard
            </h1>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg shadow-md transition">
            <Bell className="w-5 h-5" />
            <span>View Alerts</span>
            </button>
        </header>

        {/* Error message */}
        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
            </div>
        )}

        {/* KPI CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
            <>
                <KpiCard
                icon={<Shield className="text-blue-400" />}
                title="Total Guards"
                value={stats.totalGuards}
                />
                <KpiCard
                icon={<Users className="text-yellow-400" />}
                title="Applicants"
                value={stats.applicants}
                />
                <KpiCard
                icon={<FileText className="text-green-400" />}
                title="Announcements"
                value={stats.announcements}
                />
                <KpiCard
                icon={<Clock className="text-orange-400" />}
                title="Total Logs"
                value={stats.logs}
                />
            </>
            )}
        </section>

        {/* CHARTS SECTION */}
        {!loading && (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <ChartCard title="Guard Status Overview">
                <Doughnut data={guardStatusData} />
            </ChartCard>

            <ChartCard title="Applicants by Status">
                <Bar data={applicantData} />
            </ChartCard>

            <ChartCard title="Weekly Attendance Trend" span>
                <Line data={attendanceTrendData} />
            </ChartCard>
            </section>
        )}

        {/* RECENT ACTIVITIES */}
        {!loading && (
            <section className="bg-[#1e293b] rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="text-blue-400" /> Recent Guard Activities
            </h2>
            <ul className="divide-y divide-gray-700 text-gray-300">
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
            </ul>
            </section>
        )}
        </div>
    );
}

/* 🧱 KPI CARD COMPONENT */
function KpiCard({ icon, title, value }) {
    return (
        <div className="bg-[#1e293b] rounded-xl p-4 shadow-lg flex flex-col items-center justify-center hover:shadow-blue-500/10 transition">
            <div className="mb-2">{icon}</div>
            <h3 className="text-sm text-gray-400">{title}</h3>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

/* 🧩 CHART CARD COMPONENT */
function ChartCard({ title, children }) {
    return (
        <div className="bg-[#1e293b] rounded-xl p-4 shadow-lg hover:shadow-blue-500/10 transition flex flex-col justify-center">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            {children}
        </div>
    );
}

/* 💀 Skeleton Loader */
function SkeletonCard() {
    return (
        <div className="bg-[#1e293b] rounded-xl p-4 animate-pulse flex flex-col items-center justify-center">
            <div className="w-8 h-8 bg-gray-600 rounded-full mb-2"></div>
            <div className="w-16 h-3 bg-gray-600 rounded mb-1"></div>
            <div className="w-10 h-4 bg-gray-500 rounded"></div>
        </div>
    );
}
