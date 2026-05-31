import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { eachDayOfInterval, format } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Clock,
  Filter,
  FileText,
  X,
  XCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-day-picker/dist/style.css";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";

const api = import.meta.env.VITE_API_URL;

const LEAVE_TYPE_OPTIONS = {
  default: ["Sick Leave", "Vacation Leave"],
  Male: ["Sick Leave", "Vacation Leave", "Paternity Leave"],
  Female: ["Sick Leave", "Vacation Leave", "Maternity Leave"],
};

const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 34px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #0f172a;
    margin: 0;
  }
  .rdp-caption_label {
    font-weight: 700;
    color: #f8fafc;
  }
  .rdp-weekday {
    color: #94a3b8;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
  .rdp-day {
    color: #cbd5e1;
  }
  .rdp-day_button {
    color: #cbd5e1;
  }
  .rdp-button_previous,
  .rdp-button_next,
  .rdp-nav_button {
    color: #94a3b8;
  }
  .rdp-day:hover:not([disabled]) {
    background-color: #1e293b;
    border-radius: 8px;
  }
  .rdp-selected .rdp-day_button,
  .rdp-range_start .rdp-day_button,
  .rdp-range_end .rdp-day_button {
    background-color: #2563eb;
    color: #ffffff;
    border-radius: 8px;
    font-weight: 700;
  }
  .rdp-range_middle .rdp-day_button {
    background-color: rgba(37, 99, 235, 0.30);
    color: #dbeafe;
    border-radius: 0;
    font-weight: 600;
  }
  .rdp-range_start .rdp-day_button,
  .rdp-range_end .rdp-day_button {
    background-color: #2563eb;
    color: #ffffff;
  }
  .rdp-day_button:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }
  .rdp-day_disabled,
  .rdp-day_disabled .rdp-day_button {
    color: #475569;
    text-decoration: line-through;
    opacity: 0.4;
    background-color: transparent;
  }
  .rdp-day_scheduled {
    position: relative;
    box-shadow: inset 0 -3px 0 0 rgba(251, 191, 36, 0.95);
  }
