import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, User, Calendar, CheckCircle, ArrowLeft, Timer } from "lucide-react";
import { useAuth } from "../hooks/useAuth"; //bagong code

function GuardAttendanceTimeOut() {
  const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [timeInData, setTimeInData] = useState(null);
  const [workingHours, setWorkingHours] = useState("0h 0m");
  const [loadingPage, setLoadingPage] = useState(false); //bagong code
  const [error, setError] = useState(null);
  const { user: guard , loading } = useAuth();//bagong code
  const user = {
    fullName: guard?.fullName ?? "Unknown",
    guardId: guard?.guardId ?? guard?._id ?? guard?.id ?? "Unknown",
  };

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    useEffect(() => {
      const loadActiveDuty = async () => {
        if (!guard?._id) return;

        setLoadingPage(true);
        setError(null);

        try {
          const res = await fetch(`${API_BASE}/api/attendance/${guard._id}`, {
            credentials: "include",
          });
          const data = await res.json().catch(() => []);
          if (!res.ok) throw new Error(data?.message || "Failed to fetch attendance");

          // Find active duty: status "On Duty" and no timeOut for the current day
          const todayISO = new Date().toISOString().split('T')[0];
          const activeDuty = Array.isArray(data)
            ? data.find(r => r.status === "On Duty" && !r.timeOut && new Date(r.timeIn).toISOString().split('T')[0] === todayISO)
            : null;

          if (activeDuty) setTimeInData(activeDuty);

        } catch (e) {
          setError(e.message || "Failed to load attendance");
        } finally {
          setLoadingPage(false);
        }
      };

      loadActiveDuty();
    }, [guard?._id]);

    useEffect(() => {
      if (!timeInData) return;

      const timeIn = new Date(timeInData.timeIn); 
      const timeOut = currentTime;

      let diffMs = timeOut - timeIn;
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setWorkingHours(`${diffHours}h ${diffMinutes}m`);
    }, [currentTime, timeInData]);

    const handleTimeOut = async () => {
      if (!timeInData) {
        alert("No active time-in record found. Please time in first.");
        return;
      }

      try {
        const payload = {
          timeOut: currentTime.toISOString(),
          status: "Off Duty",
        };

        const res = await fetch(
          `${API_BASE}/api/attendance/attendance-time-out/${timeInData._id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );

        const updated = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(updated?.message || `Failed to time out (${res.status})`);

        setAttendanceData(updated);
        setIsSubmitted(true);
        setTimeInData(null); 

      } catch (e) {
        console.error("Time out failed:", e);
        alert(e.message || "Failed to submit time out");
      }
    };

    const formatTime = (date) =>
      new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const formatDate = (date) =>
      new Date(date).toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });


  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <Clock className="text-red-400 w-7 h-7 mr-3" />
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Time Out Attendance
        </h1>
      </div>

      {/* Main Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6">
          {/* User Profile Section */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-500 to-red-600 flex items-center justify-center shadow-lg mb-4 mx-auto">
              <User className="text-white w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {user?.fullName?.toUpperCase() || "GUARD NAME"}
            </h2>
            <p className="text-gray-400 text-sm">ID: {user?.guardId || "Unknown"}</p>
          </div>

          {/* Real-time Clock */}
          <div className="bg-[#0f172a] rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="text-red-400 w-5 h-5" />
              <span className="text-red-400 font-medium">Current Date & Time</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-400">
              {formatDate(currentTime)}
            </div>
          </div>

          {loading && (
            <div className="mb-4 text-sm text-blue-300">Loading today’s attendance...</div>
          )}
          {error && (
            <div className="mb-4 text-sm text-red-300">{error}</div>
          )}
          {/* Time In Summary */}
          {timeInData && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-blue-400 w-5 h-5" />
                <span className="text-blue-400 font-semibold">Today's Time In</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-200">{new Date(timeInData.timeIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time In:</span>
                  <span className="text-gray-200">{new Date(timeInData.timeIn).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Client:</span>
                  <span className="text-gray-200">{timeInData.scheduleId?.client || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-200">{timeInData.scheduleId?.deploymentLocation || timeInData.location?.address || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shift:</span>
                  <span className="text-gray-200">{timeInData.scheduleId?.shiftType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Working Hours:</span>
                  <span className="text-blue-400 font-medium">{workingHours}</span>
                </div>
              </div>
            </div>
          )}

          {/* Time Out Summary */}
          {attendanceData && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Time Out Successful!</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-200">{new Date(attendanceData.timeIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time In:</span>
                  <span className="text-gray-200">{new Date(attendanceData.timeIn).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Out:</span>
                  <span className="text-gray-200">{new Date(attendanceData.timeOut).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Hours:</span>
                  <span className="text-green-400 font-medium">
                    {(() => {
                        if (attendanceData.timeIn && attendanceData.timeOut) {
                            const start = new Date(attendanceData.timeIn);
                            const end = new Date(attendanceData.timeOut);
                            const diffMs = end - start;
                            if (diffMs > 0) {
                                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                return `${diffHrs}h ${diffMin}m`;
                            }
                        }
                        return "0h 0m";
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-medium">{attendanceData.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isSubmitted ? (
              <button
                onClick={handleTimeOut}
                disabled={!timeInData}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
              >
                <Clock size={18} />
                {timeInData ? "Submit Time Out" : "No Time In Record"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-green-400 font-medium">
                  ✅ Attendance completed successfully!
                </div>
                <Link
                  to="/guard/guard-attendance/time-in"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Back to Time In
                </Link>
              </div>
            )}
          </div>

          {/* No Time In Warning */}
          {!timeInData && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Timer className="w-4 h-4" />
                <span>No time-in record found for today. Please time in first.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GuardAttendanceTimeOut;
