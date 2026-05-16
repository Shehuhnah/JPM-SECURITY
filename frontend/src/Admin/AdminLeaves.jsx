import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { eachDayOfInterval, format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  User,
  X,
  XCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-day-picker/dist/style.css";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";

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
  .rdp-day_selected:not([disabled]),
  .rdp-day_range_start:not([disabled]),
  .rdp-day_range_end:not([disabled]) {
    background-color: #2563eb;
    color: white;
    border-radius: 8px;
  }
  .rdp-day_range_middle {
    background-color: rgba(37, 99, 235, 0.16);
    color: #dbeafe;
  }
  .rdp-day:hover:not([disabled]) {
    background-color: #1e293b;
    border-radius: 8px;
  }
  .rdp-caption_label {
    font-weight: 700;
    color: #f8fafc;
  }
  .rdp-head_cell {
    color: #94a3b8;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
  .rdp-day {
    color: #cbd5e1;
  }
  .rdp-nav_button {
    color: #94a3b8;
  }
`;

const statusConfig = {
  Pending: {
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  Approved: {
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  Declined: {
    color: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

const roleConfig = {
  Guard: { color: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  Admin: { color: "text-fuchsia-300", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  Subadmin: { color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

const buildRangeDates = (range) => {
  if (!range?.from || !range?.to) return [];
  return eachDayOfInterval({ start: range.from, end: range.to }).map((day) => format(day, "yyyy-MM-dd"));
};

const toDateOnly = (value) => (typeof value === "string" ? value.slice(0, 10) : format(value, "yyyy-MM-dd"));
const toLocalDate = (value) => new Date(`${value}T00:00:00`);

export default function AdminLeaves() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [existingLeaveDates, setExistingLeaveDates] = useState([]);
  const [leaveRange, setLeaveRange] = useState();
  const [excludedDates, setExcludedDates] = useState([]);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [declineModal, setDeclineModal] = useState({ open: false, requestId: "", name: "" });
  const [declineReason, setDeclineReason] = useState("");

  const isAdmin = user?.role === "Admin";
  const canRequestLeave = user?.role === "Admin" || user?.role === "Subadmin";
  const canReview = user?.role === "Admin" || user?.role === "Subadmin";

  const selectedAssigneeOption = useMemo(
    () => staffOptions.find((option) => option.value === selectedAssignee) || null,
    [staffOptions, selectedAssignee]
  );

  const availableLeaveTypes = useMemo(() => {
    const sex = selectedAssigneeOption?.sex || "";
    return LEAVE_TYPE_OPTIONS[sex] || LEAVE_TYPE_OPTIONS.default;
  }, [selectedAssigneeOption]);

  const rangeDates = useMemo(() => buildRangeDates(leaveRange), [leaveRange]);

  useEffect(() => {
    setExcludedDates((prev) => prev.filter((date) => rangeDates.includes(date)));
  }, [rangeDates]);

  const includedDates = useMemo(
    () => rangeDates.filter((date) => !excludedDates.includes(date)),
    [excludedDates, rangeDates]
  );

  const fetchRequests = useCallback(async () => {
    setLoadingPage(true);
    try {
      const response = await fetch(`${api}/api/leaves`, { credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load leave requests.");
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error(error.message || "Failed to load leave requests.");
    } finally {
      setLoadingPage(false);
    }
  }, []);

  const fetchStaffOptions = useCallback(async () => {
    if (!canRequestLeave || !user?._id) return;

    try {
      const [guardsRes, subadminsRes, adminsRes] = await Promise.all([
        fetch(`${api}/api/auth/guards`, { credentials: "include" }),
        fetch(`${api}/api/auth/subadmins`, { credentials: "include" }),
        fetch(`${api}/api/auth/admins`, { credentials: "include" }),
      ]);

      const [guardsData, subadminsData, adminsData] = await Promise.all([
        guardsRes.json(),
        subadminsRes.json(),
        adminsRes.json(),
      ]);

      const options = [
        { value: `${user.role}:${user._id}`, label: `${user.name} (My leave)`, role: user.role, id: user._id, sex: user.sex || "" },
        ...((Array.isArray(adminsData) ? adminsData : [])
          .filter((admin) => admin._id !== user._id)
          .map((admin) => ({
            value: `Admin:${admin._id}`,
            label: `${admin.name} (Admin)`,
            role: "Admin",
            id: admin._id,
            sex: admin.sex || "",
          }))),
        ...((Array.isArray(subadminsData) ? subadminsData : [])
          .filter((staff) => staff._id !== user._id)
          .map((staff) => ({
            value: `Subadmin:${staff._id}`,
            label: `${staff.name} (Subadmin)`,
            role: "Subadmin",
            id: staff._id,
            sex: staff.sex || "",
          }))),
        ...((Array.isArray(guardsData) ? guardsData : []).map((guard) => ({
          value: `Guard:${guard._id}`,
          label: `${getPersonName(guard)} (${guard.guardId || "Guard"})`,
          role: "Guard",
          id: guard._id,
          sex: guard.sex || "",
        }))),
      ];

      setStaffOptions(options);
      setSelectedAssignee((current) => current || options[0]?.value || "");
    } catch (error) {
      console.error("Failed to load staff options:", error);
      toast.error("Failed to load staff options.");
    }
  }, [canRequestLeave, user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
      return;
    }

    if (user?.role === "Admin" || user?.role === "Subadmin") {
      document.title = "Leave Management | JPM Security";
      fetchRequests();
      fetchStaffOptions();
    }
  }, [user, loading, navigate, fetchRequests, fetchStaffOptions]);

  useEffect(() => {
    if (!availableLeaveTypes.includes(leaveType)) {
      setLeaveType(availableLeaveTypes[0] || "");
    }
  }, [availableLeaveTypes, leaveType]);

  useEffect(() => {
    if (!selectedAssigneeOption) {
      setExistingLeaveDates([]);
      return;
    }

    const dates = requests
      .filter((request) => {
        const matchesRole = request.requesterRole === selectedAssigneeOption.role;
        const targetId = selectedAssigneeOption.role === "Guard" ? request.guard?._id : request.staff?._id;
        return matchesRole && targetId === selectedAssigneeOption.id && ["Pending", "Approved"].includes(request.status);
      })
      .flatMap((request) => request.dates || []);

    setExistingLeaveDates([...new Set(dates)].sort());
  }, [requests, selectedAssigneeOption]);

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

  const getRequestDisplayName = useCallback(
    (request) => (request.guard ? getPersonName(request.guard) : request.staff?.name || "Unknown"),
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!leaveRange?.from || !leaveRange?.to || includedDates.length === 0 || !leaveType || !reason.trim()) {
      toast.error("Please provide a valid leave range, leave type, and reason.");
      return;
    }

    if (!selectedAssigneeOption) {
      toast.error("Select the personnel for this leave request.");
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
          targetRole: selectedAssigneeOption.role,
          targetId: selectedAssigneeOption.id,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit request.");
      }

      toast.success("Leave request submitted.");
      resetForm();
      setIsFormOpen(false);
      await fetchRequests();
    } catch (error) {
      toast.error(error.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (requestId, nextStatus, reviewRemarks = "") => {
    setReviewingId(requestId);
    try {
      const response = await fetch(`${api}/api/leaves/${requestId}/review`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reviewRemarks }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Update failed.");
      }

      toast.success(`Request ${nextStatus}.`);
      await fetchRequests();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to update request.");
      return false;
    } finally {
      setReviewingId("");
    }
  };

  const openDeclineModal = (request) => {
    setDeclineModal({
      open: true,
      requestId: request._id,
      name: getRequestDisplayName(request),
    });
    setDeclineReason("");
  };

  const closeDeclineModal = () => {
    if (reviewingId) return;
    setDeclineModal({ open: false, requestId: "", name: "" });
    setDeclineReason("");
  };

  const submitDecline = async () => {
    const trimmedReason = declineReason.trim();
    if (!trimmedReason) {
      toast.error("A reason is required to decline a leave request.");
      return;
    }

    const targetId = declineModal.requestId;
    const didSucceed = await handleReview(targetId, "Declined", trimmedReason);
    if (didSucceed) {
      setDeclineModal({ open: false, requestId: "", name: "" });
      setDeclineReason("");
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const name = request.guard ? getPersonName(request.guard) : request.staff?.name || "";
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || request.status === statusFilter;
      const matchesRole = roleFilter === "All" || request.requesterRole === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [requests, roleFilter, searchQuery, statusFilter]);

  const summary = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === "Pending").length,
    approved: requests.filter((request) => request.status === "Approved").length,
    declined: requests.filter((request) => request.status === "Declined").length,
  }), [requests]);

  if (loading || loadingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4 text-blue-400">
          <Clock className="h-10 w-10 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading leave records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] px-4 py-6 text-slate-100 md:px-8 md:py-8">
      <style>{datePickerStyles}</style>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      <div className="mx-auto max-w-8xl space-y-6">
        {declineModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-red-500/20 bg-[#162131] shadow-2xl shadow-black/40">
              <div className="border-b border-red-500/10 bg-[linear-gradient(135deg,rgba(127,29,29,0.25),rgba(30,41,59,0.92))] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Decline Leave Request</div>
                    <h3 className="mt-2 text-xl font-semibold text-white">{declineModal.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Provide a clear review note so the requester understands why this leave was declined.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDeclineModal}
                    disabled={Boolean(reviewingId)}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Decline Reason
                </label>
                <textarea
                  value={declineReason}
                  onChange={(event) => setDeclineReason(event.target.value)}
                  rows={6}
                  placeholder="State the reason for declining this leave request."
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-[#0f172a] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/50 focus:ring-2 focus:ring-red-500/30"
                />
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Required before declining</span>
                  <span>{declineReason.trim().length} characters</span>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-700 bg-[#132033] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeclineModal}
                  disabled={Boolean(reviewingId)}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitDecline}
                  disabled={Boolean(reviewingId)}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reviewingId === declineModal.requestId ? "Submitting..." : "Confirm Decline"}
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
              <CalendarDays className="text-blue-500" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Leave Management</h1>
              <p className="text-slate-400 text-sm mt-1">File, review, and manage personnel leave requests.</p>
            </div>
          </div>

          {canRequestLeave && (
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <button
                onClick={() => setIsFormOpen((prev) => !prev)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shadow-lg shadow-blue-900/20"
              >
                <Plus size={18} />
                {isFormOpen ? "Hide Request Form" : "New Leave Request"}
              </button>
            </div>
          )}
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Requests" value={summary.total} icon={<FileText size={18} />} color="blue" />
          <SummaryCard label="Pending" value={summary.pending} icon={<Clock size={18} />} color="blue" />
          <SummaryCard label="Approved" value={summary.approved} icon={<CheckCircle size={18} />} color="blue" />
          <SummaryCard label="Declined" value={summary.declined} icon={<XCircle size={18} />} color="blue" />
        </div>

        {isFormOpen && (
          <section className="rounded-2xl border border-gray-700 bg-[#1e293b] p-5 shadow-lg md:p-6">
            <div className="mb-5 border-b border-gray-700 pb-4">
              <h2 className="text-lg font-semibold text-white">Submit Leave Request</h2>
              <p className="mt-1 text-sm text-slate-400">
                Pick a date range, remove dates inside the range when needed, and submit the final leave coverage.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[340px_1fr]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Assign To
                  </label>
                  <select
                    value={selectedAssignee}
                    onChange={(event) => setSelectedAssignee(event.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-[#0f172a] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    {staffOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-gray-700 bg-[#0f172a] p-3">
                  <DayPicker
                    mode="range"
                    selected={leaveRange}
                    onSelect={setLeaveRange}
                    disabled={existingLeaveDates.map(toLocalDate)}
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard label="Range Start" value={leaveRange?.from ? format(leaveRange.from, "MMM dd, yyyy") : "Not set"} />
                  <InfoCard label="Range End" value={leaveRange?.to ? format(leaveRange.to, "MMM dd, yyyy") : "Not set"} />
                  <InfoCard label="Included" value={`${includedDates.length} day${includedDates.length === 1 ? "" : "s"}`} />
                  <InfoCard label="Excluded" value={`${excludedDates.length} day${excludedDates.length === 1 ? "" : "s"}`} />
                </div>

                <div className="rounded-xl border border-gray-700 bg-[#0f172a] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Included Leave Dates
                    </span>
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
                          className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-red-400/50 hover:text-red-300"
                        >
                          {format(new Date(`${date}T00:00:00`), "MMM dd, yyyy")}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No active leave dates selected.</p>
                  )}

                  {excludedDates.length > 0 && (
                    <div className="mt-5 border-t border-gray-700 pt-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Excluded Dates
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {excludedDates.map((date) => (
                          <button
                            key={date}
                            type="button"
                            onClick={() => toggleExcludedDate(date)}
                            className="inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                          >
                            {format(new Date(`${date}T00:00:00`), "MMM dd, yyyy")}
                            <CheckCircle size={12} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Type of Leave
                  </label>
                  <select
                    value={leaveType}
                    onChange={(event) => setLeaveType(event.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-[#0f172a] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    {availableLeaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={6}
                    placeholder="Provide the reason for this leave request."
                    className="w-full resize-none rounded-xl border border-gray-700 bg-[#0f172a] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/60"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {submitting ? <Clock className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-700 bg-[#1e293b] shadow-lg">
          <div className="border-b border-gray-700 p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by personnel name..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-[#0f172a] py-3 pl-12 pr-4 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
                <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#0f172a] px-4 py-2">
                  <Filter size={14} className="text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="bg-transparent text-sm text-slate-300 outline-none"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#0f172a] px-4 py-2">
                  <Shield size={14} className="text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="bg-transparent text-sm text-slate-300 outline-none"
                  >
                    <option value="All">All Roles</option>
                    <option value="Guard">Guards</option>
                    <option value="Subadmin">Subadmins</option>
                    <option value="Admin">Admins</option>
                  </select>
                </div>

                <button
                  onClick={() => fetchRequests()}
                  className="inline-flex items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-3 text-blue-300 transition hover:bg-blue-500/20"
                  title="Refresh"
                >
                  <RefreshCcw size={18} className={loadingPage ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-500">
                <div className="rounded-full border border-gray-700 bg-[#0f172a] p-5">
                  <AlertCircle size={40} className="text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-200">No leave requests found</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                    Try adjusting the filters or search query.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden bg-[#1e293b] rounded-xl border border-gray-700">
                <table className="w-full min-w-[1150px] text-left border-collapse">
                  <thead className="bg-[#0f172a] text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">#</th>
                      <th className="px-6 py-4 font-semibold">Personnel</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Range</th>
                      <th className="px-6 py-4 font-semibold text-center">Included</th>
                      <th className="px-6 py-4 font-semibold">Leave Type</th>
                      <th className="px-6 py-4 font-semibold">Reason</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      {canReview && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredRequests.map((request, index) => (
                      <tr key={request._id} className="group hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{getRequestDisplayName(request)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {request.guard?.guardId || request.staff?.position || "System Staff"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge config={roleConfig[request.requesterRole] || roleConfig.Subadmin}>
                            {request.requesterRole}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div>{request.startDate || request.dates?.[0] || "N/A"}</div>
                          <div className="text-xs text-gray-500 mt-1">{request.endDate || request.dates?.[request.dates.length - 1] || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {request.dates?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {request.leaveType || "Unspecified"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <p className="line-clamp-2 max-w-[280px] leading-6">{request.reason}</p>
                          {request.reviewRemarks ? (
                            <p className="mt-2 text-xs text-gray-500">
                              Review note: <span className="text-slate-300">{request.reviewRemarks}</span>
                            </p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={request.status} />
                        </td>
                        {canReview && (
                          <td className="px-6 py-4 text-right">
                            {request.status === "Pending" ? (
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleReview(request._id, "Approved")}
                                  disabled={reviewingId === request._id}
                                  className="p-2 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-lg transition disabled:opacity-50"
                                  title="Approve Request"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => openDeclineModal(request)}
                                  disabled={reviewingId === request._id}
                                  className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition disabled:opacity-50"
                                  title="Decline Request"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 lg:hidden">
            {filteredRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-[#0f172a] px-4 py-10 text-center text-sm text-slate-500">
                No leave requests found.
              </div>
            ) : (
              filteredRequests.map((request, index) => (
                <div key={request._id} className="rounded-xl border border-gray-700 bg-[#0f172a] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-slate-900">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">#{index + 1}</p>
                        <p className="text-sm font-semibold text-white">
                          {getRequestDisplayName(request)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.guard?.guardId || request.staff?.position || request.requesterRole}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge config={roleConfig[request.requesterRole] || roleConfig.Subadmin}>
                      {request.requesterRole}
                    </Badge>
                    <span className="inline-flex items-center rounded-md border border-gray-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200">
                      {request.leaveType || "Unspecified"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                      <Calendar size={12} />
                      {request.dates?.length || 0} day{(request.dates?.length || 0) === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <InfoCard label="Range Start" value={request.startDate || request.dates?.[0] || "N/A"} compact />
                    <InfoCard label="Range End" value={request.endDate || request.dates?.[request.dates.length - 1] || "N/A"} compact />
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</p>
                    <p className="text-sm leading-6 text-slate-300">{request.reason}</p>
                  </div>

                  {request.reviewRemarks ? (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Review Note</p>
                      <p className="text-sm leading-6 text-slate-300">{request.reviewRemarks}</p>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Included Dates</p>
                    <div className="flex flex-wrap gap-2">
                      {request.dates?.map((date) => (
                        <span key={date} className="rounded-md border border-gray-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
                          {format(new Date(`${date}T00:00:00`), "MMM dd, yyyy")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {canReview && request.status === "Pending" && (
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => handleReview(request._id, "Approved")}
                        disabled={reviewingId === request._id}
                        className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openDeclineModal(request)}
                        disabled={reviewingId === request._id}
                        className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const SummaryCard = ({ label, value, icon, color }) => {
  const colors = {
    blue: "border-blue-500/20 bg-[#10263a] text-blue-300",
  };

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-5 ${colors[color]}`}>
      <div className="rounded-lg bg-black/10 p-3">{icon}</div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

const Badge = ({ config, children }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${config.bg} ${config.color} ${config.border}`}>
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${config.bg} ${config.color} ${config.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${status === "Pending" ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
};

const InfoCard = ({ label, value, compact = false }) => (
  <div className={`rounded-xl border border-gray-700 bg-[#0f172a] ${compact ? "p-3" : "p-4"}`}>
    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
    <div className={`mt-2 font-semibold text-white ${compact ? "text-sm" : "text-base"}`}>{value}</div>
  </div>
);
