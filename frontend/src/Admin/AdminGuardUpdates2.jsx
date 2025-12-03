import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { 
  ArrowLeft, Clock, MapPin, User, Shield, CalendarDays, 
  Activity, FileText, CheckCircle, AlertCircle, Hash 
} from "lucide-react";

const api = import.meta.env.VITE_API_URL;

// --- Helper Functions ---
const formatDateDisplay = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
  } catch (e) {
    return "Invalid Date";
  }
};

const formatTimeDisplay = (dateString) => {
    if (!dateString) return "";
    try {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ""; }
}

// --- Components ---

const InfoBadge = ({ icon: Icon, label, value, colorClass = "text-blue-400" }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
    <div className={`p-2 rounded-lg bg-slate-900 ${colorClass}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-100 truncate max-w-[150px]" title={value}>{value || "N/A"}</p>
    </div>
  </div>
);

const SkeletonLoader = () => (
  <div className="max-w-7xl mx-auto p-6 space-y-6 animate-pulse">
    <div className="h-8 bg-slate-800 rounded w-32 mb-8"></div>
    <div className="h-64 bg-slate-800 rounded-2xl"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-96 bg-slate-800 rounded-2xl lg:col-span-2"></div>
        <div className="h-96 bg-slate-800 rounded-2xl"></div>
    </div>
  </div>
);

export default function AdminGuardUpdates2() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [guard, setGuard] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (id) fetchGuardData();
  }, [id]);

  const fetchGuardData = async () => {
    try {
      setLoadingPage(true);
      setError("");
      const response = await fetch(`${api}/api/guards/${id}/details`, { credentials: "include" });

      if (response.ok) {
        const data = await response.json();
        setGuard(data.guard);
        setSchedules(data.schedules);
        setLogs(data.logs);
      } else {
        setError("Guard not found or access denied.");
      }
    } catch (error) {
      console.error("Error fetching guard details:", error);
      setError("Network error. Unable to load guard data.");
    } finally {
      setLoadingPage(false);
    }
  };

  if (loading || loadingPage) return <div className="min-h-screen bg-[#0f172a]"><SkeletonLoader /></div>;

  if (error || !guard) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <div className="text-red-400 bg-red-900/20 p-6 rounded-2xl border border-red-900/50 text-center max-w-md">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
            <p className="text-sm text-gray-400 mb-6">{error || "Guard data unavailable."}</p>
            <Link to="/admin/AdminGuardUpdates" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg transition">
                Return to List
            </Link>
        </div>
      </div>
    );
  }

  const isGuardActive = guard.status === "Active";

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-12">
      <div className=" p-4 sm:p-6 lg:p-8">
        
        {/* Navigation */}
        <div className="mb-8">
          <Link to="/admin/AdminGuardUpdates" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition group">
            <div className="p-2 bg-slate-800 rounded-full group-hover:bg-slate-700 transition">
                <ArrowLeft size={18} />
            </div>
            <span className="font-medium">Back to Guard List</span>
          </Link>
        </div>

        {/* --- Profile Header --- */}
        <div className="bg-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden mb-8">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start relative z-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl mb-4">
                        <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center text-4xl font-bold text-white border-4 border-[#1e293b]">
                            {guard.fullName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        isGuardActive 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                        {guard.status}
                    </span>
                </div>

                {/* Info Section */}
                <div className="flex-1 w-full text-center lg:text-left">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{guard.fullName}</h1>
                    <p className="text-slate-400 mb-6 flex items-center justify-center lg:justify-start gap-2">
                        <Hash size={16}/> {guard.guardId}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <InfoBadge icon={Shield} label="Position" value={guard.position} colorClass="text-purple-400" />
                        <InfoBadge icon={MapPin} label="Duty Station" value={guard.dutyStation} colorClass="text-red-400" />
                        <InfoBadge icon={Clock} label="Assigned Shift" value={guard.shift} colorClass="text-amber-400" />
                        <InfoBadge icon={CalendarDays} label="Joined" value={formatDateDisplay(guard.createdAt)} colorClass="text-blue-400" />
                    </div>
                </div>
            </div>
        </div>

        {/* --- Content Grid --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column: Schedules (2/3 width on large screens) */}
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <CalendarDays className="text-blue-500" size={20} /> Upcoming Schedules
                        </h2>
                    </div>
                    
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#0f172a] text-slate-400 uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Shift</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {schedules.length > 0 ? schedules.map((sch) => (
                                    <tr key={sch._id} className="hover:bg-slate-800/50 transition">
                                        <td className="px-6 py-4 font-medium text-white">{sch.client}</td>
                                        <td className="px-6 py-4 text-slate-400">{sch.deploymentLocation}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded border ${
                                                sch.shiftType === "Night Shift" ? "bg-indigo-900/30 text-indigo-300 border-indigo-700" : "bg-amber-900/30 text-amber-300 border-amber-700"
                                            }`}>
                                                {sch.shiftType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                                            {formatTimeDisplay(sch.timeIn)} - {formatTimeDisplay(sch.timeOut)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{formatDateDisplay(sch.timeIn)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] uppercase font-bold ${
                                                sch.isApproved === "Approved" ? "text-emerald-400" : "text-amber-400"
                                            }`}>
                                                {sch.isApproved}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No schedules assigned.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden p-4 space-y-4">
                        {schedules.length > 0 ? schedules.map(sch => (
                            <div key={sch._id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white">{sch.client}</h3>
                                        <p className="text-xs text-slate-400">{sch.deploymentLocation}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold border ${
                                        sch.isApproved === "Approved" ? "bg-emerald-900/30 border-emerald-700 text-emerald-400" : "bg-amber-900/30 border-amber-700 text-amber-400"
                                    }`}>{sch.isApproved}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/50 p-2 rounded-lg">
                                    <Clock size={14} className="text-blue-400"/>
                                    {formatDateDisplay(sch.timeIn, { month:'short', day:'numeric' })} • {formatTimeDisplay(sch.timeIn)} - {formatTimeDisplay(sch.timeOut)}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-500 py-4">No schedules assigned.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Activity Log Timeline */}
            <div className="xl:col-span-1">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-lg h-full max-h-[800px] flex flex-col">
                    <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="text-emerald-500" size={20} /> Recent Logs
                        </h2>
                    </div>
                    
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {logs.length > 0 ? (
                            <div className="relative border-l border-slate-700 ml-3 space-y-8">
                                {logs.map((log) => (
                                    <div key={log._id} className="ml-8 relative">
                                        {/* Timeline Dot */}
                                        <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-[#1e293b] bg-slate-600 flex items-center justify-center">
                                            {/* Optional: Add tiny icon inside dot based on log type */}
                                        </span>
                                        
                                        {/* Content Card */}
                                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-emerald-400 font-semibold text-sm">{log.type}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{formatTimeDisplay(log.createdAt)}</span>
                                            </div>
                                            
                                            <p className="text-slate-300 text-sm leading-relaxed mb-3">{log.remarks}</p>
                                            
                                            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                                                <MapPin size={12}/> {log.post}
                                                <span className="text-slate-600">•</span>
                                                <span>{formatDateDisplay(log.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <FileText size={48} className="mb-3 opacity-20"/>
                                <p>No log activity recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}