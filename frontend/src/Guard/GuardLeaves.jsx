import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { eachDayOfInterval, format } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
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
    --rdp-cell-size: 38px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #1e293b;
    margin: 0;
  }
  .rdp-day_selected:not([disabled]),
  .rdp-day_range_start:not([disabled]),
  .rdp-day_range_end:not([disabled]) {
    background-color: #2563eb;
    color: white;
  }
  .rdp-day_range_middle {
    background-color: rgba(37, 99, 235, 0.18);
    color: #dbeafe;
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
  .rdp-day_disabled {
    color: #64748b;
    text-decoration: line-through;
  }
  .rdp-day_scheduled {
    position: relative;
    box-shadow: inset 0 -3px 0 0 rgba(251, 191, 36, 0.95);
  }
`;

const toDateOnly = (value) => (typeof value === "string" ? value.slice(0, 10) : format(value, "yyyy-MM-dd"));
const toLocalDate = (value) => new Date(`${value}T00:00:00`);

const buildRangeDates = (range) => {
  if (!range?.from || !range?.to) return [];
  return eachDayOfInterval({ start: range.from, end: range.to }).map((day) => format(day, "yyyy-MM-dd"));
};

const statusClassMap = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Declined: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusIconMap = {
  Pending: Clock,
  Approved: CheckCircle,
  Declined: XCircle,
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

  const availableLeaveTypes = useMemo(
    () => LEAVE_TYPE_OPTIONS[user?.sex] || LEAVE_TYPE_OPTIONS.default,
    [user]
  );

  const fetchData = async (guardId) => {
    setLoadingPage(true);
    try {
      const [leaveRes, scheduleRes] = await Promise.all([
        fetch(`${api}/api/leaves/my`, { credentials: "include" }),
        fetch(`${api}/api/schedules/guard/${guardId}`, { credentials: "include" }),
      ]);

      const [leaveData, scheduleData] = await Promise.all([
        leaveRes.json(),
        scheduleRes.json(),
      ]);

      if (!leaveRes.ok) throw new Error(leaveData.message || "Failed to load leave requests.");
      if (!scheduleRes.ok) throw new Error(scheduleData.message || "Failed to load schedules.");

      setLeaveRequests(Array.isArray(leaveData) ? leaveData : []);
      setScheduleDates(
        Array.isArray(scheduleData)
          ? [...new Set(scheduleData.map((schedule) => schedule.timeIn?.slice(0, 10)).filter(Boolean))]
          : []
      );
    } catch (error) {
      console.error("Error fetching guard leave data:", error);
      toast.error(error.message || "Failed to load leave data.");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/guard/login");
      return;
    }

    if (user?._id) {
      document.title = "Leave Request | JPM Security";
      fetchData(user._id);
    }
  }, [user, loading, navigate]);

  const reservedLeaveDates = useMemo(() => {
    const reserved = leaveRequests
      .filter((request) => ["Pending", "Approved"].includes(request.status))
      .flatMap((request) => request.dates || []);
    return [...new Set(reserved)].sort();
  }, [leaveRequests]);

  const rangeDates = useMemo(() => buildRangeDates(leaveRange), [leaveRange]);

  useEffect(() => {
    setExcludedDates((prev) => prev.filter((date) => rangeDates.includes(date)));
  }, [rangeDates]);

  const includedDates = useMemo(
    () => rangeDates.filter((date) => !excludedDates.includes(date)),
    [excludedDates, rangeDates]
  );

  const overlappingScheduleDates = useMemo(
    () => includedDates.filter((date) => scheduleDates.includes(date)),
    [includedDates, scheduleDates]
  );

  const disabledDates = useMemo(
    () => reservedLeaveDates.map(toLocalDate),
    [reservedLeaveDates]
  );

  const scheduledDates = useMemo(
    () => scheduleDates.map(toLocalDate),
    [scheduleDates]
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
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-600/20">
            <CalendarDays className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Leave Request</h1>
            <p className="text-sm text-slate-400">Select a leave range, remove exception dates, and submit for approval.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[430px,1fr] gap-6">
          <form onSubmit={handleSubmit} className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">New Request</h2>
              <p className="text-sm text-slate-400">
                Existing leave dates are blocked. Approved schedules are highlighted so you can see what this request affects.
              </p>
            </div>

            <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-4 overflow-x-auto">
              <DayPicker
                mode="range"
                selected={leaveRange}
                onSelect={setLeaveRange}
                disabled={disabledDates}
                modifiers={{ scheduled: scheduledDates }}
                modifiersClassNames={{ scheduled: "rdp-day_scheduled" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SummaryTile label="Start" value={leaveRange?.from ? format(leaveRange.from, "MMM dd, yyyy") : "Not set"} />
              <SummaryTile label="End" value={leaveRange?.to ? format(leaveRange.to, "MMM dd, yyyy") : "Not set"} />
              <SummaryTile label="Included" value={`${includedDates.length} day${includedDates.length === 1 ? "" : "s"}`} />
              <SummaryTile label="Excluded" value={`${excludedDates.length} day${excludedDates.length === 1 ? "" : "s"}`} />
            </div>

            {overlappingScheduleDates.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {overlappingScheduleDates.length} selected leave day{overlappingScheduleDates.length === 1 ? "" : "s"} currently match approved schedules.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Type of Leave</label>
              <select
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value)}
                required
                className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableLeaveTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Leave</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={6}
                placeholder="Enter the reason for your leave request..."
                className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-2xl transition"
            >
              {submitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </form>

          <div className="space-y-6">
            <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Included Leave Dates</h2>
                  <p className="text-sm text-slate-400">Remove any dates inside the selected range that should stay on duty.</p>
                </div>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                  {includedDates.length} active
                </span>
              </div>

              {includedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {includedDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => toggleExcludedDate(date)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-full bg-slate-900 text-slate-200 border border-slate-700 hover:border-red-400/50 hover:text-red-300 transition"
                    >
                      {new Date(`${date}T00:00:00`).toLocaleDateString()}
                      <X size={12} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a complete date range first.</p>
              )}

              {excludedDates.length > 0 && (
                <div className="mt-5 border-t border-slate-700 pt-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white">Excluded From Leave</h3>
                    <span className="text-xs text-slate-400">Tap to restore</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {excludedDates.map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleExcludedDate(date)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-full bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition"
                      >
                        {new Date(`${date}T00:00:00`).toLocaleDateString()}
                        <CheckCircle size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-blue-400" size={20} />
                <div>
                  <h2 className="text-lg font-semibold text-white">My Leave History</h2>
                  <p className="text-sm text-slate-400">Track approval status and requested dates.</p>
                </div>
              </div>

              {leaveRequests.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                  <AlertCircle size={42} className="mb-3 opacity-30" />
                  <p>No leave requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request) => {
                    const StatusIcon = statusIconMap[request.status] || Clock;
                    return (
                      <div key={request._id} className="bg-slate-900/40 border border-slate-700 rounded-2xl p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-sm text-slate-400">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
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
                          <SummaryTile label="Range Start" value={request.startDate || request.dates?.[0] || "N/A"} compact />
                          <SummaryTile label="Range End" value={request.endDate || request.dates?.[request.dates.length - 1] || "N/A"} compact />
                          <SummaryTile label="Included Days" value={`${request.dates?.length || 0}`} compact />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(request.dates || []).map((date) => (
                            <span key={date} className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {new Date(`${date}T00:00:00`).toLocaleDateString()}
                            </span>
                          ))}
                        </div>

                        {request.excludedDates?.length > 0 && (
                          <div className="text-sm text-slate-400">
                            Excluded dates:{" "}
                            <span className="text-slate-200">
                              {request.excludedDates.join(", ")}
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
          </div>
        </div>
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
