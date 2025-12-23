import { useState, useEffect, useRef, Fragment } from "react";
import {
  Clock,
  Camera,
  User,
  Calendar,
  CheckCircle,
  MapPin,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";

function GuardAttendanceTimeIn() {
  const { user: guard, loading } = useAuth();
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API_URL;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // --- HELPER FUNCTIONS ---

  // Check if a schedule is currently active (Now is between In and Out)
  const isShiftOngoing = (schedule) => {
    if (!schedule) return false;
    const now = new Date();
    const start = new Date(schedule.timeIn);
    const end = new Date(schedule.timeOut);
    // Optional: Add a 2-hour buffer before start if needed
    // start.setHours(start.getHours() - 2); 
    return now >= start && now <= end;
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (date) =>
    date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

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
    return dateObj.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  // --- EFFECTS ---

  // Redirect if not authenticated
  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
    }
  }, [guard, loading, navigate]);

  // Current time ticker
  useEffect(() => {
    document.title = "Time in | JPM Security Agency";
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Schedules & Auto-Select Ongoing
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!guard?._id) return;

      setChecking(true);
      setCheckError(null);
      try {
        const res = await fetch(`${api}/api/schedules/today/${guard._id}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch today's schedules.");

        const { schedules } = await res.json();
        setAvailableSchedules(schedules);

        // INTELLIGENT AUTO-SELECT:
        // 1. Look for a shift happening RIGHT NOW
        const ongoing = schedules.find((s) => isShiftOngoing(s));
        
        if (ongoing) {
          setSelectedSchedule(ongoing);
        } else if (schedules.length === 1) {
          // 2. Fallback: If only one exists, pick it
          setSelectedSchedule(schedules[0]);
        }
      } catch (err) {
        console.error("Schedule fetch failed:", err);
        setCheckError(err.message || "Failed to load today's schedules.");
        setAvailableSchedules([]);
      } finally {
        setChecking(false);
      }
    };

    fetchSchedules();
  }, [guard?._id, api]);

  // Check Attendance Status for Selected Schedule
  useEffect(() => {
    const checkAttendance = async () => {
      if (!selectedSchedule?._id) return;

      setChecking(true);
      setCheckError(null);
      try {
        const res = await fetch(`${api}/api/attendance`, {
          credentials: "include",
        });
        const allAttendance = await res.json();

        const existingRecord = allAttendance.find(
          (rec) => rec.scheduleId?._id === selectedSchedule._id && !rec.timeOut
        );

        if (existingRecord) {
          setAttendanceData(existingRecord);
          setIsSubmitted(true);
          setCheckError("You have already timed in for this schedule. Proceed to Time-Out page.");
        } else {
          setAttendanceData(null);
          setIsSubmitted(false);
          setCheckError(null);
        }
      } catch (err) {
        console.error("Attendance check failed:", err);
        setCheckError("Failed to check attendance status.");
      } finally {
        setChecking(false);
      }
    };
    checkAttendance();
  }, [selectedSchedule?._id, api]);

  // Geolocation
  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "JPM-Security/1.0" } });
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
      (error) => {
        console.error("Error getting location:", error);
        setCurrentLocation({ latitude: 0, longitude: 0, address: "Location unavailable" });
      }
    );
  }, []);

  // Camera Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // --- CAMERA HANDLERS ---

  const startCamera = async () => {
    if (!selectedSchedule) {
      setCheckError("Please select a schedule to time-in for.");
      return;
    }
    setCheckError(null);

    try {
      setShowCamera(true);
      setCameraLoading(true);
      const constraints = { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } };

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
        video.oncanplay = () => { tryPlay(); setCameraLoading(false); };
      });
    } catch (error) {
      console.error("Camera error:", error);
      setCameraLoading(false);
      setCheckError("Unable to access camera.");
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

    // 1. OPTIMIZATION: SCALE DOWN THE IMAGE
    // We don't need HD 1280px for attendance. 640px is perfect.
    const targetWidth = 640;
    const scaleFactor = targetWidth / video.videoWidth;
    const targetHeight = video.videoHeight * scaleFactor;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw the resized image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. ADJUST OVERLAY FOR SMALLER SIZE
    // Since the image is smaller, we scale down the black box and font
    const boxHeight = 110; // Reduced from 170
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, boxHeight);

    ctx.fillStyle = "white";
    // Reduced font size from 24px to 13px to fit the smaller image
    ctx.font = "bold 13px Arial"; 
    ctx.textAlign = "left";

    const guardName = guard?.fullName || "Unknown";
    const guardIdCode = guard?.guardId || guard?._id || "Unknown";
    const dutyStation = selectedSchedule?.deploymentLocation || "Unknown";
    const position = selectedSchedule?.position || "Unknown";
    const shift = selectedSchedule?.shiftType || "Unknown";
    const siteAddress = currentLocation?.address || dutyStation || "Unknown";

    // Adjusted Y-coordinates for the smaller font/box
    const lineHeight = 18;
    let startY = 25;

    ctx.fillText(`Guard: ${guardName} (ID: ${guardIdCode})`, 10, startY);
    ctx.fillText(`Role: ${position} | Shift: ${shift}`, 10, startY + lineHeight);
    ctx.fillText(`Station: ${dutyStation}`, 10, startY + (lineHeight * 2)); // Split station to new line if long
    ctx.fillText(`Time: ${currentTime.toLocaleString()}`, 10, startY + (lineHeight * 3));
    
    // Truncate address if too long
    const shortAddr = siteAddress.length > 50 ? siteAddress.substring(0, 50) + "..." : siteAddress;
    ctx.fillText(`Site: ${shortAddr}`, 10, startY + (lineHeight * 4));

    // 3. OPTIMIZATION: LOWER JPEG QUALITY
    // 0.5 is perfectly readable for attendance but much smaller in file size
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

  // --- SUBMIT HANDLER ---

  const handleTimeIn = async () => {
    setSubmitError(null);

    if (!selectedSchedule) return setSubmitError("Please select a schedule first.");
    if (!capturedImage) return setSubmitError("Please take a photo before submitting.");
    if (isSubmitted) return setSubmitError("Already timed in.");

    setSubmitting(true);

    const timeInData = {
      scheduleId: selectedSchedule._id,
      location: currentLocation,
      photo: capturedImage,
    };

    try {
      const res = await fetch(`${api}/api/attendance/attendance-time-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timeInData),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || `Failed to submit (${res.status})`);

      setAttendanceData(payload);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Failed to submit attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 sm:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <Camera className="text-blue-400 w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white text-center">
          Time In Attendance
        </h1>
      </div>

      {/* Camera Modal */}
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
            {/* Overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-4">
                <div className="text-white text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{guard?.fullName}</span>
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
            {/* Controls */}
            <div className="absolute bottom-8 xl:bottom-47 left-0 right-0 px-4 flex justify-center gap-4">
              <button onClick={stopCamera} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full font-semibold">
                Cancel
              </button>
              <button onClick={capturePhoto} disabled={isCapturing} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2">
                <Camera size={20} />
                {isCapturing ? "Capturing..." : "Capture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto w-full">
        <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6">
          {checking && <div className="mb-4 text-sm text-blue-300">Loading schedules...</div>}
          {checkError && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3">
              {checkError}
            </div>
          )}

          {/* Profile */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 mx-auto">
              <User className="text-white w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {guard?.fullName?.toUpperCase()}
            </h2>
            <p className="text-gray-400 text-sm">ID: {guard?.guardId || guard?._id}</p>
          </div>

          {/* SCHEDULE DROPDOWN - IMPROVED */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Your Shift
            </label>
            <Menu as="div" className="relative block text-left">
              <div>
                <Menu.Button className="inline-flex justify-between w-full rounded-md border border-gray-700 shadow-sm px-4 py-3 bg-[#0f172a] text-sm font-medium text-white hover:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                  {selectedSchedule ? (
                    <div className="flex flex-col items-start w-full">
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-semibold truncate">{selectedSchedule.client}</span>
                        {isShiftOngoing(selectedSchedule) && (
                          <span className="shrink-0 bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Active Now
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5 truncate w-full text-left">
                        {selectedSchedule.deploymentLocation}
                      </span>
                    </div>
                  ) : (
                    "Choose a schedule"
                  )}
                  <ChevronDown className="-mr-1 ml-2 h-5 w-5 text-gray-400 mt-1" aria-hidden="true" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute left-0 mt-2 w-full rounded-md shadow-lg bg-[#0f172a] ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto z-10 border border-gray-700">
                  <div className="py-1">
                    {availableSchedules.length > 0 ? (
                      availableSchedules.map((schedule) => {
                        const isLive = isShiftOngoing(schedule);
                        return (
                          <Menu.Item key={schedule._id}>
                            {({ active }) => (
                              <button
                                onClick={() => setSelectedSchedule(schedule)}
                                className={`${
                                  active ? "bg-[#1e293b]" : ""
                                } flex flex-col items-start px-4 py-3 text-sm w-full border-b border-gray-700/50 last:border-0 transition-colors`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className={`font-semibold truncate flex-1 mr-2 ${isLive ? 'text-white' : 'text-gray-300'}`}>
                                    {schedule.client}
                                  </span>
                                  {isLive && (
                                    <span className="flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse">
                                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> ACTIVE
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 mb-1">
                                  {schedule.deploymentLocation}
                                </span>
                                <div className={`text-xs flex gap-2 ${isLive ? 'text-green-400' : 'text-gray-500'}`}>
                                  <span>{schedule.shiftType}</span>
                                  <span>•</span>
                                  <span>{formatTimeDisplay(schedule.timeIn)} - {formatTimeDisplay(schedule.timeOut)}</span>
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                        );
                      })
                    ) : (
                      <Menu.Item disabled>
                        <span className="block text-gray-500 px-4 py-2 text-sm">No schedules available</span>
                      </Menu.Item>
                    )}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Time & Location Cards */}
          <div className="bg-[#0f172a] rounded-lg p-4 mb-4 text-center border border-gray-700/50">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="text-blue-400 w-5 h-5" />
              <span className="text-blue-400 font-medium">Current Time</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1 tracking-wider">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-400">{formatDate(currentTime)}</div>
          </div>

          <div className="bg-[#0f172a] rounded-lg p-4 mb-6 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-blue-400 w-5 h-5" />
              <span className="text-blue-400 font-medium">Current Location</span>
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

          {/* Captured Preview */}
          {capturedImage && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Photo Ready</span>
              </div>
              <div className="relative group">
                <img src={capturedImage} alt="Captured attendance" className="w-full rounded-lg border border-gray-600 shadow-lg" />
                <button onClick={retakePhoto} className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-sm" title="Retake Photo">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Success Summary */}
          {isSubmitted && attendanceData && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Time In Successful!</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-green-500/10 pb-1">
                  <span className="text-gray-400">Date</span>
                  <span className="text-gray-200">{formatDateDisplay(attendanceData.timeIn)}</span>
                </div>
                <div className="flex justify-between border-b border-green-500/10 pb-1">
                  <span className="text-gray-400">Time In</span>
                  <span className="text-gray-200 font-bold">{formatTimeDisplay(attendanceData.timeIn)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400 font-medium">{attendanceData.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {submitError && (
              <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
                {submitError}
              </div>
            )}
            {!isSubmitted ? (
              <button
                onClick={capturedImage ? handleTimeIn : startCamera}
                disabled={submitting || checking || !selectedSchedule}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Camera size={20} />
                {submitting ? "Submitting..." : (capturedImage ? "Confirm Time In" : "Take Photo")}
              </button>
            ) : (
              <button
                onClick={() => navigate("/guard/guard-attendance/time-out")}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Clock size={20} />
                Go to Time Out
              </button>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default GuardAttendanceTimeIn;