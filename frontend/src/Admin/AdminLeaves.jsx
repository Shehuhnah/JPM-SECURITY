import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Plus,
  Search,
  Shield,
  User,
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
  .rdp-day_selected:not([disabled]) {
    background-color: #2563eb;
    color: white;
    border-radius: 8px;
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

const toDateOnly = (value) => (typeof value === "string" ? value.slice(0, 10) : format(value, "yyyy-MM-dd"));

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

export default function AdminLeaves() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isAdmin = user?.role === "Admin";
  const canRequestLeave = user?.role === "Admin" || user?.role === "Subadmin";

  const selectedAssigneeOption = useMemo(
    () => staffOptions.find((option) => option.value === selectedAssignee) || null,
    [staffOptions, selectedAssignee]
  );

  const availableLeaveTypes = useMemo(() => {
    const sex = selectedAssigneeOption?.sex || (user?.role === "Guard" ? user?.sex : "");
    return LEAVE_TYPE_OPTIONS[sex] || LEAVE_TYPE_OPTIONS.default;
  }, [selectedAssigneeOption, user]);

  const fetchRequests = useCallback(async (role, currentStatus = statusFilter) => {
    setLoadingPage(true);
    try {
      const endpoint =
        role === "Admin"
          ? `${api}/api/leaves${currentStatus !== "All" ? `?status=${currentStatus}` : ""}`
          : `${api}/api/leaves`;

      const response = await fetch(endpoint, { credentials: "include" });
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
  }, [statusFilter]);

  const fetchStaffOptions = useCallback(async () => {
    if (!isAdmin) return;

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
        { value: `Admin:${user._id}`, label: `${user.name} (My leave)`, role: "Admin", id: user._id, sex: user.sex || "" },
        ...((Array.isArray(adminsData) ? adminsData : [])
          .filter((admin) => admin._id !== user._id)
          .map((admin) => ({
            value: `Admin:${admin._id}`,
            label: `${admin.name} (Admin)`,
            role: "Admin",
            id: admin._id,
            sex: admin.sex || "",
          }))),
        ...((Array.isArray(subadminsData) ? subadminsData : []).map((staff) => ({
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
      setSelectedAssignee(options[0]?.value || "");
    } catch (error) {
      toast.error("Failed to load staff options.");
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
      return;
    }

    if (user?.role === "Admin" || user?.role === "Subadmin") {
      document.title = "Leave Management | JPM Security";
      fetchRequests(user.role);
    }
  }, [user, loading, navigate, fetchRequests]);

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchStaffOptions();
    }
  }, [user, fetchStaffOptions]);

  useEffect(() => {
    if (!availableLeaveTypes.includes(leaveType)) {
      setLeaveType(availableLeaveTypes[0] || "");
    }
  }, [availableLeaveTypes, leaveType]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const dates = [...new Set((selectedDays || []).map((day) => toDateOnly(day)))].sort();
    if (dates.length === 0 || !leaveType || !reason.trim()) {
      toast.error("Please provide dates, leave type, and a reason.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${api}/api/leaves`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates,
          leaveType,
          reason: reason.trim(),
          ...(isAdmin && selectedAssigneeOption
            ? { targetRole: selectedAssigneeOption.role, targetId: selectedAssigneeOption.id }
            : {}),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit request.");
      }

      toast.success("Leave request submitted.");
      setSelectedDays([]);
      setLeaveType(availableLeaveTypes[0] || "");
      setReason("");
      setIsFormOpen(false);
      await fetchRequests(user.role);
    } catch (error) {
      toast.error(error.message || "Failed to submit request.");
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

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Update failed.");
      }

      toast.success(`Request ${nextStatus}.`);
      await fetchRequests(user.role);
    } catch (error) {
      toast.error(error.message || "Failed to update request.");
    } finally {
      setReviewingId("");
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
  }, [requests, searchQuery, statusFilter, roleFilter]);

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
        <header className="rounded-2xl border border-blue-500/20 bg-[#10263a] px-5 py-6 shadow-lg md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                <CalendarDays className="text-blue-400" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide text-white md:text-3xl">Leave Management</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Review employee leave requests and manage internal leave applications in one place.
                </p>
              </div>
            </div>

            {canRequestLeave && (
              <button
                onClick={() => setIsFormOpen((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <Plus size={16} />
                {isFormOpen ? "Hide Request Form" : "New Leave Request"}
              </button>
            )}
          </div>
        </header>

        {isAdmin && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total Requests" value={summary.total} icon={<FileText size={18} />} color="blue" />
            <SummaryCard label="Pending" value={summary.pending} icon={<Clock size={18} />} color="blue" />
            <SummaryCard label="Approved" value={summary.approved} icon={<CheckCircle size={18} />} color="blue" />
            <SummaryCard label="Declined" value={summary.declined} icon={<XCircle size={18} />} color="blue" />
          </div>
        )}

        {isFormOpen && (
          <section className="rounded-2xl border border-gray-700 bg-[#1e293b] p-5 shadow-lg md:p-6">
            <div className="mb-5 border-b border-gray-700 pb-4">
              <h2 className="text-lg font-semibold text-white">Submit Leave Request</h2>
              <p className="mt-1 text-sm text-slate-400">
                Select leave dates, choose the leave type, and provide a clear reason for the request.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[340px_1fr]">
              <div className="space-y-4">
                {isAdmin && (
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
                )}

                <div className="rounded-xl border border-gray-700 bg-[#0f172a] p-3">
                  <DayPicker
                    mode="multiple"
                    selected={selectedDays}
                    onSelect={(days) => setSelectedDays(days || [])}
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-gray-700 bg-[#0f172a] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Selected Dates
                    </span>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                      {selectedDays.length} day{selectedDays.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {selectedDays.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDays
                        .slice()
                        .sort((a, b) => a - b)
                        .map((day) => (
                          <span
                            key={day.toString()}
                            className="rounded-md border border-gray-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200"
                          >
                            {format(day, "MMM dd, yyyy")}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No dates selected.</p>
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

                {isAdmin && (
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
                )}

                <button
                  onClick={() => fetchRequests(user.role)}
                  className="inline-flex items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-3 text-blue-300 transition hover:bg-blue-500/20"
                  title="Refresh"
                >
                  <Clock size={18} className={loadingPage ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
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
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#162131] text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-6 py-4">Personnel</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-center">Days</th>
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/70">
                  {filteredRequests.map((request) => (
                    <tr key={request._id} className="transition-colors hover:bg-[#162131]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-[#0f172a]">
                            <User size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="mb-1 text-sm font-semibold text-white">
                              {request.guard ? getPersonName(request.guard) : request.staff?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {request.guard?.guardId || request.staff?.position || "System Staff"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge config={roleConfig[request.requesterRole] || roleConfig.Subadmin}>
                          {request.requesterRole}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="rounded-md bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
                          {request.dates?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-slate-200">
                          {request.leaveType || "Unspecified"}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-6 py-5">
                        <div className="flex flex-wrap gap-1.5">
                          {request.dates?.slice(0, 2).map((date) => (
                            <span key={date} className="rounded-md border border-gray-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
                              {format(new Date(`${date}T00:00:00`), "MMM dd")}
                            </span>
                          ))}
                          {request.dates?.length > 2 && (
                            <span className="text-[11px] font-medium text-blue-300">
                              + {request.dates.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="line-clamp-2 max-w-[260px] text-sm leading-6 text-slate-300">
                          {request.reason}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={request.status} />
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-5 text-right">
                          {request.status === "Pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleReview(request._id, "Approved")}
                                disabled={reviewingId === request._id}
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
                                title="Approve Request"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleReview(request._id, "Declined")}
                                disabled={reviewingId === request._id}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-red-400 transition hover:bg-red-500 hover:text-white"
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
            )}
          </div>

          <div className="space-y-4 p-4 lg:hidden">
            {filteredRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-[#0f172a] px-4 py-10 text-center text-sm text-slate-500">
                No leave requests found.
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request._id} className="rounded-xl border border-gray-700 bg-[#0f172a] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-slate-900">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {request.guard ? getPersonName(request.guard) : request.staff?.name || "Unknown"}
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

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dates</p>
                    <div className="flex flex-wrap gap-2">
                      {request.dates?.map((date) => (
                        <span key={date} className="rounded-md border border-gray-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
                          {format(new Date(`${date}T00:00:00`), "MMM dd, yyyy")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</p>
                    <p className="text-sm leading-6 text-slate-300">{request.reason}</p>
                  </div>

                  {isAdmin && request.status === "Pending" && (
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => handleReview(request._id, "Approved")}
                        disabled={reviewingId === request._id}
                        className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(request._id, "Declined")}
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
    amber: "border-amber-500/20 bg-[#2b2417] text-amber-300",
    emerald: "border-emerald-500/20 bg-[#16261f] text-emerald-300",
    red: "border-red-500/20 bg-[#2d1d20] text-red-300",
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
