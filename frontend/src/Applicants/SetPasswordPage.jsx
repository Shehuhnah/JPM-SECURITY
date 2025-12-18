import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast"; // Assuming you use react-hot-toast, or use your own toast function

// Change this to your actual API base URL import
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SetPassword() {
  const { token } = useParams(); // Get the secure token from the URL
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // --- Validation ---
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      // Call your backend API
      const res = await fetch(`${API_URL}/api/auth/set-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to set password.");
      }

      // Success!
      setStatus("success");
      toast.success("Password set successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/guard/login");
      }, 3000);

    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Invalid or expired link.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Success View ---
  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] border border-green-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Set!</h2>
          <p className="text-gray-400 mb-6">
            Your account has been activated and your password is secure. You are being redirected to the login page...
          </p>
          <button 
            onClick={() => navigate("/guard/login")}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition shadow-lg shadow-green-900/20"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  // --- Form View ---
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/40">
           <ShieldCheck className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">JPM Security Agency</h1>
        <p className="text-gray-500 text-sm">Employee Portal Activation</p>
      </div>

      <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

        <h2 className="text-xl font-bold text-white mb-6">Set Your Password</h2>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-200">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* New Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
            <div className="relative group">
              <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-600 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-xl text-white font-semibold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting Password...
              </>
            ) : (
              "Activate Account"
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-gray-500 text-xs">
        © {new Date().getFullYear()} JPM Security Agency. Secure Portal.
      </p>
    </div>
  );
}