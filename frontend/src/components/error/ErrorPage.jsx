import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Shield, User, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ErrorPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("public");

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("/admin")) setRole("admin");
    else if (path.includes("/guard")) setRole("guard");
    else if (path.includes("/subadmin")) setRole("subadmin");
    else if (path.includes("/job-application-process")) setRole("applicant");
    else setRole("public");
  }, []);

  const config = {
    admin: {
      title: "Admin Page Not Found",
      message: "The page you're looking for doesn't exist or has been moved.",
      color: "from-gray-800 to-gray-900",
      icon: ShieldAlert,
      button: {
        label: "Go to Admin Dashboard",
        action: () => navigate("/admin"),
        bg: "bg-gray-700 hover:bg-gray-600",
      },
      bgImage:
        "url('https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=1920&q=80')",
    },
    guard: {
      title: "Guard Page Not Found",
      message: "You may have entered the wrong route. Please return to your panel.",
      color: "from-blue-800 to-blue-900",
      icon: Shield,
      button: {
        label: "Back to Guard Dashboard",
        action: () => navigate("/guard/announcements"),
        bg: "bg-blue-600 hover:bg-blue-500",
      },
      bgImage:
        "url('https://images.unsplash.com/photo-1596040033229-5b15f4d2171c?auto=format&fit=crop&w=1920&q=80')",
    },
    subadmin: {
      title: "Sub-Admin Page Not Found",
      message: "This page doesn’t exist or you may not have permission to access it.",
      color: "from-emerald-800 to-emerald-900",
      icon: Users,
      button: {
        label: "Back to SubAdmin Dashboard",
        action: () => navigate("/subadmin/announcements"),
        bg: "bg-emerald-600 hover:bg-emerald-500",
      },
      bgImage:
        "url('https://images.unsplash.com/photo-1537498425277-c283d32ef9db?auto=format&fit=crop&w=1920&q=80')",
    },
    applicant: {
      title: "Applicant Page Not Found",
      message: "We couldn't find what you were looking for. Try checking our hiring page.",
      color: "from-teal-700 to-teal-900",
      icon: User,
      button: {
        label: "Go to Hiring Page",
        action: () => navigate("/job-application-process/applicants"),
        bg: "bg-teal-600 hover:bg-teal-500",
      },
      bgImage:
        "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80')",
    },
    public: {
      title: "404 — Page Not Found",
      message: "This page doesn’t exist or was moved. You can always return home.",
      color: "from-indigo-800 to-indigo-900",
      icon: AlertTriangle,
      button: {
        label: "Back to Home",
        action: () => navigate("/"),
        bg: "bg-indigo-600 hover:bg-indigo-500",
      },
      bgImage:
        "url('https://images.unsplash.com/photo-1517511620798-cec17d428bc0?auto=format&fit=crop&w=1920&q=80')",
    },
  };

  const { title, message, color, icon: Icon, button, bgImage } =
    config[role] || config.public;

  return (
    <section
      className={`relative min-h-screen flex flex-col items-center justify-center text-white text-center overflow-hidden`}
      style={{
        backgroundImage: `${bgImage}`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} bg-opacity-90 backdrop-blur-sm`}
      ></div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 px-6 max-w-lg"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white/10 p-4 rounded-full border border-white/20 mb-3">
            <Icon size={60} className="text-white drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2 drop-shadow-sm">
            {title}
          </h1>
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        <button
          onClick={button.action}
          className={`${button.bg} mt-6 px-6 py-3 rounded-lg font-semibold transition shadow-lg`}
        >
          {button.label}
        </button>
      </motion.div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-gray-400 text-xs z-10">
        © {new Date().getFullYear()} JPM Security Agency. All rights reserved.
      </footer>
    </section>
  );
}
