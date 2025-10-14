import React, { useState, useEffect } from "react";

export default function AdminCOE() {
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([
    { id: 1, name: "Vic Fuentes", guardId: "123", phone: "09123456789", email: "vic@mail.com" },
    { id: 2, name: "Tony Perry", guardId: "124", phone: "09123456788", email: "tony@mail.com" },
    { id: 3, name: "Gerard N.O Way", guardId: "125", phone: "09123456787", email: "gerard@mail.com" },
    { id: 4, name: "Kellin Quinn", guardId: "126", phone: "09123456786", email: "kellin@mail.com" },
  ]);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isFading, setIsFading] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState([]);

  const filtered = requests.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };


  const handleConfirm = () => {
    if (selectedAction === "accept") {
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      showToast(`✅ ${selectedRequest.name}'s request accepted`, "success");
      closePopup();
    } else if (selectedAction === "decline" && declineReason.trim() !== "") {
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      showToast(`❌ ${selectedRequest.name}'s request declined`, "error");
      closePopup();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">
      <main className="flex-1 p-6 overflow-x-auto relative">
        {/* Header + Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-xl font-bold mb-2 md:mb-0">
            Requested Certificate of Employment
          </h1>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-500 px-3 py-2 rounded-md text-white bg-transparent focus:ring-2 focus:ring-white w-full md:w-64"
          />
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg text-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-[#183D3D] text-white text-sm">
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Guard ID</th>
                <th className="px-4 py-2">Phone Number</th>
                <th className="px-4 py-2">Email Address</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img
                      src={`https://i.pravatar.cc/40?u=${r.id}`}
                      alt={r.name}
                      className="w-8 h-8 rounded-full"
                    />
                    {r.name}
                  </td>
                  <td className="px-4 py-3">{r.guardId}</td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    <button
                      onClick={() => handleActionClick("accept", r)}
                      className="px-3 py-1 rounded bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleActionClick("decline", r)}
                      className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
                    >
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Popup */}
        {showPopup && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-200 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <div
              className={`bg-white p-6 rounded-xl shadow-lg w-80 text-center text-gray-800 transform transition-all duration-200 ${
                isFading ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              {selectedAction === "accept" ? (
                <>
                  <h2 className="text-lg font-semibold mb-3">
                    Are you sure you want to{" "}
                    <span className="text-green-600 font-bold">ACCEPT</span> this
                    request?
                  </h2>
                  <p className="text-sm text-gray-600 mb-5">
                    {selectedRequest?.name}
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleConfirm}
                      className="px-4 py-2 bg-[#183D3D] text-white rounded hover:bg-[#204f4f]"
                    >
                      Yes
                    </button>
                    <button
                      onClick={closePopup}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-3">
                    Decline Request for{" "}
                    <span className="font-bold">{selectedRequest?.name}</span>
                  </h2>
                  <textarea
                    placeholder="State your reason..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mb-4 text-sm focus:ring-2 focus:ring-[#183D3D]"
                    rows={3}
                  />
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleConfirm}
                      disabled={!declineReason.trim()}
                      className={`px-4 py-2 rounded text-white ${
                        declineReason.trim()
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Submit
                    </button>
                    <button
                      onClick={closePopup}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ✅ Toast Notification (stacked) */}
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-50">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`px-5 py-3 rounded-lg shadow-lg text-white transition-all duration-500 transform ${
                  toast.type === "success"
                    ? "bg-green-600"
                    : toast.type === "error"
                    ? "bg-red-600"
                    : "bg-gray-600"
                } animate-slideDown`}
              >
                {toast.message}
              </div>
            ))}
          </div>

      </main>
    </div>
  );
}
