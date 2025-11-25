import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import logo from "../assets/jpmlogo.png";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth.js"
const api = import.meta.env.VITE_API_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingPage, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user: admin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { 
    document.title = "Admin Login | JPM Security Agency";
    if(!admin && !loading){
      navigate("/admin/login")
    };
  }, [admin , loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const res = await fetch(`${api}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials");
      console.log(data)
      navigate("/admin/deployment");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
        <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md p-8 text-gray-100">
          {/* Logo + Header */}
          <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="JPM Security Logo" className="w-20 h-20 mb-3" />
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">
              Secure access to JPM Security Agency Dashboard
          </p>
          <div className="w-24 h-1 bg-blue-500 mt-3 rounded-full"></div>
          </div>

          {/* Error Message */}
          {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-400 text-sm rounded-md px-4 py-2 mb-4">
              {error}
          </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
          <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jpm.com"
                  required
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}  // 👈 dynamic type here
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>


          <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2.5 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5 disabled:opacity-60"
          >
              {loading ? "Signing in..." : "Sign In"}
          </button>
          </form>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 mt-6">
          © {new Date().getFullYear()} JPM Security Agency — Admin Portal
          </p>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
