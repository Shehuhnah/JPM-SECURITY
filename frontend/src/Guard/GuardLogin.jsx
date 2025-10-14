import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");

  // useEffect(() => {
  //   if (message) {
  //     const timer = setTimeout(() => setMessage(""), 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [message]);

  // const handleChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   // For now just simulate login
  //   if (formData.email && formData.password) {
  //     setMessage(`✅ Welcome, ${formData.email}`);
  //   } else {
  //     setMessage("❌ Please fill in all fields.");
  //   }
  // };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0f172a] px-4">
      <form
        // onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl px-8 pt-6 pb-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login
        </h2>

        {message && (
          <div className="mb-4 p-2 text-sm text-white bg-blue-500 rounded-md text-center">
            {/* {message} */}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            // value={formData.email}
            // onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            // value={formData.password}
            // onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        {/* Remember Me */}
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            // checked={rememberMe}
            // onChange={(e) => setRememberMe(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Remember Me</span>
        </div>

        {/* Button */}
        <Link to="/Guard/GuardAnnouncement"
          className="w-full bg-[#1B3C53] text-white py-2 px-43 rounded-md hover:bg-[#456882] transition"
        >
          Login
        </Link>
      </form>
    </div>
  );
}
