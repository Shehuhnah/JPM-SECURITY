import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";



function LoginForm({ onSwitch }) {
const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Auto login if "rememberMe" was checked before
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      setMessage(`✅ Welcome back, ${JSON.parse(loggedInUser).fullName}!`);
    }
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem("userData"));
    if (!savedUser) {
      setMessage("❌ No user found. Please register first.");
      return;
    }

    const isPasswordMatch = await bcrypt.compare(
      formData.password,
      savedUser.password
    );

    if (savedUser.email === formData.email && isPasswordMatch) {
      setMessage(`✅ Welcome back, ${savedUser.fullName}!`);

      if (rememberMe) {
        localStorage.setItem("loggedInUser", JSON.stringify(savedUser));
      } else {
        sessionStorage.setItem("loggedInUser", JSON.stringify(savedUser));
      }
    } else {
      setMessage("❌ Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100"
    style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundColor: "#111",
    backgroundSize: "40px 40px",
  }}>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl px-8 pt-6 pb-8 w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {message && (
          <div className="mb-4 p-2 text-sm text-white bg-blue-500 rounded-md text-center">
            {message}
          </div>
        )}

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded-md focus:ring-2 focus:ring-blue-400"
        />

        <label className="block mb-2 text-sm font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded-md focus:ring-2 focus:ring-blue-400"
        />

        {/* Remember Me checkbox */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">Remember Me</span>
        </div>

        <button
          type="submit"
          className="w-full bg-green-900 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
        >
          Log In
        </button>

        


      </form>
    </div>
  );
}

export default LoginForm;
