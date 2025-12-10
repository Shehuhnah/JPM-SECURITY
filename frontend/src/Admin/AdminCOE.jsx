import React, { useState, useEffect } from "react";
import { 
  Filter, RefreshCw, CheckCircle, XCircle, Clock, IdCardLanyard, 
  Eye, Download, FileText, Calendar, User, Phone, Mail, Shield, 
  ReceiptText, X, ChevronRight, Search 
} from "lucide-react";
import { generateAndDownloadCOE } from "../utils/pdfGenerator";
import { useAuth } from "../hooks/useAuth";
import header from "../assets/headerpdf/header.png";

const api = import.meta.env.VITE_API_URL;

export default function AdminCOE() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [requests, setRequests] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Modal States
  const [salaryModal, setSalaryModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Selection States
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [salary, setSalary] = useState("");
  
  // UI States
  const [isFading, setIsFading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const { user, loading } = useAuth();

  const fetchRequests = async () => {
    try {
      setIsLoadingData(true);
      const res = await fetch(`${api}/api/coe`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load requests');

      const data = await res.json();
      const items = data.items || [];
      const mapped = items.map((req) => {
        const person = req.raw.requesterRole === 'guard' ? req.raw.guard : req.raw.subadmin;
        return {
          id: req.id,
          name: person?.fullName || person?.name || "N/A",
          guardId: req.raw.requesterRole === 'guard' ? person?.guardId || "N/A" : person?._id || "N/A",
          phone: person?.phoneNumber || person?.contactNumber || "N/A",
          email: person?.email || "N/A",
          position: person?.position || "N/A",
          purpose: req.purpose,
          status: req.status,
          requesterRole: req.requesterRole,
          requestedAt: new Date(req.requestedAt).toLocaleDateString() + " " + new Date(req.requestedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          processedAt: req.processedAt ? new Date(req.processedAt).toLocaleString() : null,
          processedBy: req.processedBy || null,
          declineReason: req.declineReason || null,
          raw: req.raw,
        };
      });

      setRequests(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Toast helper
  const showToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  // Popup controls
  const handleActionClick = (action, request) => {
    setSelectedAction(action);
    setSelectedRequest(request);
    setDeclineReason(""); 
    if (action === "accept") {
      setSalaryModal(true);   
      return;                 
    }
    setShowPopup(true);          
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const closePopup = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowPopup(false);
      setIsFading(false);
    }, 200);
  };

  const closeDetailModal = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowDetailModal(false);
      setIsFading(false);
    }, 200);
  };

  // Confirm action
  const handleConfirm = async () => {
    try {
      let body;
      if (selectedAction === "accept") {
        
        // 1. SANITIZE: Remove commas before sending to backend
        // "50,000" becomes "50000"
        const cleanSalary = salary.replace(/,/g, ""); 

        body = { 
          action: "accept", 
          approvedCOE: { salary: cleanSalary } 
        };
      } else {
        body = { action: "decline", declineReason };
      }

      const res = await fetch(
        `${api}/api/coe/${selectedRequest.id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error("Failed to update request");

      const updated = await res.json();

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: updated.status,
                processedAt: updated.processedAt
                  ? new Date(updated.processedAt).toLocaleString()
                  : r.processedAt,
                processedBy: updated.processedBy || r.processedBy,
                declineReason: updated.declineReason || null,
                raw: updated,
              }
            : r
        )
      );

      showToast(
        selectedAction === "accept"
          ? `✅ Request accepted`
          : `❌ Request declined`,
        selectedAction === "accept" ? "success" : "error"
      );
    } catch (err) {
      console.error(err);
      showToast("Error updating request", "error");
    } finally {
      closePopup();
      setSalary("");
    }
  };

  const handleExportCOE = async (requestId) => {
    try {
      const res = await fetch(`${api}/api/coe/${requestId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch COE request');
      const data = await res.json();

      const person = data.requesterRole === 'guard' ? data.guard : data.subadmin || {};
      const approvedCOE = data.approvedCOE || {};

      const empStartDate = approvedCOE.employmentStartDate || (person.createdAt ? new Date(person.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Undefined");

      generateAndDownloadCOE(
        {
          name: (person.fullName || person.name || "UNDEFINED").toUpperCase(),
          guardId: person.guardId || person._id || "UNDEFINED",
          purpose: data.purpose,
          id: data._id,
        },
        {
          headerImage: header,
          position: approvedCOE.position || person.position || "Undefined",
          employmentStart: empStartDate,
          employmentEnd: approvedCOE.employmentEndDate || "Present",
          salary: approvedCOE.salary 
              ? `PHP ${Number(approvedCOE.salary).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Undefined",
          companyName: "JPM SECURITY AGENCY CORP",
          companyAddress: "Indang, Cavite, Philippines",
          issuedDate: new Date(approvedCOE.issuedDate || Date.now()).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          }),
          location: "Indang, Cavite",
          signatory: "KYLE CHRISTOPHER E. PASTRANA",
          signatoryTitle: "HR and Head Administrator",
          companyShort: "JPMSA Corp.",
        }
      );

      showToast("📄 COE generated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Error generating COE", "error");
    }
  };

  // Filtering
  const filtered = requests.filter((r) => {
    const name = r.name || ""; 
    return (statusFilter === "All" || r.status === statusFilter) &&
           name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-slate-900/50 text-gray-100 font-sans">
      <main className="flex-1 flex flex-col p-4 md:p-6">
        
        {/* ===== Header ===== */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <IdCardLanyard className="text-blue-500" size={28}/> 
             </div>
             <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">COE Requests</h1>
                <p className="text-slate-400 text-sm mt-1">Manage and issue Certificates of Employment.</p>
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
                placeholder="Search guard name..."
                className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 
                text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Filter */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={14} />
                <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
                </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchRequests}
              className="px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
              title="Refresh List"
            >
              <RefreshCw className="size-5" />
            </button>
          </div>
        </div>

        {/* ===== Data Display ===== */}
        {isLoadingData ? (
             <div className="flex flex-col items-center justify-center py-20 text-blue-400 animate-pulse">
                <FileText size={40} className="mb-4 opacity-50" />
                <p>Loading requests...</p>
             </div>
        ) : filtered.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-gray-800 border-dashed">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>No COE requests found.</p>
             </div>
        ) : (
            <>
                {/* --- DESKTOP TABLE --- */}
                <div className="hidden md:block overflow-hidden bg-[#1e293b]/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f172a]/50 text-gray-400 border-b border-gray-700/50 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Requester Details</th>
                        <th className="px-6 py-4 font-semibold">Purpose</th>
                        <th className="px-6 py-4 font-semibold">Date Requested</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                    {filtered.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-gray-300 border border-slate-600">
                                    <User size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-white">{r.name}</div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="text-blue-400">{r.position}</span>
                                        <span>•</span>
                                        <span>{r.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="max-w-[200px]">
                                <p className="text-gray-300 text-sm truncate" title={r.purpose}>{r.purpose}</p>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar size={14} />
                                {r.requestedAt}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <StatusBadge status={r.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => handleViewDetails(r)}
                                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"
                                    title="View Details"
                                >
                                    <Eye size={18} />
                                </button>
                                
                                {r.status === "Pending" && (
                                    <>
                                    <button
                                        onClick={() => handleActionClick("accept", r)}
                                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition"
                                        title="Accept"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleActionClick("decline", r)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                                        title="Decline"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                    </>
                                )}
                                
                                {r.status === "Accepted" && (
                                    <button
                                        onClick={() => handleExportCOE(r.id)}
                                        className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition"
                                        title="Download PDF"
                                    >
                                        <Download size={18} />
                                    </button>
                                )}
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                {/* --- MOBILE CARDS --- */}
                <div className="md:hidden grid gap-4">
                {filtered.map((r) => (
                    <div key={r.id} className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{r.name}</h3>
                                    <span className="text-xs text-blue-400">{r.position}</span>
                                </div>
                            </div>
                            <StatusBadge status={r.status} />
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm border border-gray-800">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Purpose</span>
                                <span className="text-gray-200 truncate max-w-[150px]">{r.purpose}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Date</span>
                                <span className="text-gray-200">{r.requestedAt}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                             <button
                                onClick={() => handleViewDetails(r)}
                                className="col-span-1 flex items-center justify-center py-2 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg transition"
                            >
                                <Eye size={18} />
                            </button>

                            {r.status === "Pending" ? (
                                <>
                                    <button
                                        onClick={() => handleActionClick("accept", r)}
                                        className="col-span-2 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleActionClick("decline", r)}
                                        className="col-span-1 flex items-center justify-center py-2 bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white rounded-lg transition"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </>
                            ) : r.status === "Accepted" ? (
                                <button
                                    onClick={() => handleExportCOE(r.id)}
                                    className="col-span-3 flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition"
                                >
                                    <Download size={16} /> Download
                                </button>
                            ) : (
                                <div className="col-span-3"></div>
                            )}
                        </div>
                    </div>
                ))}
                </div>
            </>
        )}

        {/* ================= MODALS ================= */}
        
        {/* 1. Confirmation / Decline Popup */}
        {showPopup && (
          <div className={`fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"}`}>
            <div className={`bg-[#1e293b] text-white p-6 rounded-2xl border border-gray-700 w-full max-w-sm mx-4 shadow-2xl transform transition-all duration-300 ${isFading ? "scale-95" : "scale-100"}`}>
              {selectedAction === "accept" ? (
                <div className="text-center">
                   <div className="mx-auto bg-green-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-green-400" size={24} />
                   </div>
                  <h2 className="text-lg font-bold mb-2">Accept Request?</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    You are about to issue a COE for <span className="text-white font-medium">{selectedRequest?.name}</span>.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={closePopup} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium transition">Cancel</button>
                    <button onClick={handleConfirm} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-green-900/20 transition">Confirm</button>
                  </div>
                </div>
              ) : (
                <div>
                   <div className="flex items-center gap-2 mb-4">
                        <div className="bg-red-500/10 p-2 rounded-full"><XCircle className="text-red-400" size={20} /></div>
                        <h2 className="text-lg font-bold">Decline Request</h2>
                   </div>
                  <p className="text-gray-400 text-sm mb-3">Please state why you are rejecting this request.</p>
                  <textarea
                    placeholder="Reason for rejection..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full bg-[#0f172a] border border-gray-600 rounded-xl p-3 mb-4 text-sm text-gray-200 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                    rows={4}
                  />
                  <div className="flex gap-3">
                    <button onClick={closePopup} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium transition">Cancel</button>
                    <button
                      onClick={handleConfirm}
                      disabled={!declineReason.trim()}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Detail View Modal */}
        {showDetailModal && selectedRequest && (
          <div className={`fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"}`}>
            <div className={`bg-[#1e293b] flex flex-col max-h-[90vh] text-white rounded-2xl border border-gray-700 w-full max-w-2xl mx-4 shadow-2xl transform transition-all duration-300 ${isFading ? "scale-95" : "scale-100"}`}>
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="text-blue-500" size={24} />
                  Request Details
                </h2>
                <button onClick={closeDetailModal} className="text-gray-400 hover:text-white p-1 hover:bg-slate-700 rounded-full transition"><X size={20}/></button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 overflow-y-auto">
                {/* Section: Employee */}
                <div className="bg-[#0f172a] rounded-xl p-5 mb-6 border border-gray-800">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 flex items-center gap-2">
                    <User size={16}/> Employee Information
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-6">
                     <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
                            <Shield className="text-blue-500 w-10 h-10"/>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 w-full text-sm">
                        <div>
                            <span className="text-gray-500 block text-xs">Full Name</span>
                            <span className="text-white font-medium text-base">{selectedRequest.name}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs">Guard ID</span>
                            <span className="font-mono text-blue-400">{selectedRequest.guardId}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs">Position</span>
                            <span className="text-gray-300">{selectedRequest.raw?.guard?.position || selectedRequest.position}</span>
                        </div>
                         <div>
                            <span className="text-gray-500 block text-xs">Contact</span>
                            <span className="text-gray-300">{selectedRequest.phone}</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Section: Request */}
                <div className="bg-[#0f172a] rounded-xl p-5 border border-gray-800">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4 flex items-center gap-2">
                    <ReceiptText size={16}/> Request Data
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <span className="text-gray-500 text-xs block mb-1">Purpose of COE</span>
                        <p className="p-3 bg-slate-800/50 rounded-lg text-gray-200 text-sm border border-slate-700/50">
                            {selectedRequest.purpose}
                        </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-gray-500 text-xs block mb-1">Status</span>
                            <StatusBadge status={selectedRequest.status} />
                        </div>
                        <div>
                            <span className="text-gray-500 text-xs block mb-1">Requested Date</span>
                            <span className="text-gray-300 text-sm">{selectedRequest.requestedAt}</span>
                        </div>
                     </div>
                     {selectedRequest.processedBy && (
                         <div className="pt-4 mt-4 border-t border-gray-800 grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500 text-xs block mb-1">Processed By</span>
                                <span className="text-gray-300 text-sm">{selectedRequest.processedBy}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs block mb-1">Processed Date</span>
                                <span className="text-gray-300 text-sm">{selectedRequest.processedAt}</span>
                            </div>
                         </div>
                     )}
                     {selectedRequest.declineReason && (
                         <div className="pt-4 mt-4 border-t border-gray-800">
                            <span className="text-red-400 text-xs block mb-1 font-bold">Rejection Reason</span>
                            <p className="text-red-300 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                                {selectedRequest.declineReason}
                            </p>
                         </div>
                     )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3 bg-[#1e293b] rounded-b-2xl">
                 <button onClick={closeDetailModal} className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition">Close</button>
                 
                 {selectedRequest.status === "Pending" && (
                     <>
                        <button 
                            onClick={() => { closeDetailModal(); handleActionClick("decline", selectedRequest); }}
                            className="px-5 py-2.5 rounded-xl bg-red-900/30 hover:bg-red-600 text-red-200 hover:text-white border border-red-800 hover:border-transparent text-sm font-medium transition"
                        >
                            Decline
                        </button>
                        <button 
                            onClick={() => { closeDetailModal(); handleActionClick("accept", selectedRequest); }}
                            className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium shadow-lg shadow-green-900/20 transition"
                        >
                            Accept Request
                        </button>
                     </>
                 )}
                 {selectedRequest.status === "Accepted" && (
                      <button 
                        onClick={() => { closeDetailModal(); handleExportCOE(selectedRequest.id); }}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium shadow-lg shadow-purple-900/20 transition flex items-center gap-2"
                    >
                        <Download size={16}/> Export PDF
                    </button>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Salary Input Modal */}
        {salaryModal && selectedRequest && (
          <div className={`fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"}`}>
            <div className={`bg-[#1e293b] text-white rounded-2xl border border-gray-700 w-full max-w-md mx-4 shadow-2xl transform transition-all duration-300 ${isFading ? "scale-95" : "scale-100"}`}>
               <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ReceiptText className="text-green-500" size={24} />
                    Salary Verification
                  </h2>
                  <button onClick={() => setSalaryModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
               </div>
               
               <div className="p-6">
                    <p className="text-sm text-gray-400 mb-6">
                        Please enter the monthly salary for <span className="text-white font-semibold">{selectedRequest.name}</span> to appear on the Certificate.
                    </p>
                    
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-serif">₱</span>
                      <input
                          type="text"  
                          className="w-full pl-10 pr-4 py-3 bg-[#0f172a] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 outline-none transition"
                          placeholder="0.00"
                          value={salary}
                          onChange={(e) => {
                              // 1. Get raw value
                              const val = e.target.value;

                              // 2. Allow only numbers, commas, and one decimal point
                              if (/^[0-9,]*\.?[0-9]*$/.test(val)) {
                                  
                                  // 3. Remove existing commas to get the raw number
                                  const rawValue = val.replace(/,/g, '');
                                  
                                  // 4. Split integer and decimal parts (to prevent deleting the "." while typing)
                                  const parts = rawValue.split('.');
                                  
                                  // 5. Add commas to the integer part
                                  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                  
                                  // 6. Update state
                                  setSalary(parts.join('.'));
                              }
                          }}
                      />
                  </div>
               </div>

               <div className="p-6 pt-2 flex gap-3">
                  <button onClick={() => setSalaryModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium transition">Cancel</button>
                 <button
                    onClick={() => {
                        // Remove commas before checking if it's empty
                        if (!salary.replace(/,/g, '').trim()) {
                            showToast("Please enter a salary amount.", "error");
                            return;
                        }
                        setSalaryModal(false);
                        setShowPopup(true);
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2"
                >
                    Next <ChevronRight size={16}/>
                </button>
               </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <div className="fixed top-6 right-6 flex flex-col items-end gap-3 z-[60]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white font-medium text-sm animate-in slide-in-from-right-10 fade-in duration-300 ${
                toast.type === "success" ? "bg-emerald-600 shadow-emerald-900/20" : 
                toast.type === "error" ? "bg-red-600 shadow-red-900/20" : "bg-gray-700"
              }`}
            >
              {toast.type === "success" && <CheckCircle size={18}/>}
              {toast.type === "error" && <XCircle size={18}/>}
              {toast.message}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

/* ---------- HELPER COMPONENTS ---------- */
function StatusBadge({ status }) {
  const base = "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit";

  switch (status) {
    case "Accepted":
      return (
        <span className={`${base} text-emerald-400 border-emerald-500/30 bg-emerald-500/10`}>
          <CheckCircle size={12} /> Accepted
        </span>
      );
    case "Declined":
      return (
        <span className={`${base} text-red-400 border-red-500/30 bg-red-500/10`}>
          <XCircle size={12} /> Declined
        </span>
      );
    default:
      return (
        <span className={`${base} text-yellow-400 border-yellow-500/30 bg-yellow-500/10`}>
          <Clock size={12} /> Pending
        </span>
      );
  }
}