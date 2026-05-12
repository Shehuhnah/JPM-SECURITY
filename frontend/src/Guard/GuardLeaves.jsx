import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-day-picker/dist/style.css";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";

const api = import.meta.env.VITE_API_URL;

const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 38px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #1e293b;
    margin: 0;
  }
  .rdp-day_selected:not([disabled]) {
    background-color: #2563eb;
    color: white;
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
`;

const toDateOnly = (value) => (typeof value === "string" ? value.slice(0, 10) : format(value, "yyyy-MM-dd"));
const toLocalDate = (value) => new Date(`${value}T00:00:00`);

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
  const [selectedDays, setSelectedDays] = useState([]);
  const [reason, setReason] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    return [...new Set(reserved)];
  }, [leaveRequests]);

  const disabledDates = useMemo(
    () => [...new Set([...scheduleDates, ...reservedLeaveDates])].map(toLocalDate),
    [scheduleDates, reservedLeaveDates]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const dates = [...new Set((selectedDays || []).map((day) => toDateOnly(day)))].sort();
    if (dates.length === 0) {
      toast.error("Select at least one leave date.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Reason for leave is required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${api}/api/leaves`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, reason: reason.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit leave request.");

      toast.success("Leave request submitted.");
      setSelectedDays([]);
      setReason("");
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
            <p className="text-sm text-slate-400">Select your off dates and submit them for approval.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-6">
          <form onSubmit={handleSubmit} className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">New Request</h2>
              <p className="text-sm text-slate-400">
                Dates with approved schedules or existing leave requests are blocked.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-4 overflow-x-auto">
                <DayPicker
                  mode="multiple"
                  selected={selectedDays}
                  onSelect={(days) => setSelectedDays(days || [])}
                  disabled={disabledDates}
                />
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">Selected Dates</p>
                  <div className="text-xs text-slate-400 mb-3">
                    Total selected: <span className="text-slate-200 font-semibold">{selectedDays.length}</span>
                  </div>
                  {selectedDays.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDays
                        .map((day) => format(day, "yyyy-MM-dd"))
                        .sort()
                        .map((date) => (
                          <span key={date} className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {new Date(`${date}T00:00:00`).toLocaleDateString()}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No dates selected yet.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Leave</label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={8}
                    placeholder="Enter the reason for your leave request..."
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-2xl transition"
            >
              {submitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </form>

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
                          <p className="text-sm text-slate-300 mt-1">{request.reason}</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${statusClassMap[request.status] || statusClassMap.Pending}`}>
                          <StatusIcon size={14} />
                          {request.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(request.dates || []).map((date) => (
                          <span key={date} className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {new Date(`${date}T00:00:00`).toLocaleDateString()}
                          </span>
                        ))}
                      </div>

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
  );
}