`;

const toDateOnly = (value) => (typeof value === "string" ? value.slice(0, 10) : format(value, "yyyy-MM-dd"));
const toLocalDate = (value) => new Date(`${value}T00:00:00`);
const normalizeDateKey = (value) => (value ? String(value).slice(0, 10) : "");
const formatWordDate = (value) => {
  const dateKey = normalizeDateKey(value);
  if (!dateKey) return "N/A";
  return format(toLocalDate(dateKey), "MMMM d, yyyy");
};
const formatWordDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "MMMM d, yyyy");
};

const buildRangeDates = (range) => {
  if (!range?.from || !range?.to) return [];
  return eachDayOfInterval({ start: range.from, end: range.to }).map((day) => format(day, "yyyy-MM-dd"));
};

const statusClassMap = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Declined: "bg-red-500/10 text-red-400 border-red-500/20",
  Revoked: "bg-slate-500/10 text-slate-300 border-slate-500/20",
};

const statusIconMap = {
  Pending: Clock,
  Approved: CheckCircle,
  Declined: XCircle,
  Revoked: XCircle,
};

export default function GuardLeaves() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [scheduleDates, setScheduleDates] = useState([]);
  const [leaveRange, setLeaveRange] = useState();
  const [excludedDates, setExcludedDates] = useState([]);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [historyDateRange, setHistoryDateRange] = useState({ from: undefined, to: undefined });
  const [historyLeaveTypeFilter, setHistoryLeaveTypeFilter] = useState("");

  const availableLeaveTypes = useMemo(
    () => LEAVE_TYPE_OPTIONS[user?.sex] || LEAVE_TYPE_OPTIONS.default,
    [user]
  );
  const isStaffUser = user?.role === "Admin" || user?.role === "Subadmin";

  const fetchData = useCallback(async (personId) => {
    setLoadingPage(true);
    try {
      const leaveRes = await fetch(`${api}/api/leaves/my`, { credentials: "include" });
      const scheduleRes = isStaffUser
        ? null
        : await fetch(`${api}/api/schedules/guard/${personId}`, { credentials: "include" });

      const leaveData = await leaveRes.json();
      const scheduleData = scheduleRes ? await scheduleRes.json() : [];

      if (!leaveRes.ok) throw new Error(leaveData.message || "Failed to load leave requests.");
      if (scheduleRes && !scheduleRes.ok) throw new Error(scheduleData.message || "Failed to load schedules.");

      setLeaveRequests(Array.isArray(leaveData) ? leaveData : []);
      setScheduleDates(
        Array.isArray(scheduleData)
          ? [...new Set(scheduleData.map((schedule) => schedule.timeIn?.slice(0, 10)).filter(Boolean))]
          : []
      );
    } catch (error) {
      console.error("Error fetching leave data:", error);
      toast.error(error.message || "Failed to load leave data.");
    } finally {
      setLoadingPage(false);
    }
  }, [isStaffUser]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
      return;
    }

    if (user?._id) {
      document.title = isStaffUser ? "Leaves | JPM Security" : "Leave Request | JPM Security";
      fetchData(user._id);
    }
  }, [user, loading, navigate, isStaffUser, fetchData]);

  const reservedLeaveDates = useMemo(() => {
    const reserved = leaveRequests
      .filter((request) => ["Pending", "Approved"].includes(request.status))
      .flatMap((request) => request.dates || []);
    return [...new Set(reserved)].sort();
  }, [leaveRequests]);

  const revokedLeaveDateKeys = useMemo(() => {
    const revokedDates = leaveRequests
      .filter((request) => request.status === "Revoked")
      .flatMap((request) => request.dates || [])
      .map(normalizeDateKey)
      .filter(Boolean);
    return new Set(revokedDates);
  }, [leaveRequests]);

  const historyLeaveTypes = useMemo(() => {
    const types = leaveRequests
      .map((request) => request.leaveType)
      .filter(Boolean);
    return [...new Set(types)].sort();
  }, [leaveRequests]);

  const filteredLeaveRequests = useMemo(() => {
    const fromKey = historyDateRange.from ? toDateOnly(historyDateRange.from) : "";
    const toKey = historyDateRange.to ? toDateOnly(historyDateRange.to) : fromKey;

    return leaveRequests.filter((request) => {
      if (historyLeaveTypeFilter && request.leaveType !== historyLeaveTypeFilter) {
        return false;
      }

      if (fromKey) {
        const requestDates = (request.dates || []).map(normalizeDateKey);
        const startDate = normalizeDateKey(request.startDate || requestDates[0]);
        const endDate = normalizeDateKey(request.endDate || requestDates[requestDates.length - 1]);
        const matchesExplicitDate = requestDates.some((date) => date >= fromKey && date <= toKey);
        const overlapsRange =
          startDate &&
          endDate &&
          startDate <= toKey &&
          endDate >= fromKey;

        if (!matchesExplicitDate && !overlapsRange) {
          return false;
        }
      }

      return true;
    });
  }, [historyDateRange.from, historyDateRange.to, historyLeaveTypeFilter, leaveRequests]);

  const hasHistoryFilters = Boolean(historyDateRange.from || historyLeaveTypeFilter);

  const clearHistoryFilters = () => {
    setHistoryDateRange({ from: undefined, to: undefined });
    setHistoryLeaveTypeFilter("");
  };

  const rangeDates = useMemo(() => buildRangeDates(leaveRange), [leaveRange]);

  useEffect(() => {
    setExcludedDates((prev) => prev.filter((date) => rangeDates.includes(date)));
  }, [rangeDates]);

  const includedDates = useMemo(
    () => rangeDates.filter((date) => !excludedDates.includes(date)),
    [excludedDates, rangeDates]
  );

  const disabledDates = useMemo(
    () => reservedLeaveDates.map(toLocalDate),
    [reservedLeaveDates]
  );

  const scheduledDates = useMemo(
    () =>
      scheduleDates
        .filter((date) => !revokedLeaveDateKeys.has(normalizeDateKey(date)))
        .map(toLocalDate),
    [revokedLeaveDateKeys, scheduleDates]
  );

  useEffect(() => {
    if (!availableLeaveTypes.includes(leaveType)) {
      setLeaveType(availableLeaveTypes[0] || "");
    }
  }, [availableLeaveTypes, leaveType]);

  const toggleExcludedDate = (date) => {
    if (!rangeDates.includes(date)) return;

    setExcludedDates((prev) =>
      prev.includes(date)
        ? prev.filter((value) => value !== date)
        : [...prev, date].sort()
    );
  };

  const resetForm = () => {
    setLeaveRange(undefined);
    setExcludedDates([]);
    setLeaveType(availableLeaveTypes[0] || "");
    setReason("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!leaveRange?.from || !leaveRange?.to) {
      toast.error("Select a leave start date and end date.");
      return;
    }

    if (includedDates.length === 0) {
      toast.error("At least one leave date must remain in the selected range.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Reason for leave is required.");
      return;
    }

    if (!leaveType) {
      toast.error("Type of leave is required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${api}/api/leaves`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: toDateOnly(leaveRange.from),
          endDate: toDateOnly(leaveRange.to),
          excludedDates,
          dates: includedDates,
          leaveType,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit leave request.");

      toast.success("Leave request submitted.");
      resetForm();
      await fetchData(user._id);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error(error.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingPage) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-6">
      <style>{datePickerStyles}</style>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-600/20">
              <CalendarDays className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{isStaffUser ? "Leaves" : "Leave Request"}</h1>
              <p className="text-sm text-slate-400">Request new leave days and track your approval status.</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition self-start sm:self-center cursor-pointer"
          >
            <CalendarDays size={18} /> Request Leave
          </button>
        </div>

        {/* My Leave History (Main Content) */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl">
          <div className="flex flex-col gap-5 mb-6">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-400" size={20} />
              <div>
                <h2 className="text-lg font-semibold text-white">My Leave History</h2>
                <p className="text-sm text-slate-400">Track approval status and requested dates.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Filter size={14} /> Leave Date Range
                </span>
                <GuardLeaveDateRangeFilter
                  dateRange={historyDateRange}
                  setDateRange={(range) => setHistoryDateRange(range || { from: undefined, to: undefined })}
                />
              </div>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Type of Leave</span>
                <select
                  value={historyLeaveTypeFilter}
                  onChange={(event) => setHistoryLeaveTypeFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All leave types</option>
                  {historyLeaveTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              {hasHistoryFilters ? (
                <button
                  type="button"
                  onClick={clearHistoryFilters}
                  className="self-end rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              <AlertCircle size={42} className="mb-3 opacity-30" />
              <p>No leave requests yet.</p>
            </div>
          ) : filteredLeaveRequests.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              <AlertCircle size={42} className="mb-3 opacity-30" />
              <p>No leave requests match the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeaveRequests.map((request) => {
                const StatusIcon = statusIconMap[request.status] || Clock;
                return (
                  <div key={request._id} className="bg-slate-900/40 border border-slate-700 rounded-2xl p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Requested on {formatWordDateTime(request.createdAt)}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                          {request.leaveType || "Unspecified"}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">{request.reason}</p>
                      </div>
                      <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${statusClassMap[request.status] || statusClassMap.Pending}`}>
                        <StatusIcon size={14} />
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <SummaryTile label="Range Start" value={formatWordDate(request.startDate || request.dates?.[0])} compact />
                      <SummaryTile label="Range End" value={formatWordDate(request.endDate || request.dates?.[request.dates.length - 1])} compact />
                      <SummaryTile label="Included Days" value={`${request.dates?.length || 0}`} compact />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(request.dates || []).map((date) => (
                        <span key={date} className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {formatWordDate(date)}
                        </span>
                      ))}
                    </div>

                    {request.excludedDates?.length > 0 && (
                      <div className="text-sm text-slate-400">
                        Excluded dates:{" "}
                        <span className="text-slate-200">
                          {request.excludedDates.map(formatWordDate).join(", ")}
                        </span>
                      </div>
                    )}

                    {request.reviewRemarks ? (
                      <div className="text-sm text-slate-400 border-t border-slate-700 pt-3">
                        Review note: <span className="text-slate-200">{request.reviewRemarks}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Leave Request Modal (Identical to Admin leaves request modal style) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#0f172a] shadow-2xl shadow-black/50">
              <div className="sticky top-0 z-10 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(15,23,42,0.98))] px-6 py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">New Leave Request</div>
                  <h3 className="mt-1 text-xl font-semibold text-white">Submit Leave Request</h3>
                  <p className="mt-1 text-sm text-slate-400">Pick a date range, remove dates if needed, then submit.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={async (e) => { await handleSubmit(e); if (!submitting) setShowCreateModal(false); }} className="grid gap-6 xl:grid-cols-[340px_1fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-700 bg-[#1e293b] p-3 flex flex-col items-center">
                      <DayPicker
                        mode="range"
                        selected={leaveRange}
                        onSelect={setLeaveRange}
                        disabled={disabledDates}
                        modifiers={{ scheduled: scheduledDates }}
                        modifiersClassNames={{ scheduled: "rdp-day_scheduled" }}
                      />
                      <p className="mt-3 text-[11px] text-slate-400 text-center">
                        Dates with existing leave or duty schedules are disabled.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <SummaryTile label="Range Start" value={leaveRange?.from ? format(leaveRange.from, "MMMM d, yyyy") : "Not set"} compact />
                      <SummaryTile label="Range End" value={leaveRange?.to ? format(leaveRange.to, "MMMM d, yyyy") : "Not set"} compact />
                      <SummaryTile label="Included" value={`${includedDates.length} day${includedDates.length === 1 ? "" : "s"}`} compact />
                      <SummaryTile label="Excluded" value={`${excludedDates.length} day${excludedDates.length === 1 ? "" : "s"}`} compact />
                    </div>

                    <div className="rounded-xl border border-gray-700 bg-[#1e293b] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Included Leave Dates</span>
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">{includedDates.length} active</span>
                      </div>
                      {includedDates.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {includedDates.map((date) => (
                            <button key={date} type="button" onClick={() => toggleExcludedDate(date)}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-red-400/50 hover:text-red-300 cursor-pointer">
                              {formatWordDate(date)}<X size={12} />
                            </button>
                          ))}
                        </div>
                      ) : <p className="text-sm text-slate-500">No active leave dates selected.</p>}
                      {excludedDates.length > 0 && (
                        <div className="mt-5 border-t border-gray-700 pt-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Excluded Dates</div>
                           <div className="flex flex-wrap gap-2">
                            {excludedDates.map((date) => (
                              <button key={date} type="button" onClick={() => toggleExcludedDate(date)}
                                className="inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 cursor-pointer">
                                {formatWordDate(date)}<CheckCircle size={12} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Type of Leave</label>
                      <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} required
                        className="w-full rounded-lg border border-slate-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500">
                        {availableLeaveTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</label>
                      <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5}
                        placeholder="Provide the reason for this leave request."
                        className="w-full resize-none rounded-xl border border-slate-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                        className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer">Cancel</button>
                      <button type="submit" disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 cursor-pointer">
                        {submitting ? <Clock className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        {submitting ? "Submitting..." : "Submit Request"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, compact = false }) {
  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-900/60 ${compact ? "p-3" : "p-4"}`}>
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`mt-2 font-semibold text-slate-100 ${compact ? "text-sm" : "text-base"}`}>{value}</div>
    </div>
  );
}

function GuardLeaveDateRangeFilter({ dateRange, setDateRange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex min-h-[46px] w-full items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:bg-[#1e293b] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={16} className="shrink-0 text-white" />
          <span className="truncate">
            {dateRange.from ? (
              <>
                {format(dateRange.from, "MMM d")} - {dateRange.to ? format(dateRange.to, "MMM d") : "..."}
              </>
            ) : (
              "Select date range"
            )}
          </span>
        </span>
        <ChevronDown size={16} className="shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-700 bg-[#1e293b] p-3 shadow-2xl">
          <DayPicker
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            className="text-sm"
          />
          <div className="mt-2 flex justify-end gap-2 border-t border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs text-gray-400 transition hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white transition hover:bg-blue-500 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
