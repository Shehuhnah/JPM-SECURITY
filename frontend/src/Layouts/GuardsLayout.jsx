import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
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
} from "lucide-react";

import logo from "../assets/jpmlogo.png";

export default function GuardsLayout() {
  const [openAttendance, setOpenAttendance] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: "/Guard/detachment", label: "Detachment / Deployment", icon: <Shield size={18} /> },
    { to: "/Guard/announcements", label: "Announcement", icon: <Megaphone size={18} /> },
    { to: "/Guard/logbook", label: "Log Book", icon: <BookOpen size={18} /> },
    { to: "/Guard/GuardReqCOE", label: "Request COE", icon: <FileText size={18} /> },
    { to: "/Guard/request-coe", label: "Hirings", icon: <Briefcase size={18} /> },
  ];

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        {/* ===== Sidebar ===== */}
        <aside
          className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-md flex flex-col transition-transform duration-300 z-50
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
            md:translate-x-0 md:static`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between py-6 border-b px-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="logo" className="w-12 h-12" />
              <span className="font-bold text-gray-800 text-lg hidden sm:block xs:block">
                JPM SECURITY AGENCY
              </span>
            </Link>

            {/* Close button (mobile only) */}
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Profile */}
          <div className="flex flex-col items-center mt-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl">
              👤
            </div>
            <h3 className="font-medium text-gray-700 mt-2">Guard Name</h3>
            <p className="text-xs text-gray-500">Security Guard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 text-gray-700 overflow-y-auto">
            {navItems.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium"
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}

            {/* Attendance Dropdown */}
            <div>
              <button
                onClick={() => setOpenAttendance(!openAttendance)}
                className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-gray-100 font-medium"
              >
                <Clock size={18} />
                <span>Attendance</span>
              </button>

              {openAttendance && (
                <ul className="ml-6 mt-1 space-y-1 text-sm">
                  <li>
                    <Link
                      to="GuardAttendanceTimeIn"
                      onClick={() => setSidebarOpen(false)}
                      className="block p-2 rounded hover:bg-gray-100"
                    >
                      ⏱ Time In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="GuardAttendanceTimeOut"
                      onClick={() => setSidebarOpen(false)}
                      className="block p-2 rounded hover:bg-gray-100"
                    >
                      ⏱ Time Out
                    </Link>
                  </li>
                </ul>
              )}
            </div>

            {/* Logout */}
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium text-red-600"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </Link>
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          ></div>
        )}

        {/* ===== Main Content ===== */}
        <main className="flex-1 ">
          {/* Topbar (mobile only) */}
          <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
              <Menu size={28} />
            </button>
            <span className="font-bold">JPM SECURITY</span>
          </div>

          <div className="">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
