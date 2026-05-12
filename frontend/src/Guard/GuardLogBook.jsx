import { useEffect, useState } from "react";
import { ClipboardList, Clock, FileText, Image as ImageIcon, LogIn, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";

export default function GuardLogBook() {
  const api = import.meta.env.VITE_API_URL;
  const { user: guard, loading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    post: "",
    shift: "",
    type: "",
    remarks: "",
    image: null,
  });
  const [loadingPage, setLoadingPage] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
      return;
    }

    const fetchInitialData = async () => {
      if (!guard) return;
      setLoadingPage(true);

      try {
        const scheduleRes = await fetch(`${api}/api/logbook/current-info/${guard._id}`, {
          credentials: "include",
        });

        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          setScheduleInfo(scheduleData);
          setForm((prev) => ({
            ...prev,
            post: "",
            shift: scheduleData.shiftType,
          }));
          if (!scheduleData.hasTimedIn) {
            setMessage("You must time-in before you can create a log entry.");
          }
        } else {
          setMessage("You do not have an active schedule, so you cannot create a log entry.");
        }

        const logsRes = await fetch(`${api}/api/logbook?guardId=${guard._id}`, {
          credentials: "include",
        });

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
        } else {
          setMessage("Failed to load logs.");
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setMessage("Error loading page data.");
      } finally {
        setLoadingPage(false);
      }
    };

    if (guard) {
      fetchInitialData();
    }
  }, [api, guard, loading, navigate]);

  useEffect(() => {
    if (!form.image) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(form.image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [form.image]);

  const handleAddLog = async () => {
    if (!form.post || !form.shift || !form.type || !form.remarks) {
      setMessage("Please fill in all fields before adding a log entry.");
      return;
    }

    try {
      setLoadingPage(true);
      setMessage("");

      const payload = new FormData();
      payload.append("post", form.post);
      payload.append("shift", form.shift);
      payload.append("type", form.type);
      payload.append("remarks", form.remarks);
      payload.append("scheduleId", scheduleInfo?.scheduleId || "");
      if (form.image) {
        payload.append("image", form.image);
      }

      const response = await fetch(`${api}/api/logbook`, {
        method: "POST",
        credentials: "include",
        body: payload,
      });

      if (response.ok) {
        const newLog = await response.json();
        newLog.guard = { fullName: getPersonName(guard), guardId: guard.guardId };
        setLogs((prev) => [newLog, ...prev]);
        setForm((prev) => ({
          ...prev,
          post: "",
          type: "",
          remarks: "",
          image: null,
        }));
        setImagePreview("");
        setMessage("Log entry added successfully.");
      } else {
        const error = await response.json();
        setMessage(error.message || "Failed to add log entry.");
      }
    } catch (error) {
      console.error("Error adding log:", error);
      setMessage("Error adding log entry.");
    } finally {
      setLoadingPage(false);
    }
  };

  const messageTone = message.toLowerCase().includes("success")
    ? "bg-green-500/20 text-green-400 border-green-500/80"
    : message.toLowerCase().includes("please") || message.toLowerCase().includes("must")
      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/80"
      : "bg-red-500/20 text-red-400 border-red-500/80";

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 text-gray-100">
      <div className="mb-8 flex items-center justify-center">
        <ClipboardList className="mr-3 h-7 w-7 text-blue-400" />
        <h1 className="text-2xl font-bold tracking-wide text-white">Guard Logbook</h1>
      </div>

      {scheduleInfo ? (
        <>
          <div className="mb-8 rounded-xl border border-blue-700 bg-blue-900/20 p-4 text-center">
            <p className="font-semibold text-blue-300">
              Current Deployment:{" "}
              <span className="text-white">
                {scheduleInfo.deploymentLocation} ({scheduleInfo.shiftType})
              </span>
            </p>
          </div>

          {scheduleInfo.hasTimedIn ? (
            <div className="mb-10 space-y-4 rounded-2xl border border-gray-700 bg-[#1e293b] p-6 shadow-xl">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-400">
                <FileText size={18} /> Log New Entry
              </h2>

              {message ? (
                <div className={`rounded-md border p-3 text-center text-sm ${messageTone}`}>
                  {message}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  type="text"
                  placeholder="Log Post (e.g., Lobby, Gate 1)"
                  value={form.post}
                  onChange={(e) => setForm((prev) => ({ ...prev, post: e.target.value }))}
                  className="rounded-lg border border-gray-700 bg-[#0f172a] px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={form.shift}
                  onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
                  className="rounded-lg border border-gray-700 bg-[#0f172a] px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-800/50 disabled:text-gray-400"
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
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="rounded-lg border border-gray-700 bg-[#0f172a] px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <textarea
                placeholder="Enter remarks or incident details..."
                value={form.remarks}
                onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                className="h-28 w-full resize-none rounded-lg border border-gray-700 bg-[#0f172a] p-3 text-gray-100 focus:ring-2 focus:ring-blue-500"
              />

              <div className="rounded-xl border border-dashed border-gray-600 bg-[#0f172a] p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                  <ImageIcon size={16} className="text-blue-400" />
                  Attach Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.files?.[0] || null }))}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Log preview"
                    className="mt-3 max-h-56 rounded-xl border border-gray-700 object-cover"
                  />
                ) : null}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleAddLog}
                  disabled={loadingPage}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 font-semibold text-white shadow-md transition hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500"
                >
                  {loadingPage ? "Adding..." : "Add Log Entry"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-xl border border-orange-700 bg-orange-900/20 p-6 text-center">
              <p className="font-semibold text-orange-300">Time-In Required</p>
              <p className="mt-1 text-orange-400/80">
                You must time-in for your current shift before you can create a logbook entry.
              </p>
              <Link
                to="/guard/guard-attendance/time-in"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
              >
                <LogIn size={16} /> Go to Time-In
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="mb-8 rounded-xl border border-yellow-700 bg-yellow-900/20 p-6 text-center">
          <p className="font-semibold text-yellow-300">No Active Schedule</p>
          <p className="mt-1 text-yellow-400/80">
            You cannot create a logbook entry because you do not have an active duty schedule at this time.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {loadingPage && logs.length === 0 ? (
          <p className="text-center italic text-gray-400">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-center italic text-gray-400">No log entries yet.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log._id}
              className="rounded-2xl border border-gray-700 bg-[#1e293b] p-5 shadow-lg transition hover:shadow-blue-500/10"
            >
              <div className="mb-3 flex justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock size={14} className="text-blue-400" />
                  <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <h3 className="mb-1 text-lg font-semibold text-blue-400">{log.type}</h3>
              <p className="mb-2 text-sm text-gray-300">
                <MapPin className="mr-1 inline h-4 w-4 text-blue-400" />
                <span className="font-semibold">{log.post}</span> - {log.shift}
              </p>
              <p className="leading-relaxed text-gray-100">{log.remarks}</p>

              {log.imageUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-700 bg-[#0f172a]">
                  <img
                    src={log.imageUrl}
                    alt={`${log.type} attachment`}
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
