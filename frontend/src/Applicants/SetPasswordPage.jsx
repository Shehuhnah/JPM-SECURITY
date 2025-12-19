import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("idle"); 
  
  // State for specific field errors vs global network errors
  const [fieldErrors, setFieldErrors] = useState({}); 
  const [globalError, setGlobalError] = useState("");

  // Password Strength Logic
  const [strength, setStrength] = useState(0);
  useEffect(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length > 9) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    setStrength(score);
    
    // Clear password error when user types
    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
  }, [password]);

  // Clear confirm error when user types
  useEffect(() => {
     if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
  }, [confirmPassword]);

  // --- PRECISE VALIDATION FUNCTION ---
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // 1. Password Field Rules
    if (!password) {
      errors.password = "Password is required.";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password is too short (min 6 chars).";
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Missing uppercase letter (A-Z).";
      isValid = false;
    }

    // 2. Confirm Field Rules
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(""); // Clear previous network errors
    setFieldErrors({}); // Clear previous validation errors

    // Step 1: Client-Side Validation (User Error)
    if (!validateForm()) return;

    // Step 2: Server-Side Request (Network/Server Error)
    try {
      setIsLoading(true);
      
      const res = await fetch(`${API_URL}/api/auth/set-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Server rejected request.");
      }

      setStatus("success");
      toast.success("Account activated successfully!", {
        position: "top-center",
        theme: "dark",
      });
      
      setTimeout(() => navigate("/guard/login"), 3000);

    } catch (err) {
      console.error("Submission Error:", err);
      setStatus("error");
      
      // THIS IS THE FIX: Show the EXACT error message to help debug on mobile
      // If it's a fetch error, it will say "Failed to fetch"
      setGlobalError(`System Error: ${err.message}`); 
      
      toast.error(err.message, { position: "top-center", theme: "dark" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Success View ---
  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
        
        <ToastContainer />
        <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/5">
            <CheckCircle className="text-green-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Your account has been successfully activated. Redirecting...
          </p>
          <button onClick={() => navigate("/guard/login")} className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition shadow-lg shadow-green-900/20">
            Login Now
          </button>
        </div>
      </div>
    );
  }

  // --- Form View ---
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans relative">
      <ToastContainer />
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-900/30 mb-4">
             <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">JPM Security</h1>
          <p className="text-blue-200/60 text-sm mt-1">Secure Employee Portal</p>
        </div>

        <div className="bg-[#1e293b]/90 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-6 md:p-8 shadow-2xl">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
                <KeyRound className="text-blue-400" size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Activate Account</h2>
                <p className="text-xs text-gray-400">Create your new secure password</p>
            </div>
          </div>

          {/* GLOBAL NETWORK ERRORS (Top Banner) */}
          {globalError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-red-200">
                <p className="font-bold">Submission Failed:</p>
                <p className="text-xs opacity-80 break-words">{globalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* --- PASSWORD FIELD --- */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                <span className={`text-[10px] ${/[A-Z]/.test(password) ? "text-green-400" : "text-gray-500"}`}>
                   {/[A-Z]/.test(password) ? "✓ Uppercase included" : "Must have uppercase"}
                </span>
              </div>
              
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition ${fieldErrors.password ? "text-red-400" : "text-gray-500 group-focus-within:text-blue-400"}`} size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Conditional Border Color based on Error
                  className={`w-full bg-[#0f172a] border rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition text-sm md:text-base 
                    ${fieldErrors.password 
                      ? "border-red-500 focus:ring-red-500/50" 
                      : "border-gray-600 focus:ring-blue-500 focus:border-transparent"}`}
                  placeholder="Create password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* INLINE PASSWORD ERROR */}
              {fieldErrors.password && (
                 <p className="text-xs text-red-400 ml-1 animate-in slide-in-from-top-1">{fieldErrors.password}</p>
              )}
              
              {/* Strength Indicator */}
              <div className="flex gap-1 h-1 mt-2 px-1">
                 {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-full w-full rounded-full transition-all duration-300 ${i < strength ? (strength < 3 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-700'}`}></div>
                 ))}
              </div>
            </div>

            {/* --- CONFIRM FIELD --- */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative group">
                <CheckCircle className={`absolute left-4 top-1/2 -translate-y-1/2 transition ${fieldErrors.confirmPassword ? "text-red-400" : "text-gray-500 group-focus-within:text-blue-400"}`} size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-[#0f172a] border rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition text-sm md:text-base 
                    ${fieldErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-500/50" 
                      : "border-gray-600 focus:ring-blue-500 focus:border-transparent"}`}
                  placeholder="Repeat password"
                />
              </div>
              
              {/* INLINE CONFIRM ERROR */}
              {fieldErrors.confirmPassword && (
                 <p className="text-xs text-red-400 ml-1 animate-in slide-in-from-top-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl text-white font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 mt-4 text-sm md:text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Activating...
                </>
              ) : (
                "Complete Activation"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} JPM Security Agency
        </p>
      </div>
    </div>
  );
}