import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, UserX, AlertTriangle, Hash, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";

const api = import.meta.env.VITE_API_URL;

export default function AdminGuardUpdates() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [search, setSearch] = useState("");
  const [guards, setGuards] = useState([]);
  const [staff, setStaff] = useState([]);
  const [viewType, setViewType] = useState("guard");
  const [error, setError] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = "Updates | JPM Security Agency";
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      setError("");

      const [guardsResponse, staffResponse, logbookResponse] = await Promise.all([
        fetch(`${api}/api/guards`, { credentials: "include" }),
        fetch(`${api}/api/auth/users`, { credentials: "include" }),
        fetch(`${api}/api/logbook`, { credentials: "include" }),
      ]);

      if (!guardsResponse.ok || !staffResponse.ok || !logbookResponse.ok) {
        setError("Failed to load updates data.");
        return;
      }

      const [guardsData, staffData, logbookData] = await Promise.all([
        guardsResponse.json(),
        staffResponse.json(),
        logbookResponse.json(),
      ]);

      const latestLogByGuard = new Map();
      (Array.isArray(logbookData) ? logbookData : []).forEach((log) => {
        const guardId = log?.guard?._id || log?.guard;
        const createdAt = new Date(log?.createdAt || 0).getTime();

        if (!guardId || !Number.isFinite(createdAt)) {
          return;
        }

        const previous = latestLogByGuard.get(String(guardId)) || 0;
        if (createdAt > previous) {
          latestLogByGuard.set(String(guardId), createdAt);
        }
      });

      const sortedGuards = (Array.isArray(guardsData) ? guardsData : [])
        .map((guard) => ({
          ...guard,
          latestLogAt: latestLogByGuard.get(String(guard._id)) || 0,
        }))
        .sort((a, b) => {
          if (b.latestLogAt !== a.latestLogAt) {
            return b.latestLogAt - a.latestLogAt;
          }

          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

      setGuards(sortedGuards);
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (fetchError) {
      console.error("Error fetching updates data:", fetchError);
      setError("Network error. Please try again.");
    } finally {
      setLoadingRecords(false);
    }
  };

  const query = search.toLowerCase();

  const filteredGuards = guards.filter((guard) =>
    getPersonName(guard, "").toLowerCase().includes(query) ||
    (guard.guardId || "").toLowerCase().includes(query) ||
    (guard.dutyStation || "").toLowerCase().includes(query) ||
    (guard.position || "").toLowerCase().includes(query)
  );

  const filteredStaff = staff.filter((member) =>
    (member.name || "").toLowerCase().includes(query) ||
    (member.email || "").toLowerCase().includes(query) ||
    (member.position || "").toLowerCase().includes(query) ||
    (member.role || "").toLowerCase().includes(query)
  );

  const showingGuards = viewType === "guard";
  const filteredRecords = showingGuards ? filteredGuards : filteredStaff;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 md:p-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 tracking-tight text-white">
            <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-600/20">
              {showingGuards ? (
                <Shield className="text-blue-500" size={28} />
              ) : (
                <Users className="text-blue-500" size={28} />
              )}
            </div>
            {showingGuards ? "Guard Updates" : "Staff Logs"}
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-14">
            {showingGuards
              ? "Select a guard to view their daily logs and reports."
              : "Select a staff member to view their submitted reports and activity logs."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="bg-[#1e293b] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          >
            <option value="guard">Guards</option>
            <option value="staff">Staff</option>
          </select>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={showingGuards ? "Search by name, ID, or station..." : "Search by name, role, or position..."}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            />
          </div>
        </div>
      </header>

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400 bg-[#1e293b]/50 rounded-2xl border border-red-900/30">
          <AlertTriangle size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={fetchRecords}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition"
          >
            Retry
          </button>
        </div>
      ) : loadingRecords ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-[#1e293b] rounded-2xl p-6 flex flex-col items-center border border-gray-800 animate-pulse">
              <div className="w-20 h-20 rounded-full bg-slate-700 mb-4"></div>
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-slate-800 rounded-full w-20"></div>
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-gray-800 border-dashed">
          <UserX size={64} className="mb-4 opacity-20" />
          <p className="text-lg">No {showingGuards ? "guards" : "staff"} found.</p>
          {search && <p className="text-sm">Try adjusting your search terms.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredRecords.map((record) => {
            const name = getPersonName(record);
            const isActive = showingGuards ? record.status === "Active" : record.status === "active";

            return (
              <div
                key={record._id}
                onClick={() => navigate(`/admin/AdminGuardUpdates2/${record._id}?type=${viewType}`)}
                className="group relative bg-[#1e293b] rounded-2xl p-6 flex flex-col items-center text-center border border-gray-700 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 group-hover:border-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-colors">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#1e293b] ${
                      isActive ? "bg-emerald-500" : "bg-slate-500"
                    }`}
                    title={record.status}
                  ></span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition truncate w-full mb-1">
                  {name}
                </h3>

                <div className="flex items-center gap-1 text-xs text-white mb-1 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                  <Hash size={10} /> {showingGuards ? record.guardId || "N/A" : record.role || "Staff"}
                </div>

                <div className="mt-3 w-full space-y-2">
                  <div className="text-xs text-white truncate">
                    {record.position || (showingGuards ? "Security Guard" : "Staff")}
                  </div>
                </div>

                <div
                  className={`mt-4 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}
                >
                  {record.status || "Unknown"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
