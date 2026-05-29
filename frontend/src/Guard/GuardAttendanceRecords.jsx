import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock,
  FileDown,
  FileImage,
  Filter,
  Route,
  MapPin,
  RefreshCcw,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";
import { Dialog, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

function GuardAttendanceRecords() {
  const api = import.meta.env.VITE_API_URL;
  const { user: guard, loading } = useAuth();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);

  // ── DTR download states ────────────────────────────────────
  const [dtrModalOpen, setDtrModalOpen] = useState(false);
  const [reportMode, setReportMode] = useState("cutoff");
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [reportCutoff, setReportCutoff] = useState("first-half");
  const [reportDateRange, setReportDateRange] = useState({ from: null, to: null });
  const [dtrSubmitting, setDtrSubmitting] = useState(false);

  const handleReportRangeSelect = (range) => {
    if (!range) {
      setReportDateRange({ from: null, to: null });
      return;
    }
    // Limit range to same month
    if (range.from && range.to) {
      const isSameMonth =
        range.from.getFullYear() === range.to.getFullYear() &&
        range.from.getMonth() === range.to.getMonth();
      if (!isSameMonth) {
        setReportDateRange({ from: range.from, to: range.from });
        return;
      }
    }
    setReportDateRange(range);
  };

  const reportCoverage = useMemo(() => {
    if (reportMode === "cutoff") {
      const year = reportYear;
      const monthIdx = Number(reportMonth) - 1;
      const dummyDate = new Date(year, monthIdx, 1);
      const monthLabel = format(dummyDate, "MMMM yyyy");

      if (reportCutoff === "first-half") {
        return {
          start: `01 ${monthLabel.slice(0, 3)}`,
          end: `15 ${monthLabel.slice(0, 3)}`,
          fromStr: `${year}-${reportMonth}-01`,
          toStr: `${year}-${reportMonth}-15`
        };
      } else if (reportCutoff === "second-half") {
        const lastDay = new Date(year, monthIdx + 1, 0).getDate();
        return {
          start: `16 ${monthLabel.slice(0, 3)}`,
          end: `${lastDay} ${monthLabel.slice(0, 3)}`,
          fromStr: `${year}-${reportMonth}-16`,
          toStr: `${year}-${reportMonth}-${lastDay}`
        };
      } else {
        const lastDay = new Date(year, monthIdx + 1, 0).getDate();
        return {
          start: `01 ${monthLabel.slice(0, 3)}`,
          end: `${lastDay} ${monthLabel.slice(0, 3)}`,
          fromStr: `${year}-${reportMonth}-01`,
          toStr: `${year}-${reportMonth}-${lastDay}`
        };
      }
    } else {
      const { from, to } = reportDateRange;
      if (!from) return null;
      const fromStr = format(from, "yyyy-MM-dd");
      const toStr = to ? format(to, "yyyy-MM-dd") : fromStr;
      return {
        start: format(from, "dd MMM"),
        end: to ? format(to, "dd MMM") : format(from, "dd MMM"),
        fromStr,
        toStr
      };
    }
  }, [reportMode, reportYear, reportMonth, reportCutoff, reportDateRange]);

  const handleConfirmDownload = async () => {
    if (!reportCoverage) return;
    setDtrSubmitting(true);
    try {
      // Use the staff-format DTR endpoint so the guard PDF matches the
      // premium Day | Time In | Time Out | Undertime | Hours layout.
      const url = `${api}/api/attendance/download-my-dtr?from=${reportCoverage.fromStr}&to=${reportCoverage.toStr}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No data found for the selected dates. Please select the correct date period.");
        }
        const errData = await response.json().catch(() => ({ message: "Failed to download PDF." }));
        throw new Error(errData.message || "Failed to download PDF.");
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const periodName = reportCoverage.fromStr === reportCoverage.toStr
        ? reportCoverage.fromStr
        : `${reportCoverage.fromStr}_to_${reportCoverage.toStr}`;
      a.download = `DTR_${getPersonName(guard, "Guard").replace(/\s+/g, "_")}_${periodName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success("DTR downloaded successfully!", { theme: "dark" });
      setDtrModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong while exporting.", { theme: "dark" });
    } finally {
      setDtrSubmitting(false);
    }
  };
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
      <style>{datePickerStyles}</style>
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
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => {
                setReportMode("cutoff");
                setReportYear(new Date().getFullYear());
                setReportMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
                setReportCutoff("first-half");
                setReportDateRange({ from: null, to: null });
                setDtrModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 transition flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-500/10 active:scale-[0.98]"
            >
              <FileDown size={18} />
              Export DTR
            </button>
            <div className="w-full sm:w-auto rounded-2xl border border-slate-700 bg-[#0f172a]/60 px-5 py-4 text-center md:min-w-44">
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

            {/* Date range */}
            <div className="relative pt-2 sm:col-span-2">
              <label className="absolute left-3 -top-2.5 z-10 bg-[#1e293b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2B7FFF] border border-[#2B7FFF]/25 rounded-md shadow-lg shadow-black/30">Date Range</label>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
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
                <div className="hidden text-center text-slate-500 sm:block">to</div>
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

      {/* ─── Export DTR Modal ─────────────────────────────────────────── */}
      <Transition appear show={dtrModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDtrModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] border border-slate-700 shadow-2xl shadow-blue-900/20 transition-all flex flex-col max-h-[90vh]">

                  {/* Header */}
                  <div className="p-6 pb-2 text-center shrink-0">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                      <FileDown className="text-blue-400" size={28} />
                    </div>
                    <Dialog.Title as="h3" className="text-xl font-bold text-white">Export My DTR</Dialog.Title>
                    <p className="text-sm text-slate-400 mt-2 px-4">
                      Select the date period for your Daily Time Record PDF.
                    </p>
                  </div>

                  {/* Period Picker */}
                  <div className="px-4 sm:px-6 py-3 overflow-y-auto">
                    <div className="space-y-4 rounded-xl border border-slate-700 bg-[#0f172a] p-4">

                      {/* Mode toggle */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Download Mode</label>
                        <div className="flex gap-2">
                          {["cutoff", "pick-dates"].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setReportMode(m)}
                              className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                reportMode === m
                                  ? "border-blue-500/50 bg-blue-500/10 text-white"
                                  : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                              }`}
                            >
                              {m === "cutoff" ? "Cut-off" : "Pick dates"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {reportMode === "cutoff" ? (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Year</label>
                              <select
                                value={reportYear}
                                onChange={e => setReportYear(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              >
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Month</label>
                              <select
                                value={reportMonth}
                                onChange={e => setReportMonth(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              >
                                {Array.from({ length: 12 }, (_, i) => {
                                  const mv = String(i + 1).padStart(2, "0");
                                  const ml = format(new Date(2026, i, 1), "MMMM");
                                  return <option key={mv} value={mv}>{ml}</option>;
                                })}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cut-off Period</label>
                            <div className="grid gap-3">
                              {[
                                { value: "first-half",  title: "1st to 15th day",        sub: "First cut-off of the month" },
                                { value: "second-half", title: "16th to last day",         sub: "Last cut-off of the month" },
                                { value: "whole-month", title: "Whole month",              sub: "Both cut-offs combined" },
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setReportCutoff(opt.value)}
                                  className={`rounded-xl border px-4 py-3 text-left transition ${
                                    reportCutoff === opt.value
                                      ? "border-blue-500/50 bg-blue-500/10 text-white"
                                      : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                                  }`}
                                >
                                  <div className="text-sm font-semibold">{opt.title}</div>
                                  <div className="mt-1 text-xs text-slate-400">{opt.sub}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pick Date Range</label>
                          <div className="rounded-xl border border-slate-700 bg-[#111827] p-3">
                            <DayPicker
                              mode="range"
                              selected={reportDateRange}
                              onSelect={handleReportRangeSelect}
                              className="text-sm"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">Date range must stay within one month only.</p>
                        </div>
                      )}

                      {reportCoverage && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Selected Coverage</span>
                          <span className="mt-1 block font-medium">{reportCoverage.start} — {reportCoverage.end}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 pt-4 flex gap-3 bg-[#1e293b] shrink-0 border-t border-slate-700/50 mt-2">
                    <button
                      onClick={() => setDtrModalOpen(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-sm font-medium transition active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDownload}
                      disabled={dtrSubmitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {dtrSubmitting
                        ? <><RefreshCcw className="animate-spin size-4" /> Generating...</>
                        : "Confirm Download"
                      }
                    </button>
                  </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <ToastContainer theme="dark" />
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
