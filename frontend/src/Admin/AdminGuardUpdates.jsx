import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, UserX, AlertTriangle, Users, CalendarDays, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

const api = import.meta.env.VITE_API_URL;

const CardAvatar = ({ imageSrc, name }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = Boolean(imageSrc) && !imageFailed;

  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 group-hover:border-blue-500 overflow-hidden shadow-lg transition-colors">
      {shouldShowImage ? (
        <img
          src={imageSrc}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default function AdminGuardUpdates() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
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

      const [guardsResponse, staffResponse, logbookResponse, staffReportsResponse] = await Promise.all([
        fetch(`${api}/api/guards`, { credentials: "include" }),
        fetch(`${api}/api/auth/users`, { credentials: "include" }),
        fetch(`${api}/api/logbook`, { credentials: "include" }),
        fetch(`${api}/api/admin-reports`, { credentials: "include" }),
      ]);

      if (!guardsResponse.ok || !staffResponse.ok || !logbookResponse.ok || !staffReportsResponse.ok) {
        setError("Failed to load updates data.");
        return;
      }

      const [guardsData, staffData, logbookData, staffReportsData] = await Promise.all([
        guardsResponse.json(),
        staffResponse.json(),
        logbookResponse.json(),
        staffReportsResponse.json(),
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

      const reports = Array.isArray(staffReportsData) ? staffReportsData : [];
      const staffActivityMap = new Map();

      reports.forEach((report) => {
        const createdBy = report?.createdBy;
        const staffId =
          createdBy?._id ||
          createdBy?.id ||
          createdBy ||
          "";

        if (!staffId) return;

        const reportCreatedAt = new Date(report?.reportDate || report?.createdAt || 0).getTime();
        if (!Number.isFinite(reportCreatedAt)) return;

        const key = String(staffId);
        const current = staffActivityMap.get(key) || {
          _id: key,
          reportCount: 0,
          latestLogAt: 0,
          reports: [],
        };

        current.reportCount += 1;
        current.latestLogAt = Math.max(current.latestLogAt, reportCreatedAt);
        current.reports.push(report);
        const source = createdBy || {};

        current.firstName = source.firstName || current.firstName || "";
        current.lastName = source.lastName || current.lastName || "";
        current.name = source.name || current.name || "";
        current.fullName = source.fullName || current.fullName || "";
        current.email = source.email || current.email || "";
        current.position = source.position || current.position || "";
        current.role = source.role || current.role || "Staff";
        current.photo = source.photo || source.profilePhoto || source.avatar || current.photo || "";
        current.createdAt = source.createdAt || current.createdAt || report.createdAt;

        staffActivityMap.set(key, current);
      });

      const enrichedStaff = Array.from(staffActivityMap.values())
        .map((member) => {
          const displayName = getPersonName(member, member.name || "Unknown Staff");
          return {
            ...member,
            displayName,
            position: member.position || member.role || "Staff",
          };
        })
        .sort((a, b) => {
          if (b.latestLogAt !== a.latestLogAt) {
            return b.latestLogAt - a.latestLogAt;
          }
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

      setGuards(sortedGuards);
      setStaff(enrichedStaff);
    } catch (fetchError) {
      console.error("Error fetching updates data:", fetchError);
      setError("Network error. Please try again.");
    } finally {
      setLoadingRecords(false);
    }
  };

  const query = search.toLowerCase();
  const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const toRecordDate = (record) => {
    const rawDate = showingGuards
      ? (record.latestLogAt ? new Date(record.latestLogAt) : new Date(record.createdAt || 0))
      : (record.latestLogAt ? new Date(record.latestLogAt) : new Date(record.createdAt || 0));
    if (Number.isNaN(rawDate.getTime())) return null;
    rawDate.setHours(0, 0, 0, 0);
    return rawDate;
  };

  const dateFromObj = dateRange.from ? (() => { const d = new Date(dateRange.from); d.setHours(0, 0, 0, 0); return d; })() : null;
  const dateToObj = dateRange.to ? (() => { const d = new Date(dateRange.to); d.setHours(0, 0, 0, 0); return d; })() : null;

  const filteredGuards = guards.filter((guard) =>
    getPersonName(guard, "").toLowerCase().includes(query) ||
    (guard.guardId || "").toLowerCase().includes(query) ||
    (guard.dutyStation || "").toLowerCase().includes(query) ||
    (guard.position || "").toLowerCase().includes(query)
  );

  const filteredStaff = staff.filter((member) =>
    getPersonName(member, member.displayName || "").toLowerCase().includes(query) ||
    (member.displayName || "").toLowerCase().includes(query) ||
    (member.name || "").toLowerCase().includes(query) ||
    (member.email || "").toLowerCase().includes(query) ||
    (member.position || "").toLowerCase().includes(query) ||
    (member.role || "").toLowerCase().includes(query)
  );

  const showingGuards = viewType === "guard";
  const baseRecords = showingGuards ? filteredGuards : filteredStaff;

  const categoryOptions = React.useMemo(() => {
    const values = showingGuards
      ? guards.map((guard) => guard.position).filter(Boolean)
      : staff.map((member) => member.role).filter(Boolean);
    return ["All", ...Array.from(new Set(values))];
  }, [guards, showingGuards, staff]);

  const filteredRecords = baseRecords.filter((record) => {
    const categoryValue = showingGuards ? (record.position || "") : (record.role || "");
    if (categoryFilter !== "All" && categoryValue !== categoryFilter) {
      return false;
    }

    if (dateFromObj || dateToObj) {
      const recordDate = toRecordDate(record);
      if (!recordDate) return false;
      if (dateFromObj && recordDate < dateFromObj) return false;
      if (dateToObj && recordDate > dateToObj) return false;
    }

    return true;
  });

  const getCardImageSrc = (record) =>
    record?.photo ||
    record?.photoUrl ||
    record?.avatar ||
    record?.imageUrl ||
    record?.createdBy?.photo ||
    record?.createdBy?.photoUrl ||
    record?.createdBy?.avatar ||
    "";

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
            onChange={(e) => {
              setViewType(e.target.value);
              setCategoryFilter("All");
            }}
            className="bg-[#1e293b] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          >
            <option value="guard">Guards</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#1e293b] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          >
            <option value="All">All Categories</option>
            {categoryOptions
              .filter((option) => option !== "All")
              .map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </select>

           
            <div className="flex items-center gap-3">
              <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />
              {(dateRange.from || dateRange.to) && (
                <button
                  type="button"
                  onClick={() => setDateRange({ from: null, to: null })}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700/60 border border-slate-700/50"
                >
                  Clear
                </button>
              )}
            </div>

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
            const imageSrc = getCardImageSrc(record);
            return (
              <div
                key={record._id}
                onClick={() => navigate(`/admin/AdminGuardUpdates2/${record._id}?type=${viewType}`)}
                className="group relative bg-[#1e293b] rounded-2xl p-6 flex flex-col items-center text-center border border-gray-700 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative mb-4">
                  <CardAvatar imageSrc={imageSrc} name={name} />
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition truncate w-full mb-1">
                  {showingGuards ? name : record.displayName || name}
                </h3>

                <div className="mt-3 w-full space-y-2">
                  <div className="text-xs text-white truncate">
                    {record.position || (showingGuards ? "Security Guard" : record.role || "Staff")}
                  </div>
                  {!showingGuards && (
                    <div className="text-[11px] text-slate-300">
                      Reports: <span className="font-semibold text-white">{record.reportCount || 0}</span>
                    </div>
                  )}
                </div>

                {showingGuards && (
                  <div
                    className={`mt-4 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}
                  >
                    {record.status || "Unknown"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 36px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #111827;
    margin: 0;
  }
  .rdp-caption_label { color: #f8fafc; font-weight: 700; }
  .rdp-weekday { color: #ffffff; font-size: 0.75rem; text-transform: uppercase; }
  .rdp-day { color: #f8fafc; }
  .rdp-day_button { color: #f8fafc; }
  .rdp-button_previous, .rdp-button_next, .rdp-nav_button { color: #e2e8f0; }
  .rdp-day:hover:not([disabled]) { background-color: #1e293b; border-radius: 8px; }
  .rdp-selected .rdp-day_button,
  .rdp-range_start .rdp-day_button,
  .rdp-range_end .rdp-day_button { background-color: #2563eb; color: #ffffff; border-radius: 8px; font-weight: 700; }
  .rdp-range_middle .rdp-day_button { background-color: rgba(59,130,246,0.35); color: #ffffff; border-radius: 0; font-weight: 600; }
  .rdp-day_button:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
`;

function DateRangeFilter({ dateRange, setDateRange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <style>{datePickerStyles}</style>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition ${
          dateRange.from
            ? "border-blue-500/50 bg-blue-500/10 text-white"
            : "border-slate-700 bg-[#0f172a] text-slate-400 hover:border-slate-600"
        }`}
      >
        <span className="flex items-center gap-2">
          <CalendarDays className={dateRange.from ? "text-blue-400" : "text-slate-500"} size={17} />
          {dateRange.from
            ? dateRange.to
              ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
              : format(dateRange.from, "MMM d, yyyy")
            : "Date Range"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[80vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#1e293b] p-4 shadow-2xl shadow-blue-900/40 z-[9999]">
          <DayPicker
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            className="text-sm w-full"
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-700 mt-2">
            <button
              type="button"
              onClick={() => { setDateRange({ from: null, to: null }); setIsOpen(false); }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition rounded hover:bg-slate-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

