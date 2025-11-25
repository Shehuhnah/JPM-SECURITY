import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

import {
  Calendar,
  FileText,
  Shield,
  ShieldUser,
  Contact,
  Mail,
  User,
  ChevronDown,
  Users,
  Clock,
  LogOut,
  Megaphone,
  Briefcase,
  LayoutDashboard,
  IdCardLanyard,
  Menu,
  X,
  FileUser,
} from "lucide-react";

import avatar from "../assets/gerard.jpg";
import logo from "../assets/jpmlogo.png";
const api = import.meta.env.VITE_API_URL;

export default function AdminLayout() {
  const [messagesDropdown, setMessagesDropdown] = useState(false);
  const [postsDropdown, setPostsDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${api}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      navigate("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { to: "/Admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/Admin/deployment", label: "Deployment", icon: <Calendar size={18} /> },
    { to: "/Admin/schedule-approval", label: "Schedules Approval", icon: <Calendar size={18} /> },
    { to: "/Admin/AdminGuardUpdates", label: "Updates", icon: <Shield size={18} /> },
    { to: "/Admin/AdminMessages", label: "Messages", icon: <Mail size={18} /> },
    { to: "/Admin/UserAccounts", label: "Staff", icon: <Users size={18} /> },
    { to: "/Admin/ApplicantList", label: "Applicants", icon: <User size={18} /> },
    { to: "/Admin/AdminGuardsProfile", label: "Guards", icon: <Users size={18} /> },
    { to: "/Admin/AdminAttendance", label: "Attendance", icon: <Clock size={18} /> },
    { to: "/Admin/Request-ID", label: "Request ID", icon: <IdCardLanyard size={18} /> },
    { to: "/Admin/AdminCOE", label: "COE", icon: <FileText size={18} /> },
    { to: "request-coe", label: "Request COE", icon: <FileText size={18} /> },
  ];

  const postItems = [
    { to: "/Admin/AdminPosts", label: "Announcement", icon: <Megaphone size={16} /> },
    { to: "/Admin/AdminHiring", label: "Hiring", icon: <Briefcase size={16} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">

      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-[#1B3C53] rounded-md">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#0f172a] shadow-md flex flex-col
          transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b border-gray-800 px-4 gap-2">
          <Link to="/">
            <img src={logo} alt="logo" className="w-12 h-12" />
          </Link>
          <span className="font-bold text-white text-lg">JPM SECURITY</span>
        </div>

        {/* User */}
        <div className="flex flex-col items-center py-6 border-b border-gray-800">
          <img src={avatar} className="w-16 h-16 rounded-full border mb-3" />
          <h3 className="font-semibold text-gray-200">{user?.name}</h3>
          <span className="text-sm font-light">
            {user?.position} | {user?.role}
          </span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">

          {navItems
            .filter(item => {
              if (user?.role === "Subadmin") {
                return !["/Admin/AdminCOE", "/Admin/schedule-approval"].includes(item.to);
              }
              if (user?.role === "Admin") {
                return !["request-coe", "/Admin/deployment"].includes(item.to);
              }
              return true;
            })
            .map((item, idx) => {

              // SUBADMIN: custom MESSAGES dropdown
              if (user?.role === "Subadmin" && item.label === "Messages") {
                return (
                  <div key={idx}>
                    <button
                      onClick={() => setMessagesDropdown(!messagesDropdown)}
                      className="flex items-center justify-between w-full p-2 rounded hover:bg-[#0b2433]"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${messagesDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {messagesDropdown && (
                      <ul className="ml-8 mt-1 space-y-1 text-sm">
                        <li>
                          <NavLink
                            to="/Admin/AdminMessages"
                            className={({ isActive }) =>
                              `flex items-center gap-2 p-2 rounded ${
                                isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                              }`
                            }
                          >
                            <Contact size={16} /> Staff Message
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/Admin/subadmin-message"
                            className={({ isActive }) =>
                              `flex items-center gap-2 p-2 rounded ${
                                isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                              }`
                            }
                          >
                            <ShieldUser size={16} /> Guards Message
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/Admin/applicant-message"
                            className={({ isActive }) =>
                              `flex items-center gap-2 p-2 rounded ${
                                isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                              }`
                            }
                          >
                            <FileUser size={16} /> Applicants Message
                          </NavLink>
                        </li>
                      </ul>
                    )}
                  </div>
                );
              }

              // Regular Nav Item
              return (
                <NavLink
                  key={idx}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-2 rounded transition ${
                      isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

          {/* POSTS DROPDOWN */}
          <div>
            <button
              onClick={() => setPostsDropdown(!postsDropdown)}
              className="flex items-center justify-between w-full p-2 rounded hover:bg-[#0b2433]"
            >
              <div className="flex items-center gap-3">
                <User size={18} />
                <span>Posts</span>
              </div>

              <ChevronDown
                size={16}
                className={`transition-transform ${postsDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {postsDropdown && (
              <ul className="ml-8 mt-1 space-y-1 text-sm">
                {postItems.map((item, idx) => (
                  <li key={idx}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-2 rounded ${
                          isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
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
            onClick={handleLogout}
            className="flex items-center gap-3 p-2 rounded hover:bg-[#0b2433] text-red-400 mt-4 w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
