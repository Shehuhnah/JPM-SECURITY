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
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function RequestedIDs() {
  const { admin, token } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [pickupDate, setPickupDate] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      if (!token && !admin) {
        navigate("/admin/login");
        return;
      }

      setLoading(true);
      const res = await fetch("http://localhost:5000/api/idrequests", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  // Filter & Search
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

  // Handle Approve
  const handleApproveID = (id) => {
    setSelectedId(id);
    setPickupDate("");
    setApproveModal(true);
  };

  // Handle Decline
  const handleDeclineID = (id) => {
    setSelectedId(id);
    setDeclineReason("");
    setDeclineModal(true);
  };

  // Confirm Approve
const handleConfirmApprove = async () => {
  if (!pickupDate) return alert("Please select a pickup date.");
    try {
      setSubmitting(true);
      const res = await fetch(`http://localhost:5000/api/idrequests/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        setApproveNotes("");
      }
    } catch (err) {
      console.error("Error approving ID:", err);
    } finally {
      setSubmitting(false);
    }
  };


  // Confirm Decline
  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) return alert("Please provide a reason for declining.");
    try {
      setSubmitting(true);
      const res = await fetch(`http://localhost:5000/api/idrequests/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="py-3">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <IdCard className="text-blue-500" size={30}/> Requested IDs
            </h2>
          </div>

          {/* Filter, Search, Refresh */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <button
              onClick={fetchRequests}
              className="px-4 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition"
              title="Refresh List"
            >
              <RefreshCw className="size-4" />
            </button>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-700 px-3 py-2 rounded-md bg-[#1e293b] text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guard or request..."
                className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-md bg-[#1e293b] border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </header>

        {/* Table */}
        <div className="overflow-x-auto bg-[#1e293b]/70 border border-gray-700 rounded-xl shadow-lg">
          {loading ? (
            <p className="text-gray-400 text-center py-10 animate-pulse">
              Loading ID requests...
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No ID requests found.</p>
          ) : (
            <table className="w-full text-sm md:text-base">
              <thead className="bg-[#10263a] text-gray-100 uppercase tracking-wide text-xs md:text-sm">
                <tr className="text-center">
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Request Type</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Date Requested</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr
                    key={req._id}
                    className="border-t border-gray-700 hover:bg-blue-900/20 transition text-center"
                  >
                    <td className="p-3 font-medium">{req.guard?.fullName || "Unknown"}</td>
                    <td className="p-3 text-blue-400">{req.guard?.position || "N/A"}</td>
                    <td className="p-3 text-gray-300">{req.requestType}</td>
                    <td className="p-3 text-gray-400">{req.requestReason}</td>
                    <td className="p-3 text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="flex items-center justify-center p-3 space-x-2">
                      <button
                        onClick={() => handleApproveID(req._id)}
                        disabled={req.status !== "Pending"}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-1 text-sm transition
                          ${
                            req.status === "Approved" || req.status === "Declined"
                              ? "bg-green-900/40 text-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-500 text-white"
                          }`}
                      >
                        <CheckCircle size={14} /> Approve
                      </button>

                      <button
                        onClick={() => handleDeclineID(req._id)}
                        disabled={req.status !== "Pending"}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-1 text-sm transition
                          ${
                            req.status === "Approved" || req.status === "Declined"
                              ? "bg-red-900/40 text-gray-400 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-500 text-white"
                          }`}
                      >
                        <XCircle size={14} /> Decline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Approve Modal */}
       <Transition appear show={approveModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setApproveModal(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-xl shadow-xl p-6 max-w-md w-full">
              <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-blue-400" /> Approve ID Request
              </Dialog.Title>

              <p className="text-gray-400 text-sm mb-3">
                Please select the date when the guard can pick up the ID and optionally add remarks.
              </p>

              {/* Pickup Date */}
              <label className="block text-sm font-medium text-gray-300 mb-1">Pickup Date</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 mb-4 focus:ring-2 focus:ring-blue-500"
              />

              {/* Admin Notes */}
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Notes (optional)</label>
              <textarea
                rows="3"
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="e.g. ID ready for pickup at the admin office..."
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 mb-4 focus:ring-2 focus:ring-blue-500"
              ></textarea>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setApproveModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApprove}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Confirm Approval"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>


        {/* Decline Modal */}
        <Transition appear show={declineModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setDeclineModal(false)}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-xl shadow-xl p-6 max-w-md w-full">
                <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileX className="text-red-400" /> Decline ID Request
                </Dialog.Title>
                <p className="text-gray-400 text-sm mb-3">
                  Please provide the reason for declining this request.
                </p>
                <textarea
                  rows="3"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 mb-4 focus:ring-2 focus:ring-red-500"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeclineModal(false)}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDecline}
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Confirm Decline"}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          © {new Date().getFullYear()} JPM Security Agency. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */
function StatusBadge({ status }) {
  const base =
    "px-3 py-1 rounded-full text-xs font-semibold border flex items-center justify-center gap-1 w-fit mx-auto";

  switch (status) {
    case "Pending":
      return (
        <span className={`${base} text-yellow-400 border-yellow-400 bg-yellow-500/20`}>
          <Clock size={12} /> Pending
        </span>
      );
    case "Approved":
      return (
        <span className={`${base} text-green-400 border-green-400 bg-green-500/20`}>
          <CheckCircle size={12} /> Approved
        </span>
      );
    case "Declined":
      return (
        <span className={`${base} text-red-400 border-red-400 bg-red-500/20`}>
          <AlertCircle size={12} /> Declined
        </span>
      );
    default:
      return null;
  }
}
