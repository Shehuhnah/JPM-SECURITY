import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock,
  FileImage,
  Filter,
  Route,
  MapPin,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";

function GuardAttendanceRecords() {
  const api = import.meta.env.VITE_API_URL;
  const { user: guard, loading } = useAuth();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  // ── Filter state ────────────────────────────────────────────
  const [searchClient, setSearchClient] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterShiftType, setFilterShiftType] = useState("");

  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
    }
  }, [guard, loading, navigate]);

  useEffect(() => {
    document.title = "Attendance Records | JPM Security Agency";
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!guard?._id) return;

      setLoadingPage(true);
      setError("");

      try {
        const res = await fetch(`${api}/api/attendance/${guard._id}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load attendance records.");

        setRecords(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        console.error("Attendance records fetch failed:", err);
        setError(err.message || "Failed to load attendance records.");
      } finally {
        setLoadingPage(false);
      }
    };

    fetchRecords();
  }, [guard?._id, api]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.timeIn || 0) - new Date(a.timeIn || 0)),
    [records]
  );

  // ── Derived filter options ───────────────────────────────────
  const shiftTypes = useMemo(() => {
    const types = new Set();
    records.forEach((r) => { if (r.scheduleId?.shiftType) types.add(r.scheduleId.shiftType); });
    return [...types].sort();
  }, [records]);

  // ── Filtered records ─────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((record) => {
      // Client search
      if (searchClient.trim()) {
        const q = searchClient.trim().toLowerCase();
        const client = (record.scheduleId?.client || "").toLowerCase();
        if (!client.includes(q)) return false;
      }

      // Shift type
      if (filterShiftType && record.scheduleId?.shiftType !== filterShiftType) return false;

      // Date range — compare against the actual timeIn date
      if (filterDateFrom || filterDateTo) {
        const timeIn = record.timeIn ? new Date(record.timeIn) : null;
        if (!timeIn || Number.isNaN(timeIn.getTime())) return false;
        const recKey = timeIn.toISOString().slice(0, 10);
        if (filterDateFrom && recKey < filterDateFrom) return false;
        if (filterDateTo   && recKey > filterDateTo)   return false;
      }

      return true;
    });
  }, [sortedRecords, searchClient, filterShiftType, filterDateFrom, filterDateTo]);

  const hasActiveFilters = searchClient.trim() || filterShiftType || filterDateFrom || filterDateTo;
  const clearFilters = () => {
    setSearchClient("");
    setFilterShiftType("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Invalid time";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getTotalHours = (record) => {
    if (record?.workSummary?.totalHours) return `${record.workSummary.totalHours}h`;
    if (!record?.timeIn || !record?.timeOut) return "In progress";

    const start = new Date(record.timeIn);
    const end = new Date(record.timeOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "N/A";

    const diffMs = end - start;
    if (diffMs <= 0) return "0h 0m";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatDateRange = (startValue, endValue) => {
    if (!startValue || !endValue) return "N/A";
    return `${formatDate(startValue)} - ${formatDate(endValue)}`;
  };

  const formatTimeRange = (startValue, endValue) => {
    if (!startValue || !endValue) return "N/A";
    return `${formatTime(startValue)} - ${formatTime(endValue)}`;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-700 bg-[#1e293b]/70 p-6 shadow-xl backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-400">
                <CalendarDays size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Attendance Records</h1>
                <p className="text-sm text-slate-400">Review your time in and time out history.</p>
              </div>
            </div>
            <div className="text-sm text-slate-300">
              {getPersonName(guard, "Guard")} • ID: {guard?.guardId || "N/A"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-[#0f172a]/60 px-5 py-4 text-center md:min-w-44">
            <div className="text-xs uppercase tracking-widest text-slate-500">Total Records</div>
            <div className="mt-2 text-3xl font-black text-blue-400">
              {hasActiveFilters ? (
                <>
                  <span>{filteredRecords.length}</span>
                  <span className="ml-1 text-lg font-semibold text-slate-500">/ {sortedRecords.length}</span>
                </>
              ) : sortedRecords.length}
            </div>
            {hasActiveFilters && <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">Filtered</div>}
          </div>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700 bg-[#1e293b]/70 p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <Filter size={14} />
              Filters
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Client search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                placeholder="Search client…"
                className="w-full rounded-xl border border-slate-700 bg-[#0f172a] py-2.5 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Shift type */}
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={filterShiftType}
                onChange={(e) => setFilterShiftType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-[#0f172a] py-2.5 pl-8 pr-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="">All shift types</option>
                {shiftTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Date from */}
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#0f172a] py-2.5 pl-8 pr-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 [color-scheme:dark]"
                title="From date"
              />
              {!filterDateFrom && <span className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-sm text-slate-500"></span>}
            </div>

            {/* Date to */}
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={filterDateTo}
                min={filterDateFrom || undefined}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#0f172a] py-2.5 pl-8 pr-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 [color-scheme:dark]"
                title="To date"
              />
              {!filterDateTo && <span className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-sm text-slate-500"></span>}
            </div>
          </div>
        </div>

        {loadingPage && (
          <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 text-sm text-blue-300">
            Loading attendance records...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loadingPage && !error && sortedRecords.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-8 text-center text-slate-400">
            No attendance records found yet.
          </div>
        )}

        {!loadingPage && !error && sortedRecords.length > 0 && filteredRecords.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-8 text-center">
            <p className="text-slate-400">No records match the current filters.</p>
            <button onClick={clearFilters} className="mt-3 text-sm text-blue-400 hover:underline">Clear filters</button>
          </div>
        )}

        {!loadingPage && !error && filteredRecords.length > 0 && (
          <div className="grid gap-5">
            {filteredRecords.map((record) => (
              <div
                key={record._id}
                className="overflow-hidden rounded-[28px] border border-slate-700 bg-[#1e293b]/85 shadow-xl backdrop-blur-sm"
              >
                <div className="border-b border-slate-700/70 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-blue-950/20 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                          {record.scheduleId?.client || "Unassigned Client"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            record.status === "Off Duty"
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-white">
                        {record.scheduleId?.client || "Client"} Deployment Record
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Scheduled {formatDateRange(record.scheduleId?.timeIn, record.scheduleId?.timeOut)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
                      <div className="rounded-2xl border border-slate-700 bg-[#0f172a]/60 px-4 py-3 text-center">
                        <div className="text-[11px] uppercase tracking-widest text-slate-500">Scheduled Time</div>
                        <div className="mt-1 text-sm font-semibold text-white">
                          {formatTimeRange(record.scheduleId?.timeIn, record.scheduleId?.timeOut)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-700 bg-[#0f172a]/60 px-4 py-3 text-center">
                        <div className="text-[11px] uppercase tracking-widest text-slate-500">Worked Hours</div>
                        <div className="mt-1 text-sm font-semibold text-blue-300">{getTotalHours(record)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1.2fr_0.9fr]">
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-slate-700 bg-[#0f172a]/50 p-5">
                      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                        Deployment Details
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoCard
                          icon={<Building2 size={16} />}
                          label="Client"
                          value={record.scheduleId?.client || "Unassigned Client"}
                        />
                        <InfoCard
                          icon={<Shield size={16} />}
                          label="Shift Type"
                          value={record.scheduleId?.shiftType || "No shift type"}
                        />
                        <InfoCard
                          icon={<CalendarDays size={16} />}
                          label="Date Range"
                          value={formatDateRange(record.scheduleId?.timeIn, record.scheduleId?.timeOut)}
                        />
                        <InfoCard
                          icon={<Clock size={16} />}
                          label="Time Range"
                          value={formatTimeRange(record.scheduleId?.timeIn, record.scheduleId?.timeOut)}
                        />
                      </div>
                      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                          <MapPin size={14} />
                          Client Address
                        </div>
                        <div className="text-sm leading-6 text-slate-200">
                          {record.scheduleId?.deploymentLocation || "No client address available"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-700 bg-[#0f172a]/50 p-5">
                      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                        Actual Attendance
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoCard icon={<CalendarDays size={16} />} label="Attendance Date" value={formatDate(record.timeIn)} />
                        <InfoCard icon={<Clock size={16} />} label="Actual Time In" value={formatTime(record.timeIn)} />
                        <InfoCard icon={<Clock size={16} />} label="Actual Time Out" value={formatTime(record.timeOut)} />
                        <InfoCard icon={<Shield size={16} />} label="Status" value={record.status || "N/A"} accent />
                      </div>
                      {record.remarks ? (
                        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                            Attendance Remarks
                          </div>
                          <div className="text-sm leading-6 text-amber-100">{record.remarks}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-3xl border border-slate-700 bg-[#0f172a]/50 p-5">
                      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                        Logged Location
                      </h3>
                      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                        <div className="text-sm leading-6 text-slate-200">
                          {record.location?.address || "No captured location"}
                        </div>
                        {record.location?.latitude !== undefined && record.location?.longitude !== undefined && (
                          <div className="mt-3 text-xs text-slate-500">
                            {record.location.latitude}, {record.location.longitude}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-700 bg-[#0f172a]/50 p-5">
                      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                        Attendance Evidence
                      </h3>
                      {record.photo || record.timeOutPhoto ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {record.photo ? (
                            <button
                              onClick={() => setPreviewImage({ src: record.photo, label: "Time In Photo" })}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-blue-500 hover:text-white"
                            >
                              <FileImage size={18} />
                              View Time In Photo
                            </button>
                          ) : null}
                          {record.timeOutPhoto ? (
                            <button
                              onClick={() => setPreviewImage({ src: record.timeOutPhoto, label: "Time Out Photo" })}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:text-white"
                            >
                              <FileImage size={18} />
                              View Time Out Photo
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-500">
                          No photo evidence available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-[#0f172a] p-3">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/80 p-2 text-white transition hover:bg-red-600"
            >
              <X size={18} />
            </button>
            <div className="mb-3 px-2 pt-2 text-sm font-semibold text-slate-200">{previewImage.label}</div>
            <img src={previewImage.src} alt={previewImage.label || "Attendance evidence"} className="max-h-[85vh] w-full rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <div className={`text-sm font-medium leading-6 ${accent ? "text-blue-300" : "text-white"}`}>{value}</div>
    </div>
  );
}

export default GuardAttendanceRecords;
