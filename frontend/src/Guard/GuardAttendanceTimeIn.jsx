import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Camera,
  User,
  Calendar,
  CheckCircle,
  ArrowRight,
  MapPin,
  RotateCcw,
  List,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

function GuardAttendanceTimeIn() {
  const { user: guard, loading } = useAuth();
  const navigate = useNavigate();
  const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

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

  // Redirect to login when not authenticated
  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
    }
  }, [guard, loading, navigate]);

  // Fetch today's approved schedules for the guard
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!guard?._id) return;

      setChecking(true);
      setCheckError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/schedules/today/${guard._id}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch today's schedules.");

        const { schedules } = await res.json();
        setAvailableSchedules(schedules);

        // Auto-select first schedule if only one is available
        if (schedules.length === 1) {
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
  }, [guard?._id]);

  // Check attendance for selected schedule
  useEffect(() => {
    const checkAttendance = async () => {
      if (!selectedSchedule?._id) return;

      setChecking(true);
      setCheckError(null);
      try {
        // Check if there's already an attendance record for this schedule
        const res = await fetch(`${API_BASE}/api/attendance`, {
          credentials: "include",
        });
        const allAttendance = await res.json(); // Fetch all to find specific schedule
        
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
  }, [selectedSchedule?._id]);


  // Current time ticker
  useEffect(() => {
    document.title = "Time in | JPM Security Agency";
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Geolocation for current location
  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "JPM-Security-Attendance/1.0 (contact: support@jpm-security.local)" } });
      if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
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

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    if (!selectedSchedule) {
        setCheckError("Please select a schedule to time-in for.");
        return;
    }
    setCheckError(null); // Clear previous errors

    try {
      setShowCamera(true);
      setCameraLoading(true);

      const constraintsPrimary = { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } };
      const constraintsFallback = { video: true };

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser.");
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsPrimary);
      } catch (e1) {
        console.warn("Primary constraints failed, trying fallback:", e1);
        stream = await navigator.mediaDevices.getUserMedia(constraintsFallback);
      }

      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        streamRef.current = stream;

        const tryPlay = () => video.play().catch(() => {});
        tryPlay();
        video.onloadedmetadata = tryPlay;
        video.oncanplay = () => { tryPlay(); setCameraLoading(false); };
        setTimeout(() => { if (video.videoWidth === 0 || video.videoHeight === 0) tryPlay(); else setCameraLoading(false); }, 150);
      });
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraLoading(false);
      setCheckError("Unable to access camera. Check permissions or network.");
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, 170);

    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";

    const guardName = guard?.fullName || "Unknown";
    const guardIdCode = guard?.guardId || guard?._id || "Unknown";
    const dutyStation = selectedSchedule?.deploymentLocation || "Unknown";
    const position = selectedSchedule?.position || "Unknown";
    const shift = selectedSchedule?.shiftType || "Unknown";
    const siteAddress = currentLocation?.address || dutyStation || "Unknown";

    const timeText = `Time: ${currentTime.toLocaleString()}`;
    const roleText = `Role: ${position} | Shift: ${shift} | Station: ${dutyStation}`;
    const siteText = `Site: ${siteAddress}`;
    const coordsText = currentLocation ? `Coords: ${Number(currentLocation.latitude).toFixed(5)}, ${Number(currentLocation.longitude).toFixed(5)}` : "Coords: Unknown";
    const guardText = `Guard: ${guardName} (ID: ${guardIdCode})`;

    ctx.fillText(guardText, 20, 35);
    ctx.fillText(roleText, 20, 65);
    ctx.fillText(timeText, 20, 95);
    ctx.fillText(siteText, 20, 125);
    ctx.fillText(coordsText, 20, 155);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageData);

    setTimeout(() => {
      setIsCapturing(false);
      stopCamera();
    }, 1000);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleTimeIn = async () => {
    setSubmitError(null);

    if (!selectedSchedule) {
      setSubmitError("Please select a schedule first.");
      return;
    }
    if (!capturedImage) {
      setSubmitError("Please take a photo before submitting.");
      return;
    }
    if (isSubmitted) {
      setSubmitError("You have already timed in for this schedule. Proceed to Time-Out page.");
      return;
    }
    setSubmitting(true);

    const timeInData = {
      scheduleId: selectedSchedule._id,
      location: currentLocation,
      photo: capturedImage,
    };

    try {
      const res = await fetch(`${API_BASE}/api/attendance/attendance-time-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timeInData),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = payload?.message || `Failed to submit attendance (${res.status})`;
        throw new Error(msg);
      }

      setAttendanceData(payload);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Failed to submit attendance to server:", err);
      setSubmitError(err.message || "Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (date) => date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <Camera className="text-blue-400 w-7 h-7 mr-3" />
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Time In Attendance
        </h1>
      </div>

      {/* Camera Interface */}
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

            {/* Camera Overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-4">
                <div className="text-white text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{guard?.fullName || "Guard Name"}</span>
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

              {/* Capture indicator */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                  <div className="text-white text-2xl font-bold">CAPTURING...</div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
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

      {/* Main Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6">
          {checking && (
            <div className="mb-4 text-sm text-blue-300">Loading today’s schedules...</div>
          )}
          {checkError && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3">
              {checkError}
            </div>
          )}

          {/* User Profile Section */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 mx-auto">
              <User className="text-white w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {guard?.fullName?.toUpperCase() || "GUARD NAME"}
            </h2>
            <p className="text-gray-400 text-sm">
              ID: {guard?.guardId || guard?._id || "Unknown"}
            </p>
          </div>

          {/* Schedule Selection */}
          <div className="mb-6">
            <label htmlFor="schedule-select" className="block text-sm font-medium text-gray-300 mb-2">
              Select Your Shift
            </label>
            <Menu as="div" className="relative block text-left">
              <div>
                <Menu.Button className="inline-flex justify-between w-full rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-[#0f172a] text-sm font-medium text-white hover:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                  {selectedSchedule ? (
                    <div className="flex flex-col items-start">
                      <span>{selectedSchedule.client} - {selectedSchedule.deploymentLocation}</span>
                      <span className="text-xs text-gray-400">{selectedSchedule.shiftType} ({new Date(selectedSchedule.timeIn).toLocaleTimeString()} - {new Date(selectedSchedule.timeOut).toLocaleTimeString()})</span>
                    </div>
                  ) : (
                    "Choose a schedule"
                  )}
                  <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
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
                <Menu.Items className="origin-top-right absolute left-0 mt-2 w-full rounded-md shadow-lg bg-[#0f172a] ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto z-10">
                  <div className="py-1">
                    {availableSchedules.length > 0 ? (
                      availableSchedules.map((schedule) => (
                        <Menu.Item key={schedule._id}>
                          {({ active }) => (
                            <button
                              onClick={() => setSelectedSchedule(schedule)}
                              className={`${
                                active ? "bg-[#1e293b] text-white" : "text-gray-300"
                              } flex flex-col items-start px-4 py-2 text-sm w-full`}
                            >
                              <span>{schedule.client} - {schedule.deploymentLocation}</span>
                              <span className="text-xs text-gray-400">{schedule.shiftType} ({new Date(schedule.timeIn).toLocaleTimeString()} - {new Date(schedule.timeOut).toLocaleTimeString()})</span>
                            </button>
                          )}
                        </Menu.Item>
                      ))
                    ) : (
                      <Menu.Item disabled>
                        <span className="text-gray-500 px-4 py-2 text-sm">No schedules available</span>
                      </Menu.Item>
                    )}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
          

          {/* Real-time Clock */}
          <div className="bg-[#0f172a] rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="text-blue-400 w-5 h-5" />
              <span className="text-blue-400 font-medium">Current Date & Time</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-400">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Location Status */}
          <div className="bg-[#0f172a] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-blue-400 w-5 h-5" />
              <span className="text-blue-400 font-medium">Current Location</span>
            </div>
            <div className="text-sm text-gray-300">
              {currentLocation ? (
                <div>
                  <div>📍 {currentLocation.address}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lat: {currentLocation.latitude.toFixed(4)}, Lng:{" "}
                    {currentLocation.longitude.toFixed(4)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Getting location...</div>
              )}
            </div>
          </div>

          {/* Captured Photo Preview */}
          {capturedImage && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Photo Captured!</span>
              </div>
              <div className="relative">
                <img src={capturedImage} alt="Captured attendance photo" className="w-full rounded-lg border border-gray-600" />
                <button onClick={retakePhoto} className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full" title="Retake Photo">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Attendance Summary */}
          {isSubmitted && attendanceData && ( // Only show if submitted and data is present
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Time In Successful!</span>
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
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-200">{attendanceData.location?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Schedule:</span>
                  <span className="text-gray-200">{attendanceData.scheduleId?.client} - {attendanceData.scheduleId?.deploymentLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shift:</span>
                  <span className="text-gray-200">{attendanceData.scheduleId?.shiftType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-medium">{attendanceData.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {submitError && (
              <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
                {submitError}
              </div>
            )}
            {!isSubmitted ? ( // MAIN BUTTON: Take photo or submit time in
              <button
                onClick={capturedImage ? handleTimeIn : startCamera}
                disabled={submitting || checking || !selectedSchedule}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Camera size={18} />
                {submitting ? "Submitting..." : (capturedImage ? "Submit Time In" : "Take Attendance Photo")}
              </button>
            ) : ( // BUTTON TO NAVIGATE TO TIMEOUT PAGE
              <button
                onClick={() => navigate("/guard/guard-attendance/time-out")}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-white font-semibold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
              >
                <Clock size={18} />
                Go to Time Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default GuardAttendanceTimeIn;