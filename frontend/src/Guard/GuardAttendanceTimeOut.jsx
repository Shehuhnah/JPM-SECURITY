import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Timer,
  Camera,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";

function GuardAttendanceTimeOut() {
  const api = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { user: guard, loading } = useAuth();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [timeInData, setTimeInData] = useState(null);
  const [workingHours, setWorkingHours] = useState("0h 0m");
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const user = {
    fullName: getPersonName(guard),
    guardId: guard?.guardId ?? guard?._id ?? guard?.id ?? "Unknown",
  };

  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
    }
  }, [guard, loading, navigate]);

  useEffect(() => {
    document.title = "Time out | JPM Security Agency";
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadActiveDuty = async () => {
      if (!guard?._id) return;

      setLoadingPage(true);
      setError(null);

      try {
        const res = await fetch(`${api}/api/attendance/${guard._id}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to fetch attendance");

        const activeDuty = Array.isArray(data)
          ? data.find((record) => record.status === "On Duty" && !record.timeOut)
          : null;

        if (activeDuty) setTimeInData(activeDuty);
      } catch (e) {
        setError(e.message || "Failed to load attendance");
      } finally {
        setLoadingPage(false);
      }
    };

    loadActiveDuty();
  }, [guard?._id, api]);

  useEffect(() => {
    if (!timeInData?.timeIn) return;

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

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "JPM-Security/1.0" },
      });
      if (!res.ok) throw new Error("Geocode failed");
      const data = await res.json();
      return data.display_name || data.address?.road || "Location detected";
    } catch (e) {
      console.warn("Reverse geocoding failed:", e);
      return "Location detected";
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        setCurrentLocation({ latitude: lat, longitude: lng, address });
      },
      (geoError) => {
        console.error("Error getting location:", geoError);
        setCurrentLocation({ latitude: 0, longitude: 0, address: "Location unavailable" });
      }
    );
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    if (!timeInData) {
      setError("No active time-in record found. Please time in first.");
      return;
    }

    setError(null);

    try {
      setShowCamera(true);
      setCameraLoading(true);
      const constraints = {
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera not supported.");

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        streamRef.current = stream;
        const tryPlay = () => video.play().catch(() => {});
        tryPlay();
        video.onloadedmetadata = tryPlay;
        video.oncanplay = () => {
          tryPlay();
          setCameraLoading(false);
        };
      });
    } catch (cameraError) {
      console.error("Camera error:", cameraError);
      setCameraLoading(false);
      setShowCamera(false);
      setError("Unable to access camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const targetWidth = 640;
    const scaleFactor = targetWidth / video.videoWidth;
    const targetHeight = video.videoHeight * scaleFactor;

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const boxHeight = 110;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, boxHeight);

    ctx.fillStyle = "white";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";

    const dutyStation =
      timeInData?.scheduleId?.deploymentLocation || currentLocation?.address || "Unknown";
    const shift = timeInData?.scheduleId?.shiftType || "Unknown";
    const siteAddress = currentLocation?.address || dutyStation;
    const shortAddr =
      siteAddress.length > 50 ? `${siteAddress.substring(0, 50)}...` : siteAddress;

    const lineHeight = 18;
    const startY = 25;

    ctx.fillText(`Guard: ${user.fullName} (ID: ${user.guardId})`, 10, startY);
    ctx.fillText(`Action: Time Out | Shift: ${shift}`, 10, startY + lineHeight);
    ctx.fillText(`Station: ${dutyStation}`, 10, startY + lineHeight * 2);
    ctx.fillText(`Time: ${currentTime.toLocaleString()}`, 10, startY + lineHeight * 3);
    ctx.fillText(`Site: ${shortAddr}`, 10, startY + lineHeight * 4);

    const imageData = canvas.toDataURL("image/jpeg", 0.5);
    setCapturedImage(imageData);

    setTimeout(() => {
      setIsCapturing(false);
      stopCamera();
    }, 500);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleTimeOut = async () => {
    if (!timeInData) {
      setError("No active time-in record found. Please time in first.");
      return;
    }

    if (!capturedImage) {
      setError("Please take a photo before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${api}/api/attendance/attendance-time-out/${timeInData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          photo: capturedImage,
        }),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated?.message || `Failed to time out (${res.status})`);

      setAttendanceData(updated);
      setIsSubmitted(true);
      setTimeInData(null);
      setCapturedImage(null);
    } catch (e) {
      console.error("Time out failed:", e);
      setError(e.message || "Failed to submit time out");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTimeDisplay = (timeString) => {
    if (!timeString) return "N/A";
    const dateObj = new Date(timeString);
    if (isNaN(dateObj.getTime())) return "Invalid Time";

    let h = dateObj.getHours();
    const m = dateObj.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "Invalid Date";

    return dateObj.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6">
      <div className="flex items-center justify-center mb-8">
        <Clock className="text-red-400 w-7 h-7 mr-3" />
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Time Out Attendance
        </h1>
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {cameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-sm font-medium px-4 py-2 bg-black/60 rounded-lg border border-white/10">
                  Initializing camera...
                </div>
              </div>
            )}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-4">
                <div className="text-white text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{user.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{currentTime.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{currentLocation?.address || "Getting location..."}</span>
                  </div>
                </div>
              </div>
              {isCapturing && (
                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                  <div className="text-white text-2xl font-bold">CAPTURING...</div>
                </div>
              )}
            </div>
            <div className="absolute bottom-8 xl:bottom-47 left-0 right-0 px-4 flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={isCapturing}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2"
              >
                <Camera size={20} />
                {isCapturing ? "Capturing..." : "Capture"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-500 to-red-600 flex items-center justify-center shadow-lg mb-4 mx-auto">
              <User className="text-white w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {user.fullName.toUpperCase()}
            </h2>
            <p className="text-gray-400 text-sm">ID: {user.guardId}</p>
          </div>

          <div className="bg-[#0f172a] rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="text-red-400 w-5 h-5" />
              <span className="text-red-400 font-medium">Current Date & Time</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-400">{formatDate(currentTime)}</div>
          </div>

          <div className="bg-[#0f172a] rounded-lg p-4 mb-6 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-red-400 w-5 h-5" />
              <span className="text-red-400 font-medium">Current Location</span>
            </div>
            <div className="text-sm text-gray-300">
              {currentLocation ? (
                <div>
                  <div className="font-medium text-white mb-1">{currentLocation.address}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">Getting location...</div>
              )}
            </div>
          </div>

          {loadingPage && (
            <div className="mb-4 text-sm text-blue-300">Loading today&apos;s attendance...</div>
          )}
          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3">
              {error}
            </div>
          )}

          {timeInData && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-blue-400 w-5 h-5" />
                <span className="text-blue-400 font-semibold">Open Time In Record</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-200">{formatDateDisplay(timeInData.timeIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time In:</span>
                  <span className="text-gray-200">{formatTimeDisplay(timeInData.timeIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Client:</span>
                  <span className="text-gray-200">{timeInData.scheduleId?.client || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-200">
                    {timeInData.scheduleId?.deploymentLocation || timeInData.location?.address || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shift:</span>
                  <span className="text-gray-200">{timeInData.scheduleId?.shiftType || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Working Hours:</span>
                  <span className="text-blue-400 font-medium">{workingHours}</span>
                </div>
              </div>
            </div>
          )}

          {capturedImage && !isSubmitted && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Photo Ready</span>
              </div>
              <div className="relative group">
                <img
                  src={capturedImage}
                  alt="Captured time out"
                  className="w-full rounded-lg border border-gray-600 shadow-lg"
                />
                <button
                  onClick={retakePhoto}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                  title="Retake Photo"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {attendanceData && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Time Out Successful!</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-200">{formatDateDisplay(attendanceData.timeIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time In:</span>
                  <span className="text-gray-200">{formatTimeDisplay(attendanceData.timeIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Out:</span>
                  <span className="text-gray-200">{formatTimeDisplay(attendanceData.timeOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Hours:</span>
                  <span className="text-green-400 font-medium">
                    {attendanceData.workSummary?.totalHours
                      ? `${attendanceData.workSummary.totalHours}h`
                      : "0h 0m"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-medium">{attendanceData.status}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {!isSubmitted ? (
              <button
                onClick={capturedImage ? handleTimeOut : startCamera}
                disabled={!timeInData || submitting}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                <Camera size={18} />
                {submitting ? "Submitting..." : capturedImage ? "Confirm Time Out" : "Take Photo"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-green-400 font-medium">
                  Attendance completed successfully.
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

          {!timeInData && !attendanceData && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Timer className="w-4 h-4" />
                <span>No open time-in record found. Time in first using a schedule assigned for today.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default GuardAttendanceTimeOut;
