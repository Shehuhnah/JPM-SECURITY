import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Tag,
  Calendar,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const api = import.meta.env.VITE_API_URL;

const toDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA");
};

const formatPickupDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dateInputStyles = `
  .guard-date-filter::-webkit-calendar-picker-indicator {
    filter: brightness(0) invert(1);
    opacity: 1;
    cursor: pointer;
  }
  .guard-date-filter {
    color-scheme: dark;
  }
`;

export default function RequestIDPage() {
  // CHANGED: Renamed 'guard' to 'user' so it works for Subadmins too
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ requestType: "", reason: "" });
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const activeRequest = requests.find((request) => {
    if (request.status === "Pending") return true;
    if (request.status !== "Approved") return false;
    if (!request.pickupDate) return true;

    const pickupDate = new Date(request.pickupDate);
    return Number.isNaN(pickupDate.getTime()) || pickupDate >= new Date();
  });
  const hasActiveRequest = Boolean(activeRequest);

  // Fetch requests for the current user (Guard OR Subadmin)
  useEffect(() => {
    document.title = "Request ID | JPM Agency Security";
    
    // Redirect if not logged in (regardless of role)
    if (!loading && !user) {
        navigate("/admin/login"); 
        return;
    }

    const fetchRequests = async () => {
      try {
        // This endpoint should return requests belonging to the logged-in user's ID
        const res = await fetch(`${api}/api/idrequests/myrequests`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to load requests");
        const data = await res.json();
        setRequests(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    
    if (user) fetchRequests();
  }, [user, loading, navigate]); // CHANGED: Dependency is now 'user'

  // Submit new ID/Lanyard request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasActiveRequest) {
      setMessage(
        activeRequest.status === "Pending"
          ? "You already have a pending ID request. Please wait for admin review before submitting another request."
          : "You already have an approved ID request scheduled for pickup. Please complete that request before submitting another one."
      );
      return;
    }
    if (!form.requestType || !form.reason.trim()) {
      setMessage("⚠️ Please select a request type and provide a reason.");
      return;
    }

    try {
      setLoadingPage(true);
      setMessage("");
      
      const res = await fetch(`${api}/api/idrequests`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType: form.requestType,
          requestReason: form.reason,
          // Optional: You can pass the role if your backend needs to distinguish
          // role: user.role 
        }),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message || "Failed to submit request");

      // Refresh list
      const res2 = await fetch(`${api}/api/idrequests/myrequests`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res2.json();
      setRequests(data.data || []);
      setForm({ requestType: "", reason: "" });
      setMessage("✅ Your request has been submitted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.message || "Error submitting request. Please try again.");
    } finally {
      setLoadingPage(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (!dateFilter) return true;
    return toDateKey(req.createdAt) === dateFilter;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 sm:p-6">
      <style>{dateInputStyles}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left mb-8 gap-2">
        <FileText className="text-blue-400 w-8 h-8" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
          ID / Lanyard Request
        </h1>
      </div>

      {/* Request Form */}
      <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-blue-400 flex items-center gap-2">
          <Send size={18} /> Submit New Request
        </h2>

        {message && (
          <div
            className={`p-3 text-sm text-center rounded-md break-words ${
              message.includes("✅")
                ? "bg-green-500/20 text-green-400 border border-green-500"
                : message.includes("⚠️")
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                : "bg-red-500/20 text-red-400 border border-red-500"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasActiveRequest && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              {activeRequest.status === "Pending"
                ? "You have a pending ID request. New requests are disabled until it is reviewed."
                : `You have an approved ID request scheduled for pickup${
                    activeRequest.pickupDate ? ` on ${formatPickupDateTime(activeRequest.pickupDate)}` : ""
                  }. New requests are disabled until it is completed.`}
            </div>
          )}
          <div>
            <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base">
              Type of Request
            </label>
            <select
              name="requestType"
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value })}
              disabled={hasActiveRequest || loadingPage}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="">Select an option</option>
              <option value="ID only">ID only</option>
              <option value="Lanyard only">Lanyard only</option>
              <option value="ID with lanyard">ID with lanyard</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base">
              Reason for Request
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Example: Lost my ID, newly hired, damaged lanyard..."
              rows="4"
              disabled={hasActiveRequest || loadingPage}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || loadingPage || hasActiveRequest}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading || loadingPage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Request History */}
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-400 flex items-center gap-2">
            <Tag size={20} /> Your Previous Requests
          </h2>
          <div className="flex flex-col gap-2 sm:w-[260px]">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Filter by date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="guard-date-filter w-full rounded-lg border border-gray-700 bg-[#0f172a] px-3 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              {dateFilter ? (
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-700 px-3 text-sm text-gray-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 sm:p-8 text-center">
            <FileText className="text-gray-500 w-10 h-10 mx-auto mb-3" />
            <p className="text-gray-400 italic text-sm sm:text-base">
              {dateFilter ? "No ID requests found for the selected date." : "No ID requests submitted yet."}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-[#1e293b] border border-gray-700 rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-blue-500/10 transition text-sm sm:text-base"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2 text-gray-400 text-xs sm:text-sm">
                  <Clock size={14} className="text-blue-400" />
                  <span>ID: {req._id}</span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  {req.status === "Pending" ? (
                    <AlertCircle className="text-yellow-400 w-4 h-4" />
                  ) : req.status === "Declined" ? (
                    <AlertCircle className="text-red-400 w-4 h-4" />
                  ) : (
                    <CheckCircle className="text-green-400 w-4 h-4" />
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      req.status === "Pending"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                        : req.status === "Declined"
                        ? "bg-red-500/20 text-red-400 border border-red-500"
                        : "bg-green-500/20 text-green-400 border border-green-500"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-blue-400 font-semibold">Request Type</h3>
                <p className="text-gray-100 leading-relaxed break-words">
                  {req.requestType}
                </p>
              </div>

              <div className="space-y-2 mt-3">
                <h3 className="text-blue-400 font-semibold">Reason</h3>
                <p className="text-gray-100 leading-relaxed break-words">
                  {req.requestReason}
                </p>
              </div>

              {/* Approved Info */}
              {req.status === "Approved" && (
                <div className="mt-4 pt-4 border-t border-gray-600 space-y-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <h4 className="text-green-400 font-semibold flex items-center gap-2">
                        <CheckCircle size={16} />
                        Approved for Pickup
                      </h4>
                    </div>

                    <div className="space-y-1 text-gray-300 text-xs sm:text-sm">
                      <p>
                        <Calendar className="inline w-4 h-4 mr-1" color="#ffffff" />
                        Pickup Date:{" "}
                        {req.pickupDate
                          ? formatPickupDateTime(req.pickupDate)
                          : "TBA"}
                      </p>
                      {req.adminRemarks && (
                        <p>
                          <FileText className="inline w-4 h-4 mr-1" />
                          Remarks: {req.adminRemarks}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Declined Info */}
              {req.status === "Declined" && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2 text-gray-300 text-xs sm:text-sm">
                    <h4 className="text-red-400 font-semibold flex items-center gap-2">
                      <AlertCircle size={16} /> Declined
                    </h4>
                    <p>
                      {req.adminRemarks
                        ? `Reason: ${req.adminRemarks}`
                        : "No remarks provided."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
