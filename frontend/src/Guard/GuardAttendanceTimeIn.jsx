import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Clock, Camera, User, Calendar, CheckCircle, ArrowRight, MapPin, RotateCcw } from "lucide-react";
import { guardAuth } from "../hooks/guardAuth";

function GuardAttendanceTimeIn() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  // Use guardAuth as the single source of truth for guard data
  const { guard } = guardAuth();
  const user = {
    fullName: guard?.fullName ?? "Unknown",
    guardId: guard?.guardId ?? guard?._id ?? guard?.id ?? "Unknown",
    dutyStation: guard?.dutyStation ?? "",
    position: guard?.position ?? "",
    shift: guard?.shift ?? "",
    email: guard?.email ?? "",
    phoneNumber: guard?.phoneNumber ?? "",
    address: guard?.address ?? "",
  };
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: "Location detected" // In a real app, you'd reverse geocode this
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setCurrentLocation({
            latitude: 0,
            longitude: 0,
            address: "Location unavailable"
          });
        }
      );
    }
  }, []);

  const startCamera = async () => {
    try {
      // Show overlay immediately with loading state
      setShowCamera(true);
      setCameraLoading(true);

      const constraintsPrimary = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const constraintsFallback = { video: true };

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser.');
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsPrimary);
      } catch (e1) {
        console.warn('Primary constraints failed, trying fallback:', e1);
        stream = await navigator.mediaDevices.getUserMedia(constraintsFallback);
      }

      // Bind stream and aggressively try to play
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

        // Fallback: if dimensions are 0, retry shortly and stop loading when ready
        setTimeout(() => {
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            tryPlay();
          } else {
            setCameraLoading(false);
          }
        }, 150);
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraLoading(false);
      alert('Unable to access camera. Please check permissions and that you are on HTTPS or localhost.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add overlay with time and location and guard info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 170);

    // Add text overlay
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';

    const guardName = user?.fullName || 'Unknown';
    const guardCode = user?.guardId || user?._id || user?.id || 'Unknown';
    const dutyStation = user?.dutyStation || 'Unknown';
    const position = user?.position || 'Unknown';
    const shift = user?.shift || 'Unknown';
    const siteAddress = currentLocation?.address || dutyStation || 'Unknown';
    const timeText = `Time: ${currentTime.toLocaleString()}`;
    const roleText = `Role: ${position} | Shift: ${shift} | Station: ${dutyStation}`;
    const siteText = `Site: ${siteAddress}`;
    const coordsText = currentLocation ? `Coords: ${Number(currentLocation.latitude).toFixed(5)}, ${Number(currentLocation.longitude).toFixed(5)}` : 'Coords: Unknown';
    const guardText = `Guard: ${guardName} (ID: ${guardCode})`;

    ctx.fillText(guardText, 20, 35);
    ctx.fillText(roleText, 20, 65);
    ctx.fillText(timeText, 20, 95);
    ctx.fillText(siteText, 20, 125);
    ctx.fillText(coordsText, 20, 155);

    // Convert canvas to image
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
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

  const handleTimeIn = () => {
    if (!capturedImage) {
      alert("Please take a photo before submitting.");
      return;
    }

    const timeInData = {
      id: Date.now(),
      guardName: user?.fullName || "Guard Name",
      guardId: user?.guardId || user?._id || user?.id || "Unknown",
      position: user?.position || "",
      shift: user?.shift || "",
      dutyStation: user?.dutyStation || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      date: currentTime.toLocaleDateString(),
      timeIn: currentTime.toLocaleTimeString(),
      location: currentLocation,
      siteAddress: currentLocation?.address || user?.dutyStation || "",
      photo: capturedImage,
      status: "On Duty",
      submittedAt: currentTime.toLocaleString()
    };

    // Save to localStorage
    const existingAttendance = JSON.parse(localStorage.getItem("guardAttendance")) || [];
    existingAttendance.push(timeInData);
    localStorage.setItem("guardAttendance", JSON.stringify(existingAttendance));

    setAttendanceData(timeInData);
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
        <Camera className="text-blue-400 w-7 h-7 mr-3" />
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Time In Attendance
        </h1>
      </div>

      {/* Camera Interface */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {cameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-sm font-medium px-4 py-2 bg-black/60 rounded-lg border border-white/10">
                  Initializing camera...
                </div>
              </div>
            )}
            
            {/* Camera Overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {/* Top overlay with info */}
              <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-lg p-4">
                <div className="text-white text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{user?.fullName || 'Guard Name'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{currentTime.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{currentLocation?.address || 'Getting location...'}</span>
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

      {/* Main Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6">
          {/* User Profile Section */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 mx-auto">
              <User className="text-white w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {user?.fullName?.toUpperCase() || "GUARD NAME"}
            </h2>
            <p className="text-gray-400 text-sm">ID: {user?.guardId || user?._id || user?.id || "Unknown"}</p>
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
                    Lat: {currentLocation.latitude.toFixed(4)}, 
                    Lng: {currentLocation.longitude.toFixed(4)}
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
                <img
                  src={capturedImage}
                  alt="Captured attendance photo"
                  className="w-full rounded-lg border border-gray-600"
                />
                <button
                  onClick={retakePhoto}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full"
                  title="Retake Photo"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Attendance Summary */}
          {attendanceData && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-semibold">Time In Successful!</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-200">{attendanceData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time In:</span>
                  <span className="text-gray-200">{attendanceData.timeIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-200">{attendanceData.location?.address}</span>
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
                onClick={capturedImage ? handleTimeIn : startCamera}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                {capturedImage ? "Submit Time In" : "Take Attendance Photo"}
              </button>
            ) : (
              <Link
                to="/Guard/GuardAttendanceTimeOut"
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
              >
                <ArrowRight size={18} />
                Proceed to Time Out
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default GuardAttendanceTimeIn;
