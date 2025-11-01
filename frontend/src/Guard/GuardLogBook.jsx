import { useState, useEffect } from "react";
import { ClipboardList, Clock, MapPin, FileText, Trash2, Edit3, Save, X } from "lucide-react";
import { guardAuth } from "../hooks/guardAuth";

export default function GuardLogBook() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    post: "",
    shift: "",
    type: "",
    remarks: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  
  const { guard, token } = guardAuth();
  console.log(guard);
  console.log(form);
  console.log(form)

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/logbook?guardId=${guard._id}`, {
        
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setMessage("❌ Failed to load logs");
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setMessage("❌ Error loading logs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!form.post || !form.shift || !form.type || !form.remarks) {
      setMessage("⚠️ Please fill in all fields before adding a log entry.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      
      const response = await fetch("http://localhost:5000/api/logbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          guardId: guard._id,
        }),
      });

      if (response.ok) {
        const newLog = await response.json();
        setLogs([newLog, ...logs]);
        setForm({ post: "", shift: "", type: "", remarks: "" });
        setMessage("✅ Log entry added successfully!");
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.message || "Failed to add log entry"}`);
      }
    } catch (error) {
      console.error("Error adding log:", error);
      setMessage("❌ Error adding log entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <ClipboardList className="text-blue-400 w-7 h-7 mr-3" />
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Guard Logbook
        </h1>
      </div>

      {/* Log Form */}
      <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 space-y-4 mb-10">
        <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
          <FileText size={18} /> Log New Entry
        </h2>

        {message && (
          <div
            className={`p-3 text-sm text-center rounded-md ${
              message.includes("✅")
                ? "bg-green-500/20 text-green-400 border border-green-500"
                : "bg-red-500/20 text-red-400 border border-red-500"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Post / Duty Station"
            value={form.post}
            onChange={(e) => setForm({ ...form, post: e.target.value })}
            className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.shift}
            onChange={(e) => setForm({ ...form, shift: e.target.value })}
            className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Shift</option>
            <option value="Day Shift">Day Shift</option>
            <option value="Night Shift">Night Shift</option>
          </select>
          <input 
            type="text"
            placeholder="Log Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
             />
        </div>

        <textarea
          placeholder="Enter remarks or incident details..."
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className="w-full h-28 bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex justify-center">
          <button
            onClick={handleAddLog}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition"
          >
            {loading ? "Adding..." : "Add Log Entry"}
          </button>
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-5">
        {loading && logs.length === 0 ? (
          <p className="text-center text-gray-400 italic">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-400 italic">No log entries yet.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log._id}
              className="bg-[#1e293b] border border-gray-700 rounded-2xl p-5 shadow-lg hover:shadow-blue-500/10 transition"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock size={14} className="text-blue-400" />
                  <span>{new Date(log.createdAt).toLocaleDateString()}</span>•<span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {log.updatedAt && log.updatedAt !== log.createdAt && (
                    <span className="italic text-gray-500">
                      (edited {new Date(log.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  )}
                </div>

                {/* Edit/Delete Buttons
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(log)}
                    disabled={loading}
                    className="text-blue-400 hover:text-blue-300 disabled:text-gray-500"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(log._id)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 disabled:text-gray-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div> */}
              </div>

              {editingId === log._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingData.remarks}
                    onChange={(e) =>
                      setEditingData({ ...editingData, remarks: e.target.value })
                    }
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-2 text-gray-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="bg-green-600 px-4 py-1 rounded-lg text-white flex items-center gap-1 hover:bg-green-500 disabled:bg-gray-600"
                    >
                      <Save size={14} /> {loading ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={loading}
                      className="bg-gray-600 px-4 py-1 rounded-lg text-white flex items-center gap-1 hover:bg-gray-500 disabled:bg-gray-700"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-blue-400 mb-1">
                    {log.type}
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">
                    <MapPin className="inline w-4 h-4 text-blue-400 mr-1" />
                    <span className="font-semibold">{log.post}</span> —{" "}
                    {log.shift}
                  </p>
                  <p className="text-gray-100 leading-relaxed">
                    {log.remarks}
                  </p>
                  
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
