import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, User, Calendar, CheckCircle, ArrowLeft, Timer } from "lucide-react";

function GuardAttendanceTimeOut() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [timeInData, setTimeInData] = useState(null);
  const [workingHours, setWorkingHours] = useState("0h 0m");
  
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load the most recent time-in data
  useEffect(() => {
    const attendanceHistory = JSON.parse(localStorage.getItem("guardAttendance")) || [];
    const todayAttendance = attendanceHistory.filter(record => 
      record.date === currentTime.toLocaleDateString() && 
      record.status === "On Duty"
    );
    
    if (todayAttendance.length > 0) {
      const latestTimeIn = todayAttendance[todayAttendance.length - 1];
      setTimeInData(latestTimeIn);
      
      // Calculate working hours
      const timeIn = new Date(`${latestTimeIn.date} ${latestTimeIn.timeIn}`);
      const timeOut = currentTime;
      const diffMs = timeOut - timeIn;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setWorkingHours(`${diffHours}h ${diffMinutes}m`);
    }
  }, [currentTime]);

  const handleTimeOut = () => {
    if (!timeInData) {
      alert("No time-in record found for today. Please time in first.");
      return;
    }

    const timeOutData = {
      ...timeInData,
      timeOut: currentTime.toLocaleTimeString(),
      workingHours: workingHours,
      status: "Completed",
      completedAt: currentTime.toLocaleString()
    };

    // Update localStorage
    const existingAttendance = JSON.parse(localStorage.getItem("guardAttendance")) || [];
    const updatedAttendance = existingAttendance.map(record => 
      record.id === timeInData.id ? timeOutData : record
    );
    localStorage.setItem("guardAttendance", JSON.stringify(updatedAttendance));

    setAttendanceData(timeOutData);
    setIsSubmitted(true);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
            <p className="text-gray-400 text-sm">ID: {user?.id || "12345"}</p>
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
                  <span className="text-gray-200">{timeInData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time In:</span>
                  <span className="text-gray-200">{timeInData.timeIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-200">{timeInData.location}</span>
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
                  <span className="text-gray-400">Time Out:</span>
                  <span className="text-gray-200">{attendanceData.timeOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Hours:</span>
                  <span className="text-green-400 font-medium">{attendanceData.workingHours}</span>
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
                  to="/Guard/GuardAttendanceTimeIn"
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
