import { useState, useEffect } from "react";
import { ClipboardList, Clock, MapPin, FileText, Save, X, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function GuardLogBook() {
  const { user: guard, loading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    post: "",
    shift: "",
    type: "",
    remarks: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [loadingPage, setloadingPage] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState(null);

  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
      return;
    }
    
    const fetchInitialData = async () => {
      if (!guard) return;
      setloadingPage(true);
      try {
        // Fetch current schedule info
        const scheduleRes = await fetch(`http://localhost:5000/api/logbook/current-info/${guard._id}`, { credentials: "include" });
        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          setScheduleInfo(scheduleData);
          setForm(prev => ({
            ...prev,
            post: "", 
            shift: scheduleData.shiftType
          }));
          if (!scheduleData.hasTimedIn) {
            setMessage("You must time-in before you can create a log entry.");
          }
        } else {
          console.warn("No active schedule found for this guard.");
          setMessage("You do not have an active schedule, so you cannot create a log entry.");
        }

        // Fetch existing logs
        const logsRes = await fetch(`http://localhost:5000/api/logbook?guardId=${guard._id}`, { credentials: "include" });
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
        } else {
          setMessage("❌ Failed to load logs");
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setMessage("❌ Error loading page data");
      } finally {
        setloadingPage(false);
      }
    };

    if(guard) {
      fetchInitialData();
    }
  }, [guard, loading, navigate]);

  const handleAddLog = async () => {
    if (!form.post || !form.shift || !form.type || !form.remarks) {
      setMessage("⚠️ Please fill in all fields before adding a log entry.");
      return;
    }

    try {
      setloadingPage(true);
      setMessage("");
      
      const response = await fetch("http://localhost:5000/api/logbook", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          scheduleId: scheduleInfo?.scheduleId || null,
        }),
      });

      if (response.ok) {
        const newLog = await response.json();
        newLog.guard = { fullName: guard.fullName, guardId: guard.guardId };
        setLogs([newLog, ...logs]);
        setForm({ ...form, post: "", type: "", remarks: "" });
        setMessage("✅ Log entry added successfully!");
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.message || "Failed to add log entry"}`);
      }
    } catch (error) {
      console.error("Error adding log:", error);
      setMessage("❌ Error adding log entry");
    } finally {
      setloadingPage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6">
      <div className="flex items-center justify-center mb-8">
        <ClipboardList className="text-blue-400 w-7 h-7 mr-3" />
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Guard Logbook
        </h1>
      </div>

       {scheduleInfo ? (
        <>
          <div className="mb-8 p-4 bg-blue-900/20 border border-blue-700 rounded-xl text-center">
            <p className="font-semibold text-blue-300">Current Deployment: <span className="text-white">{scheduleInfo.deploymentLocation} ({scheduleInfo.shiftType})</span></p>
          </div>
          
          {scheduleInfo.hasTimedIn ? (
            /* Log Form */
            <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 space-y-4 mb-10">
              <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                <FileText size={18} /> Log New Entry
              </h2>

              {message && (
                <div
                  className={`p-3 text-sm text-center rounded-md ${
                    message.includes("✅")
                      ? "bg-green-500/20 text-green-400 border border-green-500/80"
                      : message.includes("⚠️")
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/80"
                      : "bg-red-500/20 text-red-400 border border-red-500/80"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Log Post (e.g., Lobby, Gate 1)"
                  value={form.post}
                  onChange={(e) => setForm({ ...form, post: e.target.value })}
                  className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-800/50 disabled:text-gray-400"
                  disabled={!!scheduleInfo}
                >
                  <option value="">Select Shift</option>
                  <option value="Day Shift">Day Shift</option>
                  <option value="Night Shift">Night Shift</option>
                </select>
                <input 
                  type="text"
                  placeholder="Log Type (e.g., Incident, Routine Check)"
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
                  disabled={loadingPage}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition"
                >
                  {loadingPage ? "Adding..." : "Add Log Entry"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-orange-900/20 border border-orange-700 rounded-xl text-center">
              <p className="font-semibold text-orange-300">Time-In Required</p>
              <p className="text-orange-400/80 mt-1">You must time-in for your current shift before you can create a logbook entry.</p>
              <Link to="/guard/guard-attendance/time-in" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">
                <LogIn size={16} /> Go to Time-In
              </Link>
            </div>
          )}
        </>
       ) : (
        <div className="mb-8 p-6 bg-yellow-900/20 border border-yellow-700 rounded-xl text-center">
          <p className="font-semibold text-yellow-300">No Active Schedule</p>
          <p className="text-yellow-400/80 mt-1">You cannot create a logbook entry because you do not have an active duty schedule at this time.</p>
        </div>
       )}

      {/* Log Entries */}
      <div className="space-y-5">
        {loadingPage && logs.length === 0 ? (
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
                      disabled={loadingPage}
                      className="bg-green-600 px-4 py-1 rounded-lg text-white flex items-center gap-1 hover:bg-green-500 disabled:bg-gray-600"
                    >
                      <Save size={14} /> {loadingPage ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={loadingPage}
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