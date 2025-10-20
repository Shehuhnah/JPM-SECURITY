import React, { useState, useEffect } from "react";
import { Filter, CheckCircle, XCircle, Clock, IdCardLanyard  } from "lucide-react";

export default function AdminCOE() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [requests, setRequests] = useState([
    { id: 1, name: "Vic Fuentes", guardId: "123", phone: "09123456789", email: "vic@mail.com", status: "Pending" },
    { id: 2, name: "Tony Perry", guardId: "124", phone: "09123456788", email: "tony@mail.com", status: "Accepted" },
    { id: 3, name: "Gerard N.O Way", guardId: "125", phone: "09123456787", email: "gerard@mail.com", status: "Declined" },
    { id: 4, name: "Kellin Quinn", guardId: "126", phone: "09123456786", email: "kellin@mail.com", status: "Pending" },
  ]);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [toasts, setToasts] = useState([]);

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
    setShowPopup(true);
    setDeclineReason("");
  };

  const closePopup = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowPopup(false);
      setIsFading(false);
    }, 200);
  };

  // Confirm action
  const handleConfirm = () => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, status: selectedAction === "accept" ? "Accepted" : "Declined" }
          : r
      )
    );

    showToast(
      selectedAction === "accept"
        ? `✅ ${selectedRequest.name}'s request accepted`
        : `❌ ${selectedRequest.name}'s request declined`,
      selectedAction === "accept" ? "success" : "error"
    );
    closePopup();
  };

  // Filtering
  const filtered = requests.filter(
    (r) =>
      (statusFilter === "All" || r.status === statusFilter) &&
      r.name.toLowerCase().includes(search.toLowerCase())
  );

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
            <IdCardLanyard className="text-blue-500"/>
            Certificate of Employment Requests
          </h1>

          {/* Filter Dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
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
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Guard ID</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
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
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img
                      src={`https://i.pravatar.cc/40?u=${r.id}`}
                      alt={r.name}
                      className="w-8 h-8 rounded-full border border-gray-600"
                    />
                    {r.name}
                  </td>
                  <td className="px-4 py-3">{r.guardId}</td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-center">
                    {r.status === "Pending" && (
                      <div className="flex justify-center gap-2">
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
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-400 italic">
                    No matching requests found.
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
