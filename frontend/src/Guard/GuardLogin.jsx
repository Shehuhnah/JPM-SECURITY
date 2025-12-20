import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Mail, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import bg from "../Home/assets/home-bg.jpg";
import { useAuth } from "../hooks/useAuth";

export default function LoginForm() {
    const api = import.meta.env.VITE_API_URL;
    const { user: guard, loading } = useAuth();
    const navigate = useNavigate();
    
    const [loadingPage, setLoadingPage] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        document.title = "Guard Login | JPM Security Agency";
        if (!loading && guard) {
            navigate("/guard/announcements");
        }
    }, [guard, loading, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setMessage("Please fill in all fields.");
            return;
        }

        setLoadingPage(true);
        setMessage("");

        try {
            const res = await fetch(`${api}/api/auth/login-guard`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Invalid email or password");

            setMessage("Login successful! Redirecting...");
            setTimeout(() => navigate("/guard/announcements"), 1500);

        } catch (error) {
            console.error("Login error:", error);
            setMessage(error.message);
        } finally {
            setLoadingPage(false);
        }
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
            {/* Dark Overlay with Gradient */}
            <div className="absolute inset-0 bg-slate-950/90 bg-gradient-to-tr from-slate-950/95 via-slate-900/80 to-blue-950/40 backdrop-blur-[2px]"></div>

            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 transition-all duration-300 mx-auto animate-in fade-in zoom-in-95 duration-500">
                
                {/* Header */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-4 rounded-2xl mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/10 ring-1 ring-white/10">
                        <Shield size={40} className="text-blue-400 drop-shadow-md" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-slate-400 text-sm mt-2 font-medium">JPM Security Agency • Guard Portal</p>
                </div>

                {/* Alert Message */}
                {message && (
                    <div className={`mb-6 p-3 text-sm flex items-center gap-3 rounded-xl border animate-in slide-in-from-top-2 ${
                        message.includes("successful") 
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-300 border-red-500/20"
                    }`}>
                        {message.includes("successful") 
                            ? <CheckCircle size={18} className="shrink-0" /> 
                            : <AlertCircle size={18} className="shrink-0" />
                        }
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:border-slate-600"
                                placeholder="guard@example.com"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
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

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loadingPage}
                        className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loadingPage ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

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