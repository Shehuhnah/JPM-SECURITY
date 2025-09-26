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
} from "lucide-react";

import logo from "../assets/jpmlogo.png";

export default function GuardsLayout() {
  const [openAttendance, setOpenAttendance] = useState(false);

  const navItems = [
    { to: "/Guard/GuardDetachment", label: "Detachment / Deployment", icon: <Shield size={18} /> },
    { to: "/Guard/GuardAnnouncement", label: "Announcement", icon: <Megaphone size={18} /> },
    { to: "/Guard/GuardLogBook", label: "Log Book", icon: <BookOpen size={18} /> },
    { to: "/Guard/GuardReqCOE", label: "Request COE", icon: <FileText size={18} /> },
    { to: "/Guard/hirings", label: "Hirings", icon: <Briefcase size={18} /> },
  ];

  return (
    <div className="flex min-h-screen ">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b px-4 ">
          <Link to="/">
            <img src={logo} alt="logo" className="w-18 h-15" />
          </Link>
          <span className="font-bold text-gray-800 text-lg text-center ">
            JPM SECURITY AGENCY
          </span>
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
        <nav className="w-full flex-1 px-6 space-y-2 text-gray-700">
          {navItems.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
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
                    className="block p-2 rounded hover:bg-gray-100"
                  >
                    ⏱ Time In
                  </Link>
                </li>
                <li>
                  <Link
                    to="GuardAttendanceTimeOut"
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
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium text-red-600"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
