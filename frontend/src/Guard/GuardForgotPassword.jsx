import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, Loader2, ArrowRight, CheckCircle, AlertCircle, KeyRound, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import bg from "../Home/assets/home-bg.jpg";

export default function GuardForgotPassword() {
    const api = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    
    // Step 1: Email, Step 2: OTP, Step 3: New Password
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [resetToken, setResetToken] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        // Clear success messages after a while, keep errors
        if (type === "success") {
            setTimeout(() => setMessage({ type: "", text: "" }), 5000);
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${api}/api/auth/forgot-password-guard`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to send OTP");

            showMessage("success", "OTP sent to your email!");
            setStep(2);
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${api}/api/auth/verify-otp-guard`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, otp: formData.otp }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Invalid OTP");

            setResetToken(data.resetToken);
            showMessage("success", "OTP Verified!");
            setStep(3);
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            showMessage("error", "Passwords do not match");
            return;
        }

        if (formData.newPassword.length < 6) {
            showMessage("error", "Password must be at least 6 characters");
            return;
        }

        if (!/[A-Z]/.test(formData.newPassword)) {
            showMessage("error", "Password must contain at least one uppercase letter");
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${api}/api/auth/set-password/${resetToken}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: formData.newPassword }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to reset password");

            showMessage("success", "Password reset successful! Redirecting...");
            setTimeout(() => navigate("/guard/login"), 2000);
        } catch (error) {
            showMessage("error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    return (
        <section
            className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4 sm:px-6 lg:px-8 font-sans"
            style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-slate-950/90 bg-gradient-to-tr from-slate-950/95 via-slate-900/80 to-blue-950/40 backdrop-blur-[2px]"></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 transition-all duration-300 mx-auto overflow-hidden">
                
                {/* Back Button */}
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : navigate("/guard/login")}
                    className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center mb-6 text-center mt-4">
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-3 rounded-2xl mb-3 border border-blue-500/20 shadow-lg shadow-blue-500/10 ring-1 ring-white/10">
                        <KeyRound size={32} className="text-blue-400 drop-shadow-md" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Recover Account</h2>
                    <p className="text-slate-400 text-xs mt-1 font-medium">Follow the steps to reset your password</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div 
                            key={s} 
                            className={`h-1 rounded-full transition-all duration-300 ${
                                s === step ? "w-8 bg-blue-500" : 
                                s < step ? "w-2 bg-emerald-500" : "w-2 bg-slate-700"
                            }`}
                        />
                    ))}
                </div>

                {/* Alert Message */}
                {message.text && (
                    <div className={`mb-6 p-3 text-sm flex items-center gap-3 rounded-xl border animate-in slide-in-from-top-2 ${
                        message.type === "success"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-300 border-red-500/20"
                    }`}>
                        {message.type === "success" 
                            ? <CheckCircle size={18} className="shrink-0" /> 
                            : <AlertCircle size={18} className="shrink-0" />
                        }
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <div className="relative min-h-[250px]">
                    <AnimatePresence mode="wait" custom={step}>
                        {step === 1 && (
                            <motion.form 
                                key="step1"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                onSubmit={handleSendOTP}
                                className="space-y-5 absolute inset-0"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:border-slate-600"
                                            placeholder="guard@example.com"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 ml-1">We'll send a one-time password to this email.</p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Send OTP <ArrowRight size={18} /></>}
                                </button>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form 
                                key="step2"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                onSubmit={handleVerifyOTP}
                                className="space-y-5 absolute inset-0"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Enter OTP</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Shield size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="otp"
                                            required
                                            value={formData.otp}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:border-slate-600 tracking-[0.5em] font-mono text-center text-lg"
                                            placeholder="------"
                                            maxLength={6}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 ml-1">Check your email for the 6-digit code.</p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Verify Code <ArrowRight size={18} /></>}
                                </button>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.form 
                                key="step3"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                onSubmit={handleResetPassword}
                                className="space-y-5 absolute inset-0"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="newPassword"
                                            required
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-11 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:border-slate-600"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-11 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:border-slate-600"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                                        >
                                            {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Reset Password <CheckCircle size={18} /></>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} JPM Security Agency. All rights reserved.
                    </p>
                </div>
            </div>
        </section>
    );
}