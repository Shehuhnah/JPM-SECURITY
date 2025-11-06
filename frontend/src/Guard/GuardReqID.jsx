import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Tag,
  Calendar,
  X,
} from "lucide-react";
import { guardAuth } from "../hooks/guardAuth";

export default function GuardReqID() {
  const { token } = guardAuth();
  const [form, setForm] = useState({ requestType: "", reason: "" });
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch requests of current guard
  useEffect(() => {
    document.title = "Request COE | JPM Agency Security";
    
    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/idrequests/myrequests", {
          headers: {
            Authorization: `Bearer ${token}`,
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
    fetchRequests();
  }, [token]);

  // Submit new ID/Lanyard request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.requestType || !form.reason.trim()) {
      setMessage("⚠️ Please select a request type and provide a reason.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await fetch("http://localhost:5000/api/idrequests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          requestType: form.requestType,
          requestReason: form.reason,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      const res2 = await fetch("http://localhost:5000/api/idrequests/myrequests", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res2.json();
      setRequests(data.data || []);
      setForm({ requestType: "", reason: "" });
      setMessage("✅ Your request has been submitted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("❌ Error submitting request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 sm:p-6">
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
          <div>
            <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base">
              Type of Request
            </label>
            <select
              name="requestType"
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value })}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="">Select an option</option>
              <option value="ID Only">ID Only</option>
              <option value="Lanyard Only">Lanyard Only</option>
              <option value="ID with Lanyard">ID with Lanyard</option>
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
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
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
        <h2 className="text-lg sm:text-xl font-semibold text-blue-400 flex items-center gap-2">
          <Tag size={20} /> Your Previous Requests
        </h2>

        {requests.length === 0 ? (
          <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 sm:p-8 text-center">
            <FileText className="text-gray-500 w-10 h-10 mx-auto mb-3" />
            <p className="text-gray-400 italic text-sm sm:text-base">
              No ID requests submitted yet.
            </p>
          </div>
        ) : (
          requests.map((req) => (
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
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Pickup Date:{" "}
                        {req.pickupDate
                          ? new Date(req.pickupDate).toLocaleDateString()
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
