import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  User,
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
`;

const toDateOnly = (value) => (typeof value === "string" ? value.slice(0, 10) : format(value, "yyyy-MM-dd"));

const statusClassMap = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Declined: "bg-red-500/10 text-red-400 border-red-500/20",
};

const roleClassMap = {
  Guard: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Admin: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20",
  Subadmin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function AdminLeaves() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState("");

  const isAdmin = user?.role === "Admin";
  const isSubadmin = user?.role === "Subadmin";
  const canRequestLeave = user?.role === "Admin" || user?.role === "Subadmin";

  const fetchRequests = useCallback(async (role, currentStatus = statusFilter) => {
    setLoadingPage(true);
    try {
      const endpoint = role === "Admin"
        ? `${api}/api/leaves${currentStatus !== "All" ? `?status=${currentStatus}` : ""}`
        : `${api}/api/leaves`;

      const response = await fetch(endpoint, { credentials: "include" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to load leave requests.");
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error(error.message || "Failed to load leave requests.");
    } finally {
      setLoadingPage(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
      return;
    }

    if (user?.role === "Admin" || user?.role === "Subadmin") {
      document.title = user.role === "Admin" ? "Leave Management | JPM Security" : "My Staff Leave | JPM Security";
      fetchRequests(user.role, statusFilter);
    }
  }, [user, loading, navigate, statusFilter, fetchRequests]);

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
      await fetchRequests(user.role, statusFilter);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error(error.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (requestId, nextStatus) => {
    setReviewingId(requestId);
    try {
      const response = await fetch(`${api}/api/leaves/${requestId}/review`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${nextStatus.toLowerCase()} request.`);

      toast.success(`Leave request ${nextStatus.toLowerCase()}.`);
      await fetchRequests(user.role, statusFilter);
    } catch (error) {
      console.error("Error reviewing leave request:", error);
      toast.error(error.message || "Failed to review leave request.");
    } finally {
      setReviewingId("");
    }
  };

  const summary = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === "Pending").length,
    approved: requests.filter((request) => request.status === "Approved").length,
    declined: requests.filter((request) => request.status === "Declined").length,
  }), [requests]);

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

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-600/20">
            <CalendarDays className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {isAdmin ? "Leave Management" : "My Leave Requests"}
            </h1>
            <p className="text-sm text-slate-400">
              {isAdmin ? "Review leave requests and file your own admin leave when needed." : "Submit leave dates for admin approval."}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: summary.total },
              { label: "Pending", value: summary.pending },
              { label: "Approved", value: summary.approved },
              { label: "Declined", value: summary.declined },
            ].map((item) => (
              <div key={item.label} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="text-2xl font-bold text-white mt-2">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className={`grid gap-6 ${canRequestLeave ? "grid-cols-1 xl:grid-cols-[420px,1fr]" : "grid-cols-1"}`}>
          {canRequestLeave ? (
            <form onSubmit={handleSubmit} className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">{isAdmin ? "New Admin Leave" : "New Staff Leave"}</h2>
                <p className="text-sm text-slate-400">Pick the days you will be off and submit them for approval.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-4 overflow-x-auto">
                  <DayPicker
                    mode="multiple"
                    selected={selectedDays}
                    onSelect={(days) => setSelectedDays(days || [])}
                    disabled={{ before: new Date() }}
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
          ) : null}

          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-400" size={20} />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {isAdmin ? "All Leave Requests" : "My Request History"}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {isAdmin ? "Approve or decline pending requests." : "Track your submitted leave requests."}
                  </p>
                </div>
              </div>

              {isAdmin ? (
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Declined">Declined</option>
                </select>
              ) : null}
            </div>

            {requests.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                <AlertCircle size={42} className="mb-3 opacity-30" />
                <p>No leave requests found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const requesterName = request.guard?.fullName || request.staff?.name || "Unknown";
                  const requesterMeta = request.guard?.guardId || request.staff?.position || request.requesterRole;
                  const roleIcon = request.requesterRole === "Guard" ? Shield : User;
                  const RoleIcon = roleIcon;

                  return (
                    <div key={request._id} className="bg-slate-900/40 border border-slate-700 rounded-2xl p-4 space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${roleClassMap[request.requesterRole] || roleClassMap.Subadmin}`}>
                              {request.requesterRole}
                            </span>
                            <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${statusClassMap[request.status] || statusClassMap.Pending}`}>
                              {request.status}
                            </span>
                          </div>

                          <div>
                            <p className="text-white font-semibold flex items-center gap-2">
                              <RoleIcon size={16} className="text-slate-400" />
                              {requesterName}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">{requesterMeta}</p>
                          </div>

                          <p className="text-sm text-slate-300">{request.reason}</p>
                        </div>

                        {isAdmin && request.status === "Pending" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleReview(request._id, "Approved")}
                              disabled={reviewingId === request._id}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(request._id, "Declined")}
                              disabled={reviewingId === request._id}
                              className="bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                              Decline
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(request.dates || []).map((date) => (
                          <span key={date} className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {new Date(`${date}T00:00:00`).toLocaleDateString()}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-slate-500 border-t border-slate-700 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span>Submitted: {new Date(request.createdAt).toLocaleString()}</span>
                        {request.reviewedAt ? <span>Reviewed: {new Date(request.reviewedAt).toLocaleString()}</span> : null}
                      </div>

                      {request.reviewRemarks ? (
                        <div className="text-sm text-slate-400">
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
