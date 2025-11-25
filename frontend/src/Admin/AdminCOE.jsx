import React, { useState, useEffect } from "react";
import { Filter, RefreshCw, CheckCircle, XCircle, Clock, IdCardLanyard, Eye, Download, FileText, Calendar, User, Phone, Mail, Shield, ReceiptText, X } from "lucide-react";
import { generateAndDownloadCOE } from "../utils/pdfGenerator";
import { useAuth } from "../hooks/useAuth";
import header from "../assets/headerpdf/header.png"
const api = import.meta.env.VITE_API_URL;

export default function AdminCOE() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [requests, setRequests] = useState([]);
  const [salaryModal, setSalaryModal] = useState(false)
  const [showPopup, setShowPopup] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [salary, setSalary] = useState("");

  const { user, loading } = useAuth();

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${api}/api/coe`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load requests');

      const data = await res.json();
      console.log("datas:", data);

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
          requestedAt: new Date(req.requestedAt).toLocaleString(),
          processedAt: req.processedAt ? new Date(req.processedAt).toLocaleString() : null,
          processedBy: req.processedBy || null,
          declineReason: req.declineReason || null,
          raw: req.raw,
        };
      });

      setRequests(mapped);
    } catch (err) {
      console.error(err);
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
    setShowPopup(true);;           
  };


  const handleViewDetails = (request) => {
    console.log("request: ", request)
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
        body = { 
          action: "accept", 
          approvedCOE: { salary } // <-- send salary inside approvedCOE
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
          ? `✅ ${selectedRequest.name}'s request accepted`
          : `❌ ${selectedRequest.name}'s request declined`,
        selectedAction === "accept" ? "success" : "error"
      );
    } catch (err) {
      console.error(err);
      showToast("Error updating request", "error");
    } finally {
      closePopup();
    }
  };

  // Export COE function
  const handleExportCOE = async (requestId) => {
    try {
      // Fetch the full request data from backend
      const res = await fetch(`${api}/api/coe/${requestId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch COE request');
      const data = await res.json();
      console.log("exported data: " , data)

      // Determine requester based on role
      const person = data.requesterRole === 'guard' ? data.guard : data.subadmin || {};
      const approvedCOE = data.approvedCOE || {};

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
          employmentStart: approvedCOE.employmentStartDate || "Undefined",
          employmentEnd: approvedCOE.employmentEndDate || "Present",
          salary: approvedCOE.salary || "Undefined",
          companyName: "JPM SECURITY AGENCY CORP",
          companyAddress: "Indang, Cavite, Philippines",
          issuedDate: new Date(approvedCOE.issuedDate || Date.now()).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
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
    const name = r.name || ""; // fallback if undefined
    return (statusFilter === "All" || r.status === statusFilter) &&
          name.toLowerCase().includes(search.toLowerCase());
  });

  // Badge
  const getStatusBadge = (status) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 justify-center";
    if (status === "Accepted")
      return (
        <span className={`${base} bg-green-500/20 text-green-400 border border-green-400/30`}>
          <CheckCircle className="w-3 h-3" /> Accepted
        </span>
      );
    if (status === "Declined")
      return (
        <span className={`${base} bg-red-500/20 text-red-400 border border-red-400/30`}>
          <XCircle className="w-3 h-3" /> Declined
        </span>
      );
    return (
      <span className={`${base} bg-yellow-500/20 text-yellow-300 border border-yellow-400/30`}>
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      {/* Header */}
      <main className="flex-1 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <IdCardLanyard className="text-blue-500" size={30}/>
            Certificate of Employment Requests
          </h1>

          {/* Filter Dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Refresh button (left of filter) */}
            <button
              onClick={fetchRequests}
              title="Refresh"
              className="p-2 bg-[#1e293b] border border-gray-700 rounded-lg text-blue-400 hover:bg-[#233444] transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-center bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-blue-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-200 focus:outline-none"
              >
                <option value="All" className="text-gray-900">All</option>
                <option value="Pending" className="text-gray-900">Pending</option>
                <option value="Accepted" className="text-gray-900">Accepted</option>
                <option value="Declined" className="text-gray-900">Declined</option>
              </select>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search guard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-[#1e293b]/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#234C6A] text-white text-sm">
              <tr>
                <th className="px-4 py-3">Guard Information</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-700 hover:bg-[#243447]/60 transition-all"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <IdCardLanyard className="text-blue-400 w-10 h-10"/>
                      <div>
                        <div className="font-medium text-white">{r.name}</div> {/* Access from populated guard */}
                        <div className="text-xs text-gray-400 font-medium">Position: {r.position}</div>
                        <div className="text-xs text-gray-400 font-medium">Phone: {r.phone}</div> {/* Access from populated guard */}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="text-gray-200 text-sm line-clamp-2">{r.purpose}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Calendar size={14} />
                      <span className="text-xs">{r.requestedAt}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetails(r)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30 transition"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      
                      {r.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleActionClick("accept", r)}
                            className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-md hover:opacity-90 transition text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleActionClick("decline", r)}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-md hover:opacity-90 transition text-xs"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      
                      {r.status === "Accepted" && (
                        <button
                          onClick={() => handleExportCOE(r.id)}
                          className="p-2 bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 transition"
                          title="Export COE"
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-gray-500" />
                      No COE requests found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showPopup && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-[#1e293b] text-white p-6 rounded-xl border border-gray-700 w-80 shadow-2xl transform transition-all duration-300 ${
                isFading ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              {selectedAction === "accept" ? (
                <>
                  <h2 className="text-lg font-semibold mb-4 text-center">
                    Accept Request from{" "}
                    <span className="text-green-400 font-bold">
                      {selectedRequest?.name}
                    </span>
                    ?
                  </h2>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleConfirm}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 rounded-md text-white hover:opacity-90"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={closePopup}
                      className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-3 text-center">
                    Decline Request for{" "}
                    <span className="text-red-400">{selectedRequest?.name}</span>
                  </h2>
                  <textarea
                    placeholder="State your reason..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full bg-[#0f172a] border border-gray-600 rounded-md p-2 mb-4 text-sm text-gray-200 focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleConfirm}
                      disabled={!declineReason.trim()}
                      className={`px-4 py-2 rounded-md text-white ${
                        declineReason.trim()
                          ? "bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90"
                          : "bg-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Submit
                    </button>
                    <button
                      onClick={closePopup}
                      className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-[#1e293b] text-white p-6 rounded-xl border border-gray-700 w-full max-w-2xl mx-4 shadow-2xl transform transition-all duration-300 ${
                isFading ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
                  <FileText size={20} />
                  COE Request Details
                </h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-white transition"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {selectedRequest && (
                <div className="space-y-6">
                  {/* Guard Information */}
                  <div className="bg-[#0f172a] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <User size={18} />
                      Guard Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Shield className="text-blue-400 w-12 h-12"/>
                        <div>
                          <div className="font-medium text-white">{selectedRequest.name}</div> {/* Access from populated guard */}
                          <div className="text-sm text-gray-400">ID: {selectedRequest.guardId}</div> {/* Access from populated guard */}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-blue-400" />
                          <span className="text-gray-300">{selectedRequest.phone}</span> {/* Access from populated guard */}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-blue-400" />
                          <span className="text-gray-300">{selectedRequest.email}</span> {/* Access from populated guard */}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="bg-[#0f172a] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <FileText size={18} />
                      Request Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Purpose</label>
                        <p className="text-gray-200 mt-1 p-3 bg-[#1e293b] rounded-lg">
                          {selectedRequest.purpose}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Request Date</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={14} className="text-blue-400" />
                            <span className="text-gray-300">{selectedRequest.requestedAt}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Status</label>
                          <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                        </div>
                      </div>
                      
                      {selectedRequest.processedAt && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-400">Processed Date</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={14} className="text-blue-400" />
                              <span className="text-gray-300">{selectedRequest.processedAt}</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Processed By</label>
                            <p className="text-gray-300 mt-1">{selectedRequest.processedBy}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedRequest.declineReason && (
                        <div>
                          <label className="text-sm text-gray-400">Decline Reason</label>
                          <p className="text-red-300 mt-1 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            {selectedRequest.declineReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    {selectedRequest.status === "Pending" && (
                      <>
                        <button
                          onClick={() => {
                            closeDetailModal();
                            handleActionClick("accept", selectedRequest);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:opacity-90 transition"
                        >
                          Accept Request
                        </button>
                        <button
                          onClick={() => {
                            closeDetailModal();
                            handleActionClick("decline", selectedRequest);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:opacity-90 transition"
                        >
                          Decline Request
                        </button>
                      </>
                    )}
                    
                    {selectedRequest.status === "Accepted" && (
                      <button
                        onClick={() => {
                          closeDetailModal();
                          handleExportCOE(selectedRequest);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                      >
                        <Download size={16} />
                        Export COE
                      </button>
                    )}
                    
                    <button
                      onClick={closeDetailModal}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Salary Modal */}
        {salaryModal && selectedRequest && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-[#1e293b] text-white p-6 rounded-xl border border-gray-700 w-full max-w-xl mx-4 shadow-2xl transform transition-all duration-300 ${
                isFading ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="">
                  <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
                    <ReceiptText size={20} />
                    Approving COE Request
                  </h2>
                  <p className="text-gray-300 text-sm mt-1">
                    Please verify the details below before entering the salary.
                  </p>
                </div>
                <div className="">
                  <button onClick={() => setSalaryModal(false)}><X/></button>
                </div>
              </div>

              {/* Guard Information */}
              <div className="bg-[#243447] p-4 rounded-lg border border-gray-700 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex gap-2 items-center"><User className="text-blue-400 w-8 h-8"/> Employee Information</h3>

                <div className="space-y-1 text-gray-300 text-sm font-medium">
                  <p><span className="text-gray-400">Name:</span> {selectedRequest.name}</p>
                  <p><span className="text-gray-400">Guard ID:</span> {selectedRequest.guardId}</p>
                  <p><span className="text-gray-400">Position:</span> {selectedRequest.raw?.guard?.position}</p> 
                  <p><span className="text-gray-400">Phone:</span> {selectedRequest.phone}</p>
                  <p><span className="text-gray-400">Email:</span> {selectedRequest.email}</p>
                  <p><span className="text-gray-400">Purpose:</span> {selectedRequest.purpose}</p>
                  <p><span className="text-gray-400">Requested At:</span> {selectedRequest.requestedAt}</p>
                </div>
              </div>

              {/* Salary Input */}
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                  placeholder="Enter salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />

                <button
                  onClick={() => {
                    if (!salary.trim()) {
                      showToast("Please enter a salary amount first.", "error");
                      return;
                    }
                    setSalaryModal(false);
                    setShowPopup(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <div className="fixed top-6 right-6 flex flex-col items-end gap-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-5 py-3 rounded-lg shadow-lg text-white transition-all duration-500 ${
                toast.type === "success"
                  ? "bg-green-600"
                  : toast.type === "error"
                  ? "bg-red-600"
                  : "bg-gray-600"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
