import { Outlet, NavLink, Link } from "react-router-dom";
import { useState } from "react";
import {
  Calendar,
  FileText,
  Shield,
  ClipboardList,
  Mail,
  User,
  ChevronDown,
  Users,
  Clock,
  LogOut,
  Building2,
  Megaphone,
  Briefcase,
} from "lucide-react";

import avatar from "../assets/gerard.jpg";
import logo from "../assets/jpmlogo.png";

export default function AdminLayout() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openCOE, setOpenCOE] = useState(false); // ✅ Added
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: "/Admin/AdminDeployment", label: "Deployment", icon: <Calendar size={18} /> },
    { to: "/Admin/AdminResume", label: "Resume", icon: <FileText size={18} /> },
    { to: "/Admin/AdminGuardUpdates", label: "Updates", icon: <Shield size={18} /> },
    { to: "/Admin/AdminMessages", label: "Messages", icon: <Mail size={18} /> },
    { to: "/Admin/UserAccounts", label: "Users", icon: <Users size={18} /> },
    { to: "/Admin/AdminGuardsProfile", label: "Guards", icon: <Users size={18} /> },
    { to: "/Admin/AdminAttendance", label: "Attendance", icon: <Clock size={18} /> },
  ];

  const postItems = [
    { to: "/Admin/AdminPosts", label: "Announcement", icon: <Megaphone size={16} /> },
    { to: "/Admin/AdminHiring", label: "Hiring", icon: <Briefcase size={16} /> },
    { to: "/Admin/CompanyDetails", label: "Company", icon: <Building2 size={16} /> },
  ];

  // ✅ COE sub-items
  const coeItems = [
    { to: "/Admin/AdminCOE", label: "Requested COE" },
    { to: "/Admin/AdminCOEApproved", label: "Approved COE" },
    { to: "/Admin/AdminCOEDeclined", label: "Declined COE" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-md flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b px-4 gap-2">
          <Link to="/">
            <img src={logo} alt="logo" className="w-12 h-12" />
          </Link>
          <span className="font-bold text-gray-800 text-lg">
            JPM SECURITY
          </span>
        </div>

        {/* User Profile */}
        <div className="flex flex-col items-center py-6 border-b">
          <img
            src={avatar}
            alt="Admin Avatar"
            className="w-16 h-16 rounded-full border mb-3"
          />
          <h3 className="font-semibold text-gray-700">No name</h3>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 text-gray-700 overflow-y-auto">
          {/* Regular links */}
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded transition-colors ${
                  isActive
                    ? "bg-gray-600 text-white font-semibold shadow"
                    : "hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* ✅ COE Dropdown */}
          <div>
            <button
              onClick={() => setOpenCOE(!openCOE)}
              className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={18} />
                <span>COE</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${openCOE ? "rotate-180" : ""}`}
              />
            </button>

            {openCOE && (
              <ul className="ml-8 mt-1 space-y-1 text-sm">
                {coeItems.map((item, idx) => (
                  <li key={idx}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-2 rounded transition-colors ${
                          isActive
                            ? "bg-gray-600 text-white font-semibold shadow"
                            : "hover:bg-gray-100"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Posts Dropdown */}
          <div>
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <User size={18} />
                <span>Posts</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${openDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {openDropdown && (
              <ul className="ml-8 mt-1 space-y-1 text-sm">
                {postItems.map((item, idx) => (
                  <li key={idx}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-2 rounded transition-colors ${
                          isActive
                            ? "bg-gray-600 text-white font-semibold shadow"
                            : "hover:bg-gray-100"
                        }`
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Logout */}
          <Link
            to="/"
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-red-600 font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto ml-64">
        <Outlet />
      </main>
    </div>
  );
}
