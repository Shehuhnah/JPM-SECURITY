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
  History,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  ShieldOff,
  User,
  X,
  XCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-day-picker/dist/style.css";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";
import TablePagination from "../components/admin/TablePagination.jsx";

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
  Revoked: {
    color: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
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
const toManilaDateKey = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
};
const getEmployeeLabel = (person, fallbackRole = "") => {
  if (!person) return fallbackRole || "Unknown";
  const firstName = person.firstName?.trim() || "";
  const lastName = person.lastName?.trim() || "";
  const combined = `${firstName} ${lastName}`.trim();
  return combined || person.name?.trim() || fallbackRole || "Unknown";
};

export default function AdminLeaves() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [existingLeaveDates, setExistingLeaveDates] = useState([]);
  const [attendanceBlockedDates, setAttendanceBlockedDates] = useState([]);
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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [approveModal, setApproveModal] = useState({ open: false, request: null });
  const [declineModal, setDeclineModal] = useState({ open: false, requestId: "", name: "" });
  const [declineReason, setDeclineReason] = useState("");
  const [selectedReasonModal, setSelectedReasonModal] = useState({ open: false, reason: "", name: "" });
  const [revokeModal, setRevokeModal] = useState({ open: false, request: null });
  const [revokeReason, setRevokeReason] = useState("");
  const [editModal, setEditModal] = useState({ open: false, request: null });
  const [editReason, setEditReason] = useState("");
  const [editLeaveType, setEditLeaveType] = useState("");
  const [editReasonText, setEditReasonText] = useState("");
  const [editRange, setEditRange] = useState();
  const [editExcluded, setEditExcluded] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [pendingLeaveConflictModal, setPendingLeaveConflictModal] = useState({
    open: false,
    dates: [],
    name: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const canRequestLeave = user?.role === "Admin" || user?.role === "Subadmin";
  const canReview = user?.role === "Admin" || user?.role === "Subadmin";

  const selectedAssigneeOption = useMemo(
    () => staffOptions.find((option) => option.value === selectedAssignee) || null,
    [staffOptions, selectedAssignee]
  );

  const filteredAssigneeOptions = useMemo(() => {
    const query = assigneeQuery.trim().toLowerCase();
    if (!query) return staffOptions;
    return staffOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [assigneeQuery, staffOptions]);

  const availableLeaveTypes = useMemo(() => {
    // If the selected start date is in the past, only Sick Leave is allowed
    if (leaveRange?.from) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (leaveRange.from < today) return ["Sick Leave"];
    }
    const sex = selectedAssigneeOption?.sex || "";
    return LEAVE_TYPE_OPTIONS[sex] || LEAVE_TYPE_OPTIONS.default;
  }, [selectedAssigneeOption, leaveRange]);

  const rangeDates = useMemo(() => buildRangeDates(leaveRange), [leaveRange]);

  useEffect(() => {
    setExcludedDates((prev) => prev.filter((date) => rangeDates.includes(date)));
  }, [rangeDates]);

  const includedDates = useMemo(
    () => rangeDates.filter((date) => !excludedDates.includes(date)),
    [excludedDates, rangeDates]
  );

  const disabledCalendarDates = useMemo(
    () => [...new Set([...existingLeaveDates, ...attendanceBlockedDates])].map(toLocalDate),
    [attendanceBlockedDates, existingLeaveDates]
  );

  const attendanceBlockedDateSet = useMemo(
    () => new Set(attendanceBlockedDates),
    [attendanceBlockedDates]
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
        { value: `${user.role}:${user._id}`, label: `${getEmployeeLabel(user, user.role)} (My leave)`, role: user.role, id: user._id, sex: user.sex || "" },
        ...((Array.isArray(adminsData) ? adminsData : [])
          .filter((admin) => admin._id !== user._id)
          .map((admin) => ({
            value: `Admin:${admin._id}`,
            label: `${getEmployeeLabel(admin, "Admin")} (Admin)`,
            role: "Admin",
            id: admin._id,
            sex: admin.sex || "",
          }))),
        ...((Array.isArray(subadminsData) ? subadminsData : [])
          .filter((staff) => staff._id !== user._id)
          .map((staff) => ({
            value: `Subadmin:${staff._id}`,
            label: `${getEmployeeLabel(staff, "Subadmin")} (Subadmin)`,
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
    if (selectedAssigneeOption) {
      setAssigneeQuery(selectedAssigneeOption.label);
    } else if (!selectedAssignee) {
      setAssigneeQuery("");
    }
  }, [selectedAssignee, selectedAssigneeOption]);

  useEffect(() => {
    if (!availableLeaveTypes.includes(leaveType)) {
      setLeaveType(availableLeaveTypes[0] || "");
    }
  }, [availableLeaveTypes, leaveType]);

  useEffect(() => {
    if (!selectedAssigneeOption) {
      setExistingLeaveDates([]);
      setAttendanceBlockedDates([]);
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

  useEffect(() => {
    const loadAttendanceDates = async () => {
      if (!selectedAssigneeOption?.id || !selectedAssigneeOption?.role) {
        setAttendanceBlockedDates([]);
        return;
      }

      try {
        const endpoint =
          selectedAssigneeOption.role === "Guard"
            ? `${api}/api/attendance/${selectedAssigneeOption.id}`
            : `${api}/api/admin-attendance/user/${selectedAssigneeOption.id}`;

        const response = await fetch(endpoint, { credentials: "include" });
        if (!response.ok) {
          setAttendanceBlockedDates([]);
          return;
        }

        const data = await response.json();
        const records = Array.isArray(data) ? data : data?.items || [];
        const blockedDates = records
          .map((record) =>
            selectedAssigneeOption.role === "Guard"
              ? toManilaDateKey(record.timeIn || record.createdAt)
              : record.dateKey || toManilaDateKey(record.timeIn || record.createdAt)
          )
          .filter(Boolean);

        setAttendanceBlockedDates([...new Set(blockedDates)].sort());
      } catch (error) {
        console.error("Failed to load attendance dates:", error);
        setAttendanceBlockedDates([]);
      }
    };

    loadAttendanceDates();
  }, [selectedAssigneeOption?.id, selectedAssigneeOption?.role]);

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
    if (selectedAssigneeOption) {
      setAssigneeQuery(selectedAssigneeOption.label);
    }
    setIsAssigneeDropdownOpen(false);
  };

  const getRequestDisplayName = useCallback(
    (request) => (request.guard ? getPersonName(request.guard) : getEmployeeLabel(request.staff, request.requesterRole)),
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!leaveRange?.from || !leaveRange?.to || includedDates.length === 0 || !leaveType || !reason.trim()) {
      toast.error("Please provide a valid leave range, leave type, and reason.");
      return;
    }

    const attendanceConflictDates = includedDates.filter((date) => attendanceBlockedDateSet.has(date));
    if (attendanceConflictDates.length > 0) {
      toast.error(
        `Leave dates already have attendance records: ${attendanceConflictDates.join(", ")}.`
      );
      return;
    }

    if (!selectedAssigneeOption) {
      toast.error("Select the personnel for this leave request.");
      return;
    }

    const pendingLeaveConflictDates = requests
      .filter((request) => {
        if (request.status !== "Pending") return false;
        const matchesRole = request.requesterRole === selectedAssigneeOption.role;
        const targetId = selectedAssigneeOption.role === "Guard" ? request.guard?._id : request.staff?._id;
        return matchesRole && targetId === selectedAssigneeOption.id;
      })
      .flatMap((request) => request.dates || [])
      .filter((date) => includedDates.includes(date));

    const uniquePendingLeaveConflictDates = [...new Set(pendingLeaveConflictDates)].sort();
    if (uniquePendingLeaveConflictDates.length > 0) {
      setPendingLeaveConflictModal({
        open: true,
        dates: uniquePendingLeaveConflictDates,
        name: getEmployeeLabel(selectedAssigneeOption, selectedAssigneeOption.role),
      });
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

  const openApproveModal = (request) => {
    setApproveModal({ open: true, request });
  };

  const closeApproveModal = () => {
    if (reviewingId) return;
    setApproveModal({ open: false, request: null });
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

  const submitApprove = async () => {
    const request = approveModal.request;
    if (!request?._id) return;

    const didSucceed = await handleReview(request._id, "Approved");
    if (didSucceed) {
      setApproveModal({ open: false, request: null });
    }
  };

  // ---- Revoke helpers ----
  const openRevokeModal = (request) => {
    setRevokeModal({ open: true, request });
    setRevokeReason("");
  };
  const closeRevokeModal = () => {
    if (editingId) return;
    setRevokeModal({ open: false, request: null });
    setRevokeReason("");
  };
  const submitRevoke = async () => {
    const trimmed = revokeReason.trim();
    if (!trimmed) { toast.error("A revoke reason is required."); return; }
    const id = revokeModal.request?._id;
    setEditingId(id);
    try {
      const res = await fetch(`${api}/api/leaves/${id}/revoke`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeReason: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to revoke.");
      toast.success("Leave revoked.");
      setRevokeModal({ open: false, request: null });
      setRevokeReason("");
      await fetchRequests();
    } catch (err) {
      toast.error(err.message || "Failed to revoke leave.");
    } finally {
      setEditingId("");
    }
  };

  // ---- Edit helpers ----
  const openEditModal = (request) => {
    setEditModal({ open: true, request });
    setEditReason("");
    setEditLeaveType(request.leaveType || "");
    setEditReasonText(request.reason || "");
    setEditExcluded(request.excludedDates || []);
    if (request.startDate && request.endDate) {
      setEditRange({
        from: new Date(`${request.startDate}T00:00:00`),
        to: new Date(`${request.endDate}T00:00:00`),
      });
    } else if (request.dates?.length) {
      const sorted = [...request.dates].sort();
      setEditRange({
        from: new Date(`${sorted[0]}T00:00:00`),
        to: new Date(`${sorted[sorted.length - 1]}T00:00:00`),
      });
    } else {
      setEditRange(undefined);
    }
  };
  const closeEditModal = () => {
    if (editingId) return;
    setEditModal({ open: false, request: null });
    setEditReason("");
    setEditRange(undefined);
    setEditExcluded([]);
  };

  const editRangeDates = useMemo(() => buildRangeDates(editRange), [editRange]);
  useEffect(() => {
    setEditExcluded((prev) => prev.filter((d) => editRangeDates.includes(d)));
  }, [editRangeDates]);
  const editIncludedDates = useMemo(
    () => editRangeDates.filter((d) => !editExcluded.includes(d)),
    [editRangeDates, editExcluded]
  );
  const toggleEditExcluded = (date) => {
    if (!editRangeDates.includes(date)) return;
    setEditExcluded((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
    );
  };

  const submitEdit = async () => {
    const trimmedReason = editReason.trim();
    if (!trimmedReason) { toast.error("An edit reason is required."); return; }
    if (!editRange?.from || !editRange?.to || editIncludedDates.length === 0) {
      toast.error("Please select a valid date range with at least one included date.");
      return;
    }
    const id = editModal.request?._id;
    setEditingId(id);
    try {
      const res = await fetch(`${api}/api/leaves/${id}/edit`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: toDateOnly(editRange.from),
          endDate: toDateOnly(editRange.to),
          excludedDates: editExcluded,
          dates: editIncludedDates,
          leaveType: editLeaveType,
          reason: editReasonText.trim() || editModal.request?.reason,
          editReason: trimmedReason,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to save edits.");
      toast.success("Leave updated.");
      closeEditModal();
      await fetchRequests();
    } catch (err) {
      toast.error(err.message || "Failed to save edits.");
    } finally {
      setEditingId("");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, roleFilter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

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

      {selectedReasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-[#1e293b] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <h3 className="text-base font-semibold text-white">Leave Reason</h3>
              <button
                onClick={() => setSelectedReasonModal({ open: false, reason: "", name: "" })}
                className="text-slate-400 hover:text-white transition rounded p-1 hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Requested by {selectedReasonModal.name}
            </div>
            <div className="text-sm leading-6 text-slate-200 whitespace-pre-wrap break-words bg-slate-900/60 p-4 rounded-xl border border-slate-800 max-h-[220px] overflow-y-auto scrollbar-thin">
              {selectedReasonModal.reason}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedReasonModal({ open: false, reason: "", name: "" })}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition shadow-md shadow-blue-600/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-8xl space-y-6">
        {approveModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#162131] shadow-2xl shadow-black/40">
              <div className="border-b border-emerald-500/10 bg-[linear-gradient(135deg,rgba(5,150,105,0.18),rgba(30,41,59,0.92))] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Approve Leave Request</div>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {approveModal.request ? getRequestDisplayName(approveModal.request) : "Leave Request"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Review the leave coverage below before marking this request as approved.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeApproveModal}
                    disabled={Boolean(reviewingId)}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                <InfoCard compact label="Personnel" value={approveModal.request ? getRequestDisplayName(approveModal.request) : "N/A"} />
                <InfoCard compact label="Role" value={approveModal.request?.requesterRole || "N/A"} />
                <InfoCard compact label="Leave Type" value={approveModal.request?.leaveType || "Unspecified"} />
                <InfoCard compact label="Included Dates" value={`${approveModal.request?.dates?.length || 0} day${(approveModal.request?.dates?.length || 0) === 1 ? "" : "s"}`} />
                <InfoCard compact label="Range Start" value={approveModal.request?.startDate || approveModal.request?.dates?.[0] || "N/A"} />
                <InfoCard compact label="Range End" value={approveModal.request?.endDate || approveModal.request?.dates?.[approveModal.request?.dates?.length - 1] || "N/A"} />
              </div>

              <div className="px-6 pb-6">
                <div className="rounded-2xl border border-slate-700 bg-[#0f172a] p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</div>
                  <p className="text-sm leading-6 text-slate-300">{approveModal.request?.reason || "No reason provided."}</p>
                </div>

                {approveModal.request?.dates?.length ? (
                  <div className="mt-4 rounded-2xl border border-slate-700 bg-[#0f172a] p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Approved Dates</div>
                    <div className="flex flex-wrap gap-2">
                      {approveModal.request.dates.map((date) => (
                        <span key={date} className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                          {format(new Date(`${date}T00:00:00`), "MMM dd, yyyy")}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-700 bg-[#132033] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeApproveModal}
                  disabled={Boolean(reviewingId)}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitApprove}
                  disabled={Boolean(reviewingId)}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reviewingId === approveModal.request?._id ? "Approving..." : "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}

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
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shadow-lg shadow-blue-900/20"
              >
                <Plus size={18} />
                New Leave Request
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

        {pendingLeaveConflictModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0f172a] shadow-2xl shadow-black/50">
              <div className="flex items-start justify-between gap-4 border-b border-amber-500/10 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(15,23,42,0.98))] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Pending Leave Conflict</div>
                    <h3 className="mt-1 text-xl font-semibold text-white">Selected dates already have a pending leave</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {pendingLeaveConflictModal.name} already has a pending leave request on the selected date(s).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingLeaveConflictModal({ open: false, dates: [], name: "" })}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
                  <div className="text-sm font-medium text-amber-200">Conflicting pending leave dates</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pendingLeaveConflictModal.dates.map((date) => (
                      <span
                        key={date}
                        className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100"
                      >
                        {format(toLocalDate(date), "MMM dd, yyyy")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPendingLeaveConflictModal({ open: false, dates: [], name: "" })}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-500"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Request Modal */}
        {showLeaveModal && (
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
                  onClick={() => { setShowLeaveModal(false); resetForm(); }}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={async (e) => { await handleSubmit(e); if (!submitting) setShowLeaveModal(false); }} className="grid gap-6 xl:grid-cols-[340px_1fr]">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assign To</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                          <Search size={16} />
                        </div>
                        <input
                          type="text"
                          value={assigneeQuery}
                          onChange={(event) => { setAssigneeQuery(event.target.value); setIsAssigneeDropdownOpen(true); }}
                          onFocus={() => setIsAssigneeDropdownOpen(true)}
                          onBlur={() => { window.setTimeout(() => { setIsAssigneeDropdownOpen(false); if (selectedAssigneeOption) { setAssigneeQuery(selectedAssigneeOption.label); } }, 120); }}
                          placeholder="Search guard or staff"
                          className="w-full rounded-lg border border-gray-700 bg-[#1e293b] pl-11 pr-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/60"
                        />
                        {isAssigneeDropdownOpen && (
                          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-700 bg-[#0b1220] shadow-2xl">
                            {filteredAssigneeOptions.length ? (
                              filteredAssigneeOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onMouseDown={() => { setSelectedAssignee(option.value); setAssigneeQuery(option.label); setIsAssigneeDropdownOpen(false); }}
                                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                                    selectedAssignee === option.value ? "bg-blue-500/15 text-blue-100" : "text-slate-200 hover:bg-slate-800"
                                  }`}
                                >
                                  <span className="truncate">{option.label}</span>
                                  {selectedAssignee === option.value ? (
                                    <span className="shrink-0 rounded-full bg-blue-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-300">Selected</span>
                                  ) : null}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-400">No personnel found.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-700 bg-[#1e293b] p-3">
                      <DayPicker mode="range" selected={leaveRange} onSelect={setLeaveRange} disabled={disabledCalendarDates} />
                      <p className="mt-3 text-xs text-slate-500">
                        Dates with leave or attendance records are disabled for the selected personnel.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <InfoCard label="Range Start" value={leaveRange?.from ? format(leaveRange.from, "MMM dd, yyyy") : "Not set"} />
                      <InfoCard label="Range End" value={leaveRange?.to ? format(leaveRange.to, "MMM dd, yyyy") : "Not set"} />
                      <InfoCard label="Included" value={`${includedDates.length} day${includedDates.length === 1 ? "" : "s"}`} />
                      <InfoCard label="Excluded" value={`${excludedDates.length} day${excludedDates.length === 1 ? "" : "s"}`} />
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
                              className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-red-400/50 hover:text-red-300">
                              {format(new Date(`${date}T00:00:00`), "MMM dd, yyyy")}<X size={12} />
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
                                className="inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20">
                                {format(new Date(`${date}T00:00:00`), "MMM dd, yyyy")}<CheckCircle size={12} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Type of Leave</label>
                      <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} required
                        className="w-full rounded-lg border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/60">
                        {availableLeaveTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Reason</label>
                      <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5}
                        placeholder="Provide the reason for this leave request."
                        className="w-full resize-none rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/60" />
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => { setShowLeaveModal(false); resetForm(); }}
                        className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">Cancel</button>
                      <button type="submit" disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
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
                  className="w-full rounded-lg border border-gray-700 bg-white py-3 pl-12 pr-4 text-sm text-black placeholder:text-slate-500 outline-none transition focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2">
                  <Filter size={14} className="text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="bg-transparent text-sm text-black outline-none"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2">
                  <Shield size={14} className="text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="bg-transparent text-sm text-black outline-none"
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
              <div className="overflow-x-auto bg-[#1e293b] rounded-xl border border-gray-700 scrollbar-thin">
                <table className="w-full min-w-[1150px] text-left border-collapse">
                  <thead className="bg-[#0f172a] text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">#</th>
                      <th className="px-6 py-4 font-semibold">Personnel</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Range</th>
                      <th className="px-6 py-4 font-semibold text-center">Included</th>
                      <th className="px-6 py-4 font-semibold">Leave Type</th>
                      <th className="px-6 py-4 font-semibold max-w-[160px]">Reason</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      {canReview && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {paginatedRequests.map((request, index) => {
                      const globalIndex = (currentPage - 1) * PAGE_SIZE + index + 1;
                      return (
                      <tr key={request._id} className="group hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 text-sm text-gray-400">{globalIndex}</td>
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
                        <td className="px-6 py-4 text-sm text-gray-300 max-w-[160px]">
                          {request.reason.length > 25 ? (
                            <button
                              onClick={() => setSelectedReasonModal({ open: true, reason: request.reason, name: getRequestDisplayName(request) })}
                              className="text-left font-medium text-blue-400 hover:text-blue-300 hover:underline cursor-pointer transition break-all leading-6"
                              title="Click to view full reason"
                            >
                              {request.reason.slice(0, 22)}...
                            </button>
                          ) : (
                            <p className="break-all leading-6">{request.reason}</p>
                          )}
                          {request.reviewRemarks ? (
                            <p className="mt-2 text-xs text-gray-500 break-all leading-relaxed" title={request.reviewRemarks}>
                              Review note: <span className="text-slate-300">{request.reviewRemarks}</span>
                            </p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={request.status} />
                            {request.editHistory?.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-400">
                                <History size={10} />
                                Edited {request.editHistory.length}×
                              </span>
                            )}
                          </div>
                        </td>
                        {canReview && (
                          <td className="px-6 py-4 text-right">
                            {request.status === "Pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openApproveModal(request)} disabled={reviewingId === request._id} className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition" title="Approve">
                                  <CheckCircle size={18} />
                                </button>
                                <button onClick={() => openDeclineModal(request)} disabled={reviewingId === request._id} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition" title="Decline">
                                  <XCircle size={18} />
                                </button>
                              </div>
                            ) : request.status === "Approved" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openEditModal(request)} disabled={editingId === request._id} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition" title="Edit Leave">
                                  <Pencil size={16} />
                                </button>
                                <button onClick={() => openRevokeModal(request)} disabled={editingId === request._id} className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition" title="Revoke Leave">
                                  <ShieldOff size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Processed</span>
                            )}
                          </td>
                        )}
                      </tr>
                      );
                    })}
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
              paginatedRequests.map((request, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index + 1;
                return (
                <div key={request._id} className="rounded-xl border border-gray-700 bg-[#0f172a] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-slate-900">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">#{globalIndex}</p>
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
                      <button onClick={() => openApproveModal(request)} disabled={reviewingId === request._id} className="flex-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 px-4 py-2.5 text-sm font-medium text-green-500 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => openDeclineModal(request)} disabled={reviewingId === request._id} className="flex-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  )}
                  {canReview && request.status === "Approved" && (
                    <div className="mt-5 flex gap-2">
                      <button onClick={() => openEditModal(request)} disabled={editingId === request._id} className="flex-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => openRevokeModal(request)} disabled={editingId === request._id} className="flex-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2.5 text-sm font-medium text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                        <ShieldOff size={14} /> Revoke
                      </button>
                    </div>
                  )}
                  {request.editHistory?.length > 0 && (
                    <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-400"><History size={10} /> Edit History</p>
                      <ul className="space-y-1.5">
                        {request.editHistory.map((h, i) => (
                          <li key={i} className="text-xs text-slate-400">
                            <span className="font-medium text-slate-200">{h.editedBy?.name || "Admin"}</span>{" — "}{h.editReason}{" on "}{h.editedAt ? format(new Date(h.editedAt), "MMM dd, yyyy") : "–"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>

          {filteredRequests.length > 0 && (
            <TablePagination
              page={currentPage}
              limit={PAGE_SIZE}
              totalItems={filteredRequests.length}
              currentCount={paginatedRequests.length}
              totalPages={Math.ceil(filteredRequests.length / PAGE_SIZE)}
              label="leave requests"
              onPageChange={setCurrentPage}
              className="px-4"
            />
          )}
        </section>
      </div>

      {/* REVOKE MODAL */}
      {revokeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-orange-500/20 bg-[#162131] shadow-2xl">
            <div className="border-b border-orange-500/10 bg-[linear-gradient(135deg,rgba(234,88,12,0.15),rgba(30,41,59,0.92))] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-orange-300">Revoke Leave</div>
                  <h3 className="mt-1.5 text-lg font-semibold text-white">{revokeModal.request ? getRequestDisplayName(revokeModal.request) : ""}</h3>
                  <p className="mt-1 text-xs text-slate-400">{revokeModal.request?.leaveType} &middot; {revokeModal.request?.dates?.length} day{revokeModal.request?.dates?.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={closeRevokeModal} disabled={Boolean(editingId)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition disabled:opacity-50">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-orange-400/20 bg-orange-400/5 p-3 text-sm text-orange-200">
                Revoking this leave will change its status to <strong>Revoked</strong>. The guard/staff will no longer be considered on leave for these dates.
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Reason for Revocation <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this leave is being revoked..."
                  className="w-full rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={closeRevokeModal} disabled={Boolean(editingId)} className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Cancel</button>
                <button
                  onClick={submitRevoke}
                  disabled={!revokeReason.trim() || Boolean(editingId)}
                  className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editingId ? <RefreshCcw size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                  {editingId ? "Revoking…" : "Revoke Leave"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#162131] shadow-2xl">
            <div className="sticky top-0 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.15),rgba(30,41,59,0.97))] px-6 py-5 z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-blue-300">Edit Approved Leave</div>
                  <h3 className="mt-1.5 text-lg font-semibold text-white">{editModal.request ? getRequestDisplayName(editModal.request) : ""}</h3>
                  <p className="mt-1 text-xs text-slate-400">Changes will be logged in the edit history.</p>
                </div>
                <button onClick={closeEditModal} disabled={Boolean(editingId)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition disabled:opacity-50">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Leave Type */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Leave Type</label>
                <select value={editLeaveType} onChange={(e) => setEditLeaveType(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none">
                  {["Sick Leave", "Vacation Leave", "Paternity Leave", "Maternity Leave"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Date Range <span className="normal-case font-normal text-slate-500">(click selected days to toggle exclusion)</span>
                </label>
                <div className="rounded-xl border border-slate-700 bg-[#0f172a] p-2 flex justify-center">
                  <DayPicker
                    mode="range"
                    selected={editRange}
                    onSelect={setEditRange}
                    modifiers={{ excluded: editRangeDates.filter((d) => editExcluded.includes(d)).map((d) => new Date(`${d}T00:00:00`)) }}
                    modifiersClassNames={{ excluded: "rdp-day_excluded" }}
                    onDayClick={(day) => { const k = format(day, "yyyy-MM-dd"); if (editRangeDates.includes(k)) toggleEditExcluded(k); }}
                  />
                </div>
                {editRangeDates.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">{editIncludedDates.length} of {editRangeDates.length} day{editRangeDates.length !== 1 ? "s" : ""} included</p>
                )}
              </div>

              {/* Leave Reason */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Leave Reason</label>
                <textarea value={editReasonText} onChange={(e) => setEditReasonText(e.target.value)} rows={2} placeholder="Reason for leave..." className="w-full rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:outline-none resize-none" />
              </div>

              {/* Edit Reason — required, stored in history */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Reason for Edit <span className="text-red-400">*</span>
                  <span className="ml-2 normal-case font-normal text-slate-500">(logged in history)</span>
                </label>
                <textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={2} placeholder="Why are you editing this leave record?" className="w-full rounded-xl border border-blue-500/20 bg-[#0f172a] px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none" />
              </div>

              {/* Previous edits */}
              {editModal.request?.editHistory?.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    <History size={11} /> Previous Edits
                  </p>
                  <ul className="space-y-3">
                    {editModal.request.editHistory.map((h, i) => (
                      <li key={i} className="text-xs">
                        <div className="font-semibold text-slate-200">{h.editedBy?.name || "Admin"}</div>
                        <div className="mt-0.5 text-slate-400">&ldquo;{h.editReason}&rdquo;</div>
                        <div className="mt-0.5 text-slate-600">{h.editedAt ? format(new Date(h.editedAt), "MMM dd, yyyy · HH:mm") : "–"}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeEditModal} disabled={Boolean(editingId)} className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Cancel</button>
                <button
                  onClick={submitEdit}
                  disabled={!editReason.trim() || editIncludedDates.length === 0 || Boolean(editingId)}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editingId ? <RefreshCcw size={14} className="animate-spin" /> : <Pencil size={14} />}
                  {editingId ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
