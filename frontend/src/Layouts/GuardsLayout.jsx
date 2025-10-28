import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  Megaphone,
  BookOpen,
  FileText,
  Briefcase,
  Clock,
  LogOut,
  Menu,
  X,
  UserRoundPen,
  ChevronDown,
  ChevronRight,
  Home,
  Camera
} from "lucide-react";

import { guardAuth } from "../hooks/guardAuth";

import logo from "../assets/jpmlogo.png"; 


export default function GuardsLayout() {
  const [openAttendance, setOpenAttendance] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { guard, token } = guardAuth();
  const navigate = useNavigate();
  const location = useLocation();
 
  function handleLogout() {
    localStorage.removeItem("guardToken");
    localStorage.removeItem("guardData");
    navigate("/Guard/Login");
  }

  const navItems = [
    { to: "/guard/detachment", label: "Detachment / Deployment", icon: <Shield size={18} /> },
    { to: "/guard/announcements", label: "Announcement", icon: <Megaphone size={18} /> },
    { to: "/guard/logbook", label: "Log Book", icon: <BookOpen size={18} /> },
    { to: "/guard/request-coe", label: "Request COE", icon: <FileText size={18} /> },
    { to: "/guard/manage-profile", label: "Guard Profile", icon: <UserRoundPen size={18}/>}
  ];

  const attendanceItems = [
    { to: "/guard/guard-attendance/time-in", label: "Time In", icon: <Camera size={16} /> },
    { to: "/guard/guard-attendance/time-out", label: "Time Out", icon: <Clock size={16} /> }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="flex min-h-screen bg-[#0f172a]">
        {/* ===== Sidebar ===== */}
        <aside
          className={`fixed top-0 left-0 h-screen w-72 bg-[#1e293b] border-r border-gray-700 flex flex-col transition-transform duration-300 z-50
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
            lg:translate-x-0`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between py-6 border-b border-gray-700 px-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="logo" className="w-10 h-10" />
              <div className="hidden sm:block">
                <span className="font-bold text-white text-lg">JPM SECURITY</span>
                <p className="text-xs text-gray-400">Guard Portal</p>
              </div>
            </Link>

            {/* Close button (mobile only) */}
            <button className="lg:hidden text-gray-400 hover:text-white transition" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Profile */}
          <div className="flex flex-col items-center py-6 px-6 border-b border-gray-700">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
              <UserRoundPen className="text-white w-8 h-8" />
            </div>
            <h3 className="font-semibold text-white text-lg">{guard?.fullName || "Guard Name"}</h3>
            <p className="text-sm text-gray-400">{guard?.position || "Security Guard"}</p>
            <div className="mt-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
              <span className="text-green-400 text-xs font-medium">Online</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 text-gray-300 overflow-y-auto">
            {/* Attendance Dropdown */}
            <div>
              <button
                onClick={() => setOpenAttendance(!openAttendance)}
                className={`flex items-center justify-between w-full p-3 rounded-lg font-medium transition-all ${
                  isActive("/guard/guard-attendance") 
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                    : "hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} />
                  <span>Attendance</span>
                </div>
                {openAttendance ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {openAttendance && (
                <div className="ml-6 mt-2 space-y-1">
                  {attendanceItems.map(({ to, label, icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-all ${
                        isActive(to)
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "hover:bg-gray-700/50 hover:text-white"
                      }`}
                    >
                      {icon}
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other Navigation Items */}
            {navItems.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-all ${
                  isActive(to) 
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                    : "hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}

            {/* Logout */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => handleLogout()}
                className="flex items-center gap-3 p-3 rounded-lg font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all w-full"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          ></div>
        )}

        {/* ===== Main Content ===== */}
        <main className="flex-1 flex flex-col lg:ml-72">
          {/* Topbar (mobile only) */}
          <div className="lg:hidden flex items-center justify-between bg-[#1e293b] border-b border-gray-700 shadow-lg px-4 py-4 sticky top-0 z-30">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white transition">
              <Menu size={28} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="logo" className="w-8 h-8" />
              <span className="font-bold text-white">JPM SECURITY</span>
            </div>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-[#0f172a]">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
