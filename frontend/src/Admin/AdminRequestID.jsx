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
  Lock
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const api = import.meta.env.VITE_API_URL;

export default function RequestedIDs() {
  const { user, loading } = useAuth(); // Changed 'admin' to 'user' for clarity
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);

  // Modal States
  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  // Form States
  const [pickupDate, setPickupDate] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- ROLE CHECK ---
  const canManage = user?.role === "Admin"; 

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      // Basic auth check
      if (!loading && !user) {
        navigate("/admin/login");
        return;
      }

      setLoadingPage(true);
      const res = await fetch(`${api}/api/idrequests`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setRequests(result.data);
        setFilteredRequests(result.data);
      } else {
        setRequests([]);
        setFilteredRequests([]);
      }
    } catch (err) {
      console.error("❌ Failed to load ID requests:", err);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  // Filter & Search Logic
  useEffect(() => {
    let filtered = [...requests];
    if (filter !== "All") filtered = filtered.filter((r) => r.status === filter);
    if (search.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.guard?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          r.requestType?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredRequests(filtered);
  }, [filter, search, requests]);

  // Handlers
  const handleApproveID = (id) => {
    if (!canManage) return; // Security check
    setSelectedId(id);
    setPickupDate("");
    setApproveNotes("");
    setApproveModal(true);
  };

  const handleDeclineID = (id) => {
    if (!canManage) return; // Security check
    setSelectedId(id);
    setDeclineReason("");
    setDeclineModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!pickupDate) return alert("Please select a pickup date.");
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
      }
    } catch (err) {
      console.error("Error approving ID:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) return alert("Please provide a reason for declining.");
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
      }
    } catch (err) {
      console.error("Error declining ID:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900/50 text-gray-100 font-sans">
      <div className="flex-1 flex flex-col p-4 md:p-6">
        
        {/* ===== Header ===== */}
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <IdCard className="text-blue-500" size={28}/> 
             </div>
             <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Requested IDs</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Manage ID issuance and renewals. 
                  {!canManage && <span className="text-yellow-500 ml-2 text-xs border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 rounded">View Only</span>}
                </p>
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
                placeholder="Search guard..."
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
          </div>
        </header>

        {/* ===== Content ===== */}
        {loadingPage ? (
           <div className="flex flex-col items-center justify-center py-20 text-blue-400 animate-pulse">
             <IdCard size={40} className="mb-4 opacity-50" />
             <p>Loading requests...</p>
           </div>
        ) : filteredRequests.length === 0 ? (
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
                    <th className="px-6 py-4 font-semibold">Guard Details</th>
                    <th className="px-6 py-4 font-semibold">Request Info</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    {/* Only show Actions column header if Admin */}
                    <th className="px-6 py-4 font-semibold text-right">{canManage ? "Actions" : ""}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-white/5 transition">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-gray-300 border border-slate-600">
                            <User size={16} />
                          </div>
                          <div>
                            {/* FIX START: Check both Guard and Admin fields */}
                            <div className="font-medium text-white">
                              {req.guard?.fullName || req.admin?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-blue-400">
                              {req.guard?.position || req.admin?.role || "N/A"}
                            </div>
                            {/* FIX END */}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-200">{req.requestType}</div>
                        <div className="text-xs text-gray-500 italic max-w-[200px] truncate">{req.requestReason}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                         {/* Only show buttons if Admin */}
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
               {filteredRequests.map((req) => (
                 <div key={req._id} className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                            <User size={20} />
                         </div>
                         <div>
                            <h3 className="font-semibold text-white">{req.guard?.fullName || "Unknown"}</h3>
                            <span className="text-xs text-blue-400">{req.guard?.position}</span>
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
                         <span className="text-gray-500">Date</span>
                         <span className="text-gray-200">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      {req.requestReason && (
                         <div className="pt-2 mt-2 border-t border-gray-800">
                            <span className="text-gray-500 text-xs block mb-1">Reason:</span>
                            <p className="text-gray-300 italic">{req.requestReason}</p>
                         </div>
                      )}
                   </div>

                   {/* Role Check for Mobile Buttons */}
                   {canManage && req.status === "Pending" && (
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                   )}
                   
                   {!canManage && (
                      <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Lock size={12}/> Admin access required to manage
                      </div>
                   )}
                 </div>
               ))}
            </div>
          </>
        )}

        {/* ===== Approve Modal (Managed by canManage check in handler) ===== */}
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

        {/* ===== Decline Modal (Managed by canManage check in handler) ===== */}
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
                    className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50 text-sm shadow-lg shadow-red-500/20"
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