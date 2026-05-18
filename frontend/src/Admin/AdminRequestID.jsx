import React, { useState, useEffect, Fragment } from "react";
import {
  IdCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Calendar,
  FileX,
  User,
  FileText,
  Lock,
  MessageSquare,
  Plus,
  Trash2,
  X
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import TablePagination from "../components/admin/TablePagination.jsx";
import { getPersonName } from "../utils/name";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const api = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const todayDateOnly = new Date().toISOString().split("T")[0];
const getEmployeeDisplayName = (person, fallbackRole = "") => {
  if (!person) return fallbackRole || "Unknown";
  const firstName = person.firstName?.trim() || "";
  const lastName = person.lastName?.trim() || "";
  const combined = `${firstName} ${lastName}`.trim();
  return combined || person.name?.trim() || fallbackRole || "Unknown";
};

export default function RequestedIDs() {
  const { user, loading } = useAuth(); 
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Modal States
  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  // Form States
  const [pickupDate, setPickupDate] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [createTarget, setCreateTarget] = useState("");
  const [createRequestType, setCreateRequestType] = useState("");
  const [createRequestReason, setCreateRequestReason] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, request: null });
  const [deletingId, setDeletingId] = useState("");

  // --- ROLE CHECK ---
  const canManage = user?.role === "Admin" || user?.role === "Subadmin"; 
  const canCreateForOthers = user?.role === "Admin" || user?.role === "Subadmin";

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      if (!loading && !user) {
        navigate("/admin/login");
        return;
      }

      setLoadingPage(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });

      if (search.trim()) params.set("q", search.trim());
      if (filter !== "All") params.set("status", filter);

      const res = await fetch(`${api}/api/idrequests?${params.toString()}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setRequests(result.data);
        setTotalItems(result.total || result.count || 0);
        setTotalPages(result.totalPages || 1);
        setSelectedIds([]); // Clear selection on fetch
      } else {
        setRequests([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("❌ Failed to load ID requests:", err);
      toast.error("Failed to load ID requests.");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user, currentPage, search, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (!canCreateForOthers) return;

    const fetchStaffOptions = async () => {
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
          ...((Array.isArray(adminsData) ? adminsData : []).map((staff) => ({
            value: `admin:${staff._id}`,
            label: `${getEmployeeDisplayName(staff, "Admin")} (Admin)`,
            role: "admin",
            id: staff._id,
          }))),
          ...((Array.isArray(subadminsData) ? subadminsData : []).map((staff) => ({
            value: `subadmin:${staff._id}`,
            label: `${getEmployeeDisplayName(staff, "Subadmin")} (Subadmin)`,
            role: "subadmin",
            id: staff._id,
          }))),
          ...((Array.isArray(guardsData) ? guardsData : []).map((guard) => ({
            value: `guard:${guard._id}`,
            label: `${getPersonName(guard)} (${guard.guardId || "Guard"})`,
            role: "guard",
            id: guard._id,
          }))),
        ];

        setStaffOptions(options);
        setCreateTarget((current) => current || options[0]?.value || "");
      } catch (error) {
        console.error("Failed to load employee options:", error);
        toast.error("Failed to load employee options.");
      }
    };

    fetchStaffOptions();
  }, [canCreateForOthers]);

  const selectedCreateTarget = staffOptions.find((option) => option.value === createTarget) || null;

  // Selection handlers
  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map(r => r._id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`${api}/api/idrequests`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || "Failed to delete requests");
      }

      toast.success(`Successfully deleted ${selectedIds.length} request(s)`);
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      await fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error deleting requests");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers
  const handleApproveID = (id) => {
    if (!canManage) return; 
    setSelectedId(id);
    setPickupDate("");
    setApproveNotes("");
    setApproveModal(true);
  };

  const handleDeclineID = (id) => {
    if (!canManage) return; 
    setSelectedId(id);
    setDeclineReason("");
    setDeclineModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!pickupDate) {
      toast.error("Please select a pickup date.");
      return;
    }
    if (pickupDate < todayDateOnly) {
      toast.error("Pickup date cannot be in the past.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${api}/api/idrequests/${selectedId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Approved",
          pickupDate,
          adminRemarks: approveNotes,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === selectedId
              ? { ...r, status: "Approved", pickupDate, adminRemarks: approveNotes }
              : r
          )
        );
        setApproveModal(false);
        toast.success("ID request approved.");
      }
    } catch (err) {
      console.error("Error approving ID:", err);
      toast.error("Failed to approve ID request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${api}/api/idrequests/${selectedId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Declined", adminRemarks: declineReason }),
      });
      const result = await res.json();

      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === selectedId
              ? { ...r, status: "Declined", adminRemarks: declineReason }
              : r
          )
        );
        setDeclineModal(false);
        toast.success("ID request declined.");
      }
    } catch (err) {
      console.error("Error declining ID:", err);
      toast.error("Failed to decline ID request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedCreateTarget || !createRequestType.trim() || !createRequestReason.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${api}/api/idrequests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: createRequestType.trim(),
          requestReason: createRequestReason.trim(),
          targetRole: selectedCreateTarget.role,
          targetId: selectedCreateTarget.id,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to create ID request.");
      }

      setShowCreateModal(false);
      setCreateRequestType("");
      setCreateRequestReason("");
      toast.success("ID request created successfully.");
      await fetchRequests();
    } catch (error) {
      console.error("Error creating ID request:", error);
      toast.error(error.message || "Failed to create ID request.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (request) => {
    setDeleteModal({ open: true, request });
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteModal({ open: false, request: null });
  };

  const handleDeleteRequest = async () => {
    const request = deleteModal.request;
    if (!request?._id) return;

    try {
      setDeletingId(request._id);
      const res = await fetch(`${api}/api/idrequests/${request._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || "Failed to delete ID request.");
      }

      setDeleteModal({ open: false, request: null });
      toast.success("ID request deleted.");
      await fetchRequests();
    } catch (error) {
      console.error("Error deleting ID request:", error);
      toast.error(error.message || "Failed to delete ID request.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900/50 text-gray-100 font-sans">
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
      <div className="flex-1 flex flex-col p-4 md:p-6">
        
        {/* ===== Header ===== */}
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <IdCard className="text-blue-500" size={28}/> 
             </div>
             <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Requested IDs</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-slate-400 text-sm">
                    Manage ID issuance and renewals. 
                  </p>
                  {!canManage && <span className="text-yellow-500 ml-2 text-xs border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 rounded">View Only</span>}
                </div>
             </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name..."
                className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 
                text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchRequests}
              className="px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
              title="Refresh List"
            >
              <RefreshCw className="size-5" />
            </button>
            {canCreateForOthers && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition whitespace-nowrap shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Create Request
              </button>
            )}
          </div>
        </header>

        {/* ===== Content ===== */}
        {loadingPage ? (
           <div className="flex flex-col items-center justify-center py-20 text-blue-400 animate-pulse">
             <IdCard size={40} className="mb-4 opacity-50" />
             <p>Loading requests...</p>
           </div>
        ) : requests.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-gray-800 border-dashed">
             <FileText size={48} className="mb-4 opacity-20" />
             <p>No ID requests found.</p>
           </div>
        ) : (
          <>
            {/* --- DESKTOP TABLE --- */}
            <div className="hidden md:block overflow-hidden bg-[#1e293b]/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0f172a]/50 text-gray-400 border-b border-gray-700/50 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-16">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={requests.length > 0 && selectedIds.length === requests.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>#</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold">User Details</th>
                    <th className="px-6 py-4 font-semibold">Request Type</th>
                    <th className="px-6 py-4 font-semibold">Date Requested</th>
                    <th className="px-6 py-4 font-semibold">Pickup Date</th>
                    <th className="px-6 py-4 font-semibold">Admin Notes</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">{canManage ? "Actions" : ""}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {requests.map((req, index) => (
                    <tr 
                      key={req._id} 
                      className={`transition group ${selectedIds.includes(req._id) ? 'bg-blue-600/5' : 'hover:bg-white/5'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={selectedIds.includes(req._id)}
                            onChange={() => handleSelectRow(req._id)}
                            className="w-4 h-4 rounded border-gray-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-400">
                            {(currentPage - 1) * PAGE_SIZE + index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-gray-300 border border-slate-600">
                             <User size={16} />
                          </div>
                          <div>
                             <div className="font-medium text-white">
                                {req.guard ? getPersonName(req.guard) : getEmployeeDisplayName(req.admin, req.admin?.role)}
                             </div>
                             <div className="text-xs text-blue-400">
                                {req.guard?.position || req.admin?.role || "N/A"}
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-200">{req.requestType}</div>
                        <div className="text-xs text-gray-500 italic max-w-[150px] truncate" title={req.requestReason}>
                            {req.requestReason}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      
                      {/* PICKUP DATE COLUMN */}
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {req.pickupDate ? (
                            <div className="flex items-center gap-1.5 text-green-400">
                                <Calendar size={14}/>
                                {new Date(req.pickupDate).toLocaleDateString()}
                            </div>
                        ) : (
                            <span className="text-gray-600 italic text-xs">--</span>
                        )}
                      </td>

                      {/* ADMIN NOTES COLUMN */}
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {req.adminRemarks ? (
                            <div className="flex items-start gap-1.5 max-w-[200px]" title={req.adminRemarks}>
                                <MessageSquare size={14} className="mt-0.5 text-blue-400 shrink-0"/>
                                <span className="truncate text-xs text-gray-400">{req.adminRemarks}</span>
                            </div>
                        ) : (
                            <span className="text-gray-600 italic text-xs">--</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                         {canManage ? (
                           <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => handleApproveID(req._id)}
                               disabled={req.status !== "Pending"}
                               className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                               title="Approve"
                             >
                               <CheckCircle size={18} />
                             </button>
                            <button
                              onClick={() => handleDeclineID(req._id)}
                              disabled={req.status !== "Pending"}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Decline"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(req)}
                              className="p-2 bg-slate-700/60 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                         ) : (
                           <div className="text-xs text-gray-600 italic">View only</div>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- MOBILE CARDS --- */}
            <div className="md:hidden grid gap-4">
               {requests.map((req, index) => (
                 <div 
                  key={req._id} 
                  className={`bg-[#1e293b] border transition-colors ${selectedIds.includes(req._id) ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700'} rounded-xl p-4 shadow-sm flex flex-col gap-4`}
                 >
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <input 
                           type="checkbox"
                           checked={selectedIds.includes(req._id)}
                           onChange={() => handleSelectRow(req._id)}
                           className="w-5 h-5 rounded border-gray-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                         />
                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                            <User size={20} />
                         </div>
                         <div>
                            <p className="text-xs font-medium text-gray-500">#{(currentPage - 1) * PAGE_SIZE + index + 1}</p>
                            <h3 className="font-semibold text-white">
                                {req.guard ? getPersonName(req.guard) : getEmployeeDisplayName(req.admin, req.admin?.role)}
                            </h3>
                            <span className="text-xs text-blue-400">
                                {req.guard?.position || req.admin?.role}
                            </span>
                         </div>
                      </div>
                      <StatusBadge status={req.status} />
                   </div>
                   
                   <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm border border-gray-800">
                      <div className="flex justify-between">
                         <span className="text-gray-500">Type</span>
                         <span className="text-gray-200">{req.requestType}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-500">Requested</span>
                         <span className="text-gray-200">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Mobile View of New Fields */}
                      {req.pickupDate && (
                          <div className="flex justify-between text-green-400">
                             <span className="text-gray-500">Pickup Date</span>
                             <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(req.pickupDate).toLocaleDateString()}</span>
                          </div>
                      )}
                      
                      {req.adminRemarks && (
                         <div className="pt-2 mt-2 border-t border-gray-800">
                            <span className="text-gray-500 text-xs block mb-1">Admin Notes:</span>
                            <p className="text-gray-300 italic text-xs">{req.adminRemarks}</p>
                         </div>
                      )}

                      {req.requestReason && (
                         <div className="pt-2 mt-2 border-t border-gray-800">
                            <span className="text-gray-500 text-xs block mb-1">User Reason:</span>
                            <p className="text-gray-300 italic text-xs">{req.requestReason}</p>
                         </div>
                      )}
                   </div>

                   {canManage && req.status === "Pending" && (
                      <div className="grid grid-cols-3 gap-3">
                         <button
                           onClick={() => handleApproveID(req._id)}
                           className="flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition"
                         >
                           <CheckCircle size={16} /> Approve
                         </button>
                         <button
                           onClick={() => handleDeclineID(req._id)}
                           className="flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition group"
                         >
                           <XCircle size={16} className="text-gray-400 group-hover:text-white" /> Decline
                         </button>
                         <button
                           onClick={() => openDeleteModal(req)}
                           className="flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition group"
                         >
                           <Trash2 size={16} className="text-gray-400 group-hover:text-white" /> Delete
                         </button>
                      </div>
                   )}

                   {canManage && req.status !== "Pending" && (
                      <button
                        onClick={() => openDeleteModal(req)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={16} /> Delete Request
                      </button>
                   )}
                   
                   {!canManage && (
                      <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Lock size={12}/> Admin access required to manage
                      </div>
                   )}
                 </div>
               ))}
            </div>

            <TablePagination
              page={currentPage}
              limit={PAGE_SIZE}
              totalItems={totalItems}
              currentCount={requests.length}
              totalPages={totalPages}
              label="ID requests"
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300 px-4 w-full max-w-lg">
            <div className="flex items-center gap-3 bg-[#0f172a]/95 backdrop-blur-xl border border-blue-500/20 rounded-2xl px-5 py-3 shadow-2xl shadow-black/60">
              <div className="flex items-center gap-2 bg-blue-600/15 border border-blue-500/25 rounded-xl px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
                <span className="text-sm font-bold text-blue-300">{selectedIds.length} selected</span>
              </div>
              <div className="w-px h-5 bg-slate-700"/>
              <button onClick={handleSelectAll} className="text-xs font-medium text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition">
                {selectedIds.length === requests.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="flex-1"/>
              <button onClick={() => setShowBulkDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-bold transition shadow-lg shadow-red-900/30">
                <Trash2 size={14}/> Delete {selectedIds.length}
              </button>
              <button onClick={() => setSelectedIds([])} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-white/8 transition" title="Clear selection">
                <X size={14}/>
              </button>
            </div>
          </div>
        )}

        {/* ===== Bulk Delete Modal ===== */}
        <Transition appear show={showBulkDeleteModal} as={Fragment}>
          <Dialog as="div" className="relative z-[70]" onClose={() => setShowBulkDeleteModal(false)}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-[#1e293b] border border-red-500/20 rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <div className="text-center">
                  <div className="mx-auto bg-red-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="text-red-400" size={24} />
                  </div>
                  <Dialog.Title className="text-lg font-bold text-white mb-2">Delete Selected?</Dialog.Title>
                  <p className="text-sm text-gray-400 mb-6">
                    Are you sure you want to delete <span className="text-white font-medium">{selectedIds.length}</span> request(s)? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowBulkDeleteModal(false)} 
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleBulkDelete} 
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-red-900/20 transition disabled:opacity-50"
                    >
                      {submitting ? "Deleting..." : "Delete All"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* ===== Create Request Modal ===== */}
        <Transition appear show={showCreateModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowCreateModal(false)}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl p-6 max-w-xl w-full">
                <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <IdCard className="text-blue-500" /> Create ID Request
                </Dialog.Title>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Assign To</label>
                    <select
                      value={createTarget}
                      onChange={(e) => setCreateTarget(e.target.value)}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      {staffOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Request Type</label>
                    <select
                      value={createRequestType}
                      onChange={(e) => setCreateRequestType(e.target.value)}
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      <option value="">Select request type</option>
                      <option value="ID only">ID only</option>
                      <option value="Lanyard only">Lanyard only</option>
                      <option value="ID with lanyard">ID with lanyard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Reason</label>
                    <textarea
                      rows={4}
                      value={createRequestReason}
                      onChange={(e) => setCreateRequestReason(e.target.value)}
                      placeholder="Reason for this ID request..."
                      className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRequest}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50 text-sm shadow-lg shadow-blue-500/20"
                  >
                    {submitting ? "Processing..." : "Submit Request"}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        <Transition appear show={deleteModal.open} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeDeleteModal}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-[#1e293b] border border-red-500/20 rounded-xl shadow-2xl p-6 max-w-md w-full">
                <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Trash2 className="text-red-400" /> Delete ID Request
                </Dialog.Title>
                <p className="text-sm text-gray-300 leading-6">
                  Delete this ID request for{" "}
                  <span className="font-semibold text-white">
                    {deleteModal.request?.guard
                      ? getPersonName(deleteModal.request.guard)
                      : getEmployeeDisplayName(deleteModal.request?.admin, deleteModal.request?.admin?.role)}
                  </span>
                  ?
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  This action permanently removes the request record.
                </p>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={closeDeleteModal}
                    disabled={Boolean(deletingId)}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteRequest}
                    disabled={Boolean(deletingId)}
                    className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50 text-sm shadow-lg shadow-red-500/20"
                  >
                    {deletingId ? "Deleting..." : "Delete Request"}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* ===== Approve Modal ===== */}
        <Transition appear show={approveModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setApproveModal(false)}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full">
                <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="text-blue-500" /> Approve Request
                </Dialog.Title>
                
                <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Pickup Date</label>
                      <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          min={todayDateOnly}
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Admin Notes (Optional)</label>
                      <textarea
                          rows={3}
                          value={approveNotes}
                          onChange={(e) => setApproveNotes(e.target.value)}
                          placeholder="Instructions for the guard..."
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setApproveModal(false)}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmApprove}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50 text-sm shadow-lg shadow-blue-500/20"
                  >
                    {submitting ? "Processing..." : "Confirm Approval"}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* ===== Decline Modal ===== */}
        <Transition appear show={declineModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setDeclineModal(false)}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full">
                <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileX className="text-red-500" /> Decline Request
                </Dialog.Title>
                <p className="text-gray-400 text-sm mb-4">
                  Please provide a reason so the guard knows why their request was rejected.
                </p>
                
                <textarea
                  rows={4}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition mb-4"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeclineModal(false)}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDecline}
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50 text-sm shadow-lg shadow-red-900/20"
                  >
                    {submitting ? "Processing..." : "Decline Request"}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-xs">
           © {new Date().getFullYear()} JPM Security Agency. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */
function StatusBadge({ status }) {
  const base = "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit";

  switch (status) {
    case "Pending":
      return (
        <span className={`${base} text-yellow-400 border-yellow-500/30 bg-yellow-500/10`}>
          <Clock size={12} /> Pending
        </span>
      );
    case "Approved":
      return (
        <span className={`${base} text-emerald-400 border-emerald-500/30 bg-emerald-500/10`}>
          <CheckCircle size={12} /> Approved
        </span>
      );
    case "Declined":
      return (
        <span className={`${base} text-red-400 border-red-500/30 bg-red-500/10`}>
          <AlertCircle size={12} /> Declined
        </span>
      );
    default:
      return null;
  }
}
