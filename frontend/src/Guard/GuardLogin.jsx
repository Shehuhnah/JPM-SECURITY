import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import bg from "../home/assets/home-bg.jpg";

export default function LoginForm() {

  const navigate = useNavigate()

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false) 

  useEffect

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setMessage("❌ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login-guard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      if (data.token) {
        localStorage.setItem("guardToken", data.token);
        localStorage.setItem("guardData", data.guard)
      }

      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/Guard/announcements"), 1500);
    } catch (error) {
      console.error("Login error:", error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/90 via-[#1B3C53]/80 to-[#020617]/90 backdrop-blur-sm"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#1e293b]/90 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-gray-100 transition-all duration-300 mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="bg-blue-600/20 p-3 sm:p-4 rounded-full mb-3">
            <Shield size={36} className="text-blue-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Guard Login</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Secure access for authorized guards only
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-2 text-xs sm:text-sm text-center rounded-md ${
              message.includes("✅")
                ? "bg-green-500/20 text-green-400 border border-green-500"
                : "bg-red-500/20 text-red-400 border border-red-500"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#0f172a] border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
              placeholder="example@mail.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#0f172a] border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
              placeholder="••••••••"
            />
          </div>

          {/* Remember Me */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-400">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 accent-blue-500"
              />
              Remember Me
            </label>
            <Link
              to="/forgot-password"
              className="text-blue-400 hover:underline hover:text-blue-300 transition"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2 sm:py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-blue-500/20 text-sm sm:text-base"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6 border-t border-gray-700 pt-4">
          © {new Date().getFullYear()} JPM Security Agency. All rights reserved.
        </p>
      </div>
    </section>
  );
}
