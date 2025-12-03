import { useState, useEffect, useMemo, Fragment } from "react";
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
  Filler,
} from "chart.js";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  Shield,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  LayoutDashboard,
  CalendarDays,
  ChevronDown,
  Activity
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import CountUp from "../components/CountUp";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const api = import.meta.env.VITE_API_URL;

// --- Custom CSS for Dark Mode Date Picker ---
const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #3b82f6;
    --rdp-background-color: #1e293b;
    margin: 0;
  }
  .rdp-day_selected:not([disabled]) { 
    background-color: #3b82f6; 
    color: white;
    font-weight: bold;
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
`;

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [hiringDateRange, setHiringDateRange] = useState({
    from: startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 5))),
    to: endOfMonth(new Date()),
  });
  const [attendanceDateRange, setAttendanceDateRange] = useState({
    from: startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 5))),
    to: endOfMonth(new Date()),
  });

  const [stats, setStats] = useState({
    totalGuards: 0,
    applicants: 0,
    announcements: 0,
    logs: 0,
  });

  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);
  const [chartData, setChartData] = useState({
    guardStatus: [0, 0, 0],
    applicantsByStatus: { labels: [], data: [] },
  });

  // --- Effects ---
  useEffect(() => {
    if (!user && !loading) navigate("/admin/login");
    document.title = "Dashboard | JPM Security Agency";
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const opt = { credentials: "include" };

        const [guardsRes, postsRes, logsRes, attendanceRes, applicantsRes] =
          await Promise.all([
            fetch(`${api}/api/guards`, opt),
            fetch(`${api}/api/posts`, opt),
            fetch(`${api}/api/logbook`, opt),
            fetch(`${api}/api/attendance`, opt),
            fetch(`${api}/api/applicants`, opt),
          ]);

        const guards = guardsRes.ok ? await guardsRes.json() : [];
        const announcements = postsRes.ok ? await postsRes.json() : [];
        const logs = logsRes.ok ? await logsRes.json() : [];
        const attendance = attendanceRes.ok ? await attendanceRes.json() : [];
        const applicantsData = applicantsRes.ok ? await applicantsRes.json() : [];

        setRawAttendance(attendance);
        setApplicants(applicantsData);

        // Update Stats
        setStats({
          totalGuards: guards.length,
          applicants: applicantsData.length,
          announcements: announcements.length,
          logs: logs.length,
        });

        // Guard Status Logic
        const guardStatusMap = new Map();
        [...attendance].sort((a,b) => new Date(b.timeIn) - new Date(a.timeIn)).forEach(a => {
          if (!guardStatusMap.has(a.guard._id)) {
            guardStatusMap.set(a.guard._id, a.status);
          }
        });
        
        const statusCounts = { "On Duty": 0, "Off Duty": guards.length, "Absent": 0 };
        guardStatusMap.forEach(status => {
          statusCounts[status] = (statusCounts[status] || 0) + 1;
          if(status === "On Duty") statusCounts["Off Duty"]--;
        });

        // Applicant Status Logic
        const aggStatus = {};
        applicantsData.forEach((a) => {
          const status = a.status || "Unknown";
          aggStatus[status] = (aggStatus[status] || 0) + 1;
        });

        setChartData({
          guardStatus: [statusCounts["On Duty"], statusCounts["Off Duty"], statusCounts["Absent"]],
          applicantsByStatus: { labels: Object.keys(aggStatus), data: Object.values(aggStatus) },
        });

        // Recent Logs Logic
        const activities = [...logs]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 8) // Limit to 8 for cleaner UI
          .map((l, idx) => ({
            id: l._id || idx,
            type: l.type || "Log",
            remarks: l.remarks || "",
            time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
            date: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "-",
            guard: l.guard || {},
          }));
        setRecentActivities(activities);

      } catch (err) {
        console.error("Dashboard Error:", err);
        setError("Failed to load dashboard data.");
      }
    };
    if (user) fetchDashboardData();
  }, [user]);

  // --- Memoized Chart Data ---

  const dynamicAttendanceTrend = useMemo(() => {
    if (!rawAttendance.length || !attendanceDateRange.from) return { labels: [], datasets: [] };
    
    const filtered = rawAttendance.filter(a => {
        if (!a.timeIn) return false;
        const recordDate = new Date(a.timeIn);
        const from = attendanceDateRange.from;
        const to = attendanceDateRange.to || attendanceDateRange.from; 
        return recordDate >= from && recordDate <= endOfMonth(to);
    });

    const trend = {};
    filtered.forEach(a => {
      const monthKey = format(new Date(a.timeIn), 'yyyy-MM-dd'); // Group by day for more detail
      trend[monthKey] = (trend[monthKey] || 0) + 1;
    });

    // Sort dates
    const sortedKeys = Object.keys(trend).sort();
    
    // Fill logic could go here to fill empty days with 0, simplified for now
    
    return {
      labels: sortedKeys.map(l => format(new Date(l), 'MMM dd')),
      datasets: [{
          label: "Attendance",
          data: sortedKeys.map(key => trend[key]),
          borderColor: "#3b82f6",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)");
            gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 2,
        }],
    };
  }, [rawAttendance, attendanceDateRange]);

  const hiringTrendData = useMemo(() => {
    if (!applicants.length || !hiringDateRange.from) return { labels: [], datasets: [] };

    const filtered = applicants.filter(a => {
        if (a.status !== "Hired" || !a.createdAt) return false;
        const recordDate = new Date(a.createdAt);
        const from = hiringDateRange.from;
        const to = hiringDateRange.to || hiringDateRange.from;
        return recordDate >= from && recordDate <= endOfMonth(to);
    });

    const trend = {};
    filtered.forEach(a => {
      const monthKey = format(new Date(a.createdAt), 'yyyy-MM');
      trend[monthKey] = (trend[monthKey] || 0) + 1;
    });

    const labels = Object.keys(trend).sort();

    return {
      labels: labels.map(l => format(new Date(l), 'MMM yyyy')),
      datasets: [{
          label: "Hired",
          data: labels.map(key => trend[key]),
          fill: true,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(34, 197, 94, 0.5)");
            gradient.addColorStop(1, "rgba(34, 197, 94, 0.0)");
            return gradient;
          },
          borderColor: "#22c55e",
          tension: 0.4,
        }],
    };
  }, [applicants, hiringDateRange]);

  const guardStatusData = {
    labels: ["On Duty", "Off Duty", "Absent"],
    datasets: [{ 
        data: chartData.guardStatus, 
        backgroundColor: ["#3b82f6", "#1e293b", "#ef4444"],
        borderColor: "#0f172a",
        borderWidth: 5,
        hoverOffset: 4
    }],
  };

  const statusColors = { Review: "#eab308", Interview: "#3b82f6", Hired: "#22c55e", Declined: "#ef4444" };
  
  const applicantBarData = {
    labels: chartData.applicantsByStatus.labels,
    datasets: [{
        label: "Applicants",
        data: chartData.applicantsByStatus.data,
        backgroundColor: chartData.applicantsByStatus.labels.map(s => statusColors[s] || "#64748b"),
        borderRadius: 6,
        barThickness: 20,
    }],
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 md:p-8 font-sans">
      <style>{datePickerStyles}</style>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white tracking-tight">
                <LayoutDashboard className="text-blue-500" size={32} />
                Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1 ml-11">Welcome back, Admin. Here's your daily overview.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
            <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard 
            icon={<Shield className="text-white" size={24} />} 
            title="Total Guards" 
            value={stats.totalGuards} 
            link="/Admin/AdminGuardsProfile"
            color="bg-blue-600"
        />
        <KpiCard 
            icon={<Users className="text-white" size={24} />} 
            title="Applicants" 
            value={stats.applicants} 
            link="/Admin/ApplicantList"
            color="bg-purple-600"
        />
        <KpiCard 
            icon={<FileText className="text-white" size={24} />} 
            title="Announcements" 
            value={stats.announcements} 
            link="/Admin/AdminPosts"
            color="bg-emerald-600"
        />
        <KpiCard 
            icon={<Clock className="text-white" size={24} />} 
            title="Total Logs" 
            value={stats.logs} 
            link="/Admin/AdminGuardUpdates"
            color="bg-amber-600"
        />
      </section>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Hiring Trend */}
        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-xl border border-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                    <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="text-green-500" size={18}/></div>
                    Hiring Trend
                </h3>
                <DateRangeFilter dateRange={hiringDateRange} setDateRange={setHiringDateRange} />
            </div>
            <div className="h-64">
                {hiringTrendData.labels.length ? <Line data={hiringTrendData} options={chartOptions} /> : <NoDataMessage />}
            </div>
        </div>

        {/* Attendance Trend */}
        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-xl border border-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><Activity className="text-blue-500" size={18}/></div>
                    Attendance
                </h3>
                <DateRangeFilter dateRange={attendanceDateRange} setDateRange={setAttendanceDateRange} />
            </div>
            <div className="h-64">
                {dynamicAttendanceTrend.labels.length ? <Line data={dynamicAttendanceTrend} options={chartOptions} /> : <NoDataMessage />}
            </div>
        </div>

        {/* Guard Status */}
        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-xl border border-gray-800 flex flex-col">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg"><Shield className="text-indigo-500" size={18}/></div>
                Guard Status
            </h3>
            <div className="relative h-64 w-full flex items-center justify-center">
                <Doughnut 
                    data={guardStatusData} 
                    options={{ 
                        maintainAspectRatio: false, 
                        cutout: '75%',
                        plugins: { 
                            legend: { position: 'bottom', labels: { color: "#9ca3af", padding: 20, usePointStyle: true } } 
                        } 
                    }} 
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold text-white">{stats.totalGuards}</span>
                    <span className="text-xs text-gray-500">Total</span>
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Grid: Applicants & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Applicant Funnel */}
        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-xl border border-gray-800">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg"><Users className="text-purple-500" size={18}/></div>
                Applicant Pipeline
            </h3>
            <div className="h-64">
                <Bar data={applicantBarData} options={{...chartOptions, indexAxis: 'y' }} />
            </div>
        </div>

        {/* Recent Logs */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-2xl shadow-xl border border-gray-800 flex flex-col">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                    <div className="p-2 bg-orange-500/10 rounded-lg"><Clock className="text-orange-500" size={18}/></div>
                    Recent Activities
                </h3>
                <Link to="/Admin/AdminGuardUpdates" className="text-sm text-blue-400 hover:text-blue-300">View All</Link>
            </div>
            
            <div className="p-0 overflow-y-auto max-h-[300px] custom-scrollbar">
                {recentActivities.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f172a] text-gray-400 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Guard</th>
                                <th className="px-6 py-3 font-medium">Remarks</th>
                                <th className="px-6 py-3 font-medium text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {recentActivities.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-3 font-medium text-blue-400">{a.type}</td>
                                    <td className="px-6 py-3 text-white">{a.guard.fullName || "Unknown"}</td>
                                    <td className="px-6 py-3 text-gray-400 max-w-xs truncate">{a.remarks}</td>
                                    <td className="px-6 py-3 text-right text-gray-500 text-xs">
                                        <div>{a.date}</div>
                                        <div>{a.time}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-10 text-center text-gray-500">No recent activities found.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

const KpiCard = ({ icon, title, value, link, color }) => (
  <Link to={link} className="relative overflow-hidden bg-[#1e293b] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-800 group">
    <div className="flex justify-between items-start">
        <div>
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">
                <CountUp from={0} to={value} separator="," duration={1.5} />
            </h3>
        </div>
        <div className={`p-3 rounded-xl shadow-lg ${color}`}>
            {icon}
        </div>
    </div>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
  </Link>
);

const DateRangeFilter = ({ dateRange, setDateRange }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <CalendarDays size={14} />
          {dateRange.from ? (
             <>
               {format(dateRange.from, "MMM d")} - {dateRange.to ? format(dateRange.to, "MMM d") : "..."}
             </>
          ) : "Select Date"}
          <ChevronDown size={14} className="opacity-50"/>
        </button>
  
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-2xl z-50">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              className="text-sm"
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700 mt-2">
                <button onClick={() => setIsOpen(false)} className="text-xs text-gray-400 hover:text-white px-3 py-1">Close</button>
                <button onClick={() => setIsOpen(false)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">Apply</button>
            </div>
          </div>
        )}
      </div>
    );
};

const NoDataMessage = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
        <AlertTriangle size={24} className="opacity-20"/>
        <span className="text-xs">No data available</span>
    </div>
);

const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f3f4f6",
      bodyColor: "#d1d5db",
      borderColor: "#374151",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: { 
        ticks: { color: "#6b7280", font: { size: 10 } }, 
        grid: { display: false } 
    },
    y: { 
        beginAtZero: true, 
        ticks: { color: "#6b7280", font: { size: 10 }, maxTicksLimit: 5 }, 
        grid: { color: "rgba(255,255,255,0.05)" } 
    },
  },
};