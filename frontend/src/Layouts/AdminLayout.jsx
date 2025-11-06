import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  Calendar,
  FileText,
  Shield,
  Mail,
  User,
  ChevronDown,
  Users,
  Clock,
  LogOut,
  Megaphone,
  Briefcase,
  LayoutDashboard, 
  IdCardLanyard 
} from "lucide-react";

import avatar from "../assets/gerard.jpg";
import logo from "../assets/jpmlogo.png";

export default function AdminLayout() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openCOE, setOpenCOE] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { admin, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin || !token) {
      navigate("/admin/Login");
    }
  }, [admin, token, navigate]);

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/Login");
  }

  const navItems = [
    { to:"/Admin", label: "Dashboard", icon: <LayoutDashboard size={18}/>},
    { to: "/Admin/deployment", label: "Deployment", icon: <Calendar size={18} /> },
    { to: "/Admin/schedule-approval", label: "Schedules Approval", icon: <Calendar size={18} /> },
    { to: "/Admin/AdminGuardUpdates", label: "Updates", icon: <Shield size={18} /> },
    { to: "/Admin/AdminMessages", label: "Messages", icon: <Mail size={18} /> },
    { to: "/Admin/UserAccounts", label: "Staff", icon: <Users size={18} /> },
    { to: "/Admin/ApplicantList", label: "Applicants", icon: <User size={18} /> },
    { to: "/Admin/AdminGuardsProfile", label: "Guards", icon: <Users size={18} /> },
    { to: "/Admin/AdminAttendance", label: "Attendance", icon: <Clock size={18} /> },
    { to: "/Admin/Request-ID", label: "Request ID", icon: <IdCardLanyard size={18}/>},
    { to: "/Admin/AdminCOE", label: "COE ", icon: <FileText size={18} /> },
    { to: "request-coe", label: "Request COE", icon: <FileText size={18} /> },
  ];

  const postItems = [
    { to: "/Admin/AdminPosts", label: "Announcement", icon: <Megaphone size={16} /> },
    { to: "/Admin/AdminHiring", label: "Hiring", icon: <Briefcase size={16} /> },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#0f172a] text-gray-100 shadow-md flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b border-gray-800 px-4 gap-2">
          <Link to="/">
            <img src={logo} alt="logo" className="w-12 h-12" />
          </Link>
          <span className="font-bold text-white text-lg">
            JPM SECURITY
          </span>
        </div>

        {/* User Profile */}
        <div className="flex flex-col items-center py-6 border-b border-gray-800">
          <img
            src={avatar}
            alt="Admin Avatar"
            className="w-16 h-16 rounded-full border mb-3"
          />
          <div className="text-center">
            <h3 className="font-semibold text-gray-200">{admin.name}</h3>
            <span className="text-sm font-light">{admin.position} | {admin.role}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 text-gray-200 overflow-y-auto">
          {/* Regular links */}
          {navItems
            .filter(item => {
              if (admin.role === "Subadmin") {
                return ![
                  "/Admin/AdminCOE",
                  "/Admin/view-list-schedule"
                ].includes(item.to);
              }
              if (admin.role === "Admin") {
                return ![
                  "request-coe",
                  "/Admin/deployment",
                ].includes(item.to);
              }
              return true; // Admin sees all
            }).map((item, idx) => (
              <NavLink
                key={idx}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded transition-colors ${
                    isActive
                      ? "bg-[#142235] text-white font-semibold shadow"
                      : "hover:bg-[#0b2433]"
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))
          }
          {/* Posts Dropdown */}
          <div>
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center justify-between w-full p-2 rounded hover:bg-[#0b2433]"
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
                            ? "bg-[#142235] text-white font-semibold shadow"
                            : "hover:bg-[#0b2433]"
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
          <button
            onClick={() => handleLogout()}
            className="flex items-center gap-3 p-2 rounded hover:bg-[#0b2433] text-red-400 font-medium mt-4"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto ml-64">
        <Outlet />
      </main>
    </div>
  );
}
