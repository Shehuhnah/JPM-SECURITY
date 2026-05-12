import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Fragment, useState, useEffect } from "react";
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
  CalendarDays,
  LogOut,
  Megaphone,
  Briefcase,
  LayoutDashboard,
  IdCardLanyard,
  Menu,
  X,
  FileUser,
  Building,
  ClipboardList,
  CircleUser,
  ImagePlus,
  FilePenLine,
  Settings
} from "lucide-react";

import logo from "../assets/jpmlogo.png";
const api = import.meta.env.VITE_API_URL;

export default function AdminLayout() {
  const [messagesDropdown, setMessagesDropdown] = useState(false);
  const [postsDropdown, setPostsDropdown] = useState(false);
  const [requestsDropdown, setRequestsDropdown] = useState(false); // New State
  const [userManagementDropdown, setUserManagementDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, loading, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
      return;
    }

    if (!loading && user?.role === "Guard") {
      navigate("/guard/announcements");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${api}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      clearAuth();
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Main Navigation Items (Removed Request ID/COE to put in dropdown)
  const navItems = [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/admin/staff-attendance", label: "My Attendance", icon: <Clock size={18} /> },
    { to: "/admin/log-reports", label: "My Log Reports", icon: <FilePenLine size={18} /> },
    { to: "/admin/profile", label: "My Profile", icon: <Settings size={18} /> },
    { to: "/admin/deployment", label: "Deployment", icon: <Calendar size={18} /> },
    { to: "/admin/schedule-approval", label: "Schedules Approval", icon: <Calendar size={18} /> },
    { to: "/admin/AdminMessages", label: "Messages", icon: <Mail size={18} /> },
    { to: "/admin/manage-clients", label: "Clients", icon: <Building size={18} /> },
    { to: "/admin/leaves", label: "Leaves", icon: <CalendarDays size={18} /> },
    { to: "/admin/AdminGuardUpdates", label: "Updates", icon: <Shield size={18} /> },
    { to: "/admin/gallery-manager", label: "Gallery", icon: <ImagePlus size={18} /> },
    { to: "/admin/AdminAttendance", label: "Guards Attendance", icon: <Clock size={18} /> },
    { to: "/admin/Request-ID", label: "Manage Request ID", icon: <IdCardLanyard size={18} /> },
    { to: "/admin/AdminCOE", label: "Manage COE", icon: <FileText size={18} /> },
  ];

  // New Dropdown Items
  const requestItems = [
    { to: "admin-request-id", label: "ID Request", icon: <IdCardLanyard size={16}/> },
    { to: "request-coe", label: "COE Request", icon: <FileText size={16} /> },
  ];

  const postItems = [
    { to: "/admin/AdminPosts", label: "Announcement", icon: <Megaphone size={16} /> },
    { to: "/admin/AdminHiring", label: "Hiring", icon: <Briefcase size={16} /> },
  ];

  const userManagementItems = [
    { to: "/admin/UserAccounts", label: "Staff", icon: <Users size={16} /> },
    { to: "/admin/ApplicantList", label: "Applicants", icon: <User size={16} /> },
    { to: "/admin/AdminGuardsProfile", label: "Guards", icon: <Users size={16} /> },
  ];

  const userManagementAnchorLabel =
    user?.role === "Subadmin" ? "Deployment" : "Schedules Approval";

  const renderUserManagementDropdown = () => (
    <div>
      <button
        onClick={() => setUserManagementDropdown(!userManagementDropdown)}
        className="flex items-center justify-between w-full p-2 rounded hover:bg-[#0b2433]"
      >
        <div className="flex items-center gap-3">
          <CircleUser size={18} />
          <span>User Management</span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform ${userManagementDropdown ? "rotate-180" : ""}`}
        />
      </button>

      {userManagementDropdown && (
        <ul className="ml-8 mt-1 space-y-1 text-sm">
          {userManagementItems.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded ${
                    isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-gray-100">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between bg-[#0f172a] p-4 border-b border-gray-800 sticky top-0 z-20">
        <Link to="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <img src={logo} alt="logo" className="w-8 h-8" />
          <span className="font-bold text-white text-lg">JPM SECURITY</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-[100dvh] w-64 bg-[#0f172a] shadow-md flex flex-col
          transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b border-gray-800 px-4 gap-2 md:flex">
          <Link to="/">
            <img src={logo} alt="logo" className="w-12 h-12" />
          </Link>
          <span className="font-bold text-white text-lg">JPM SECURITY</span>
        </div>

        {/* User */}
        <div className="flex flex-col items-center py-6 border-b border-gray-800">
          <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-[#142235]">
            {user?.photo ? (
              <img src={user.photo} alt={user?.name || "Admin"} className="h-full w-full object-cover" />
            ) : (
              <ShieldUser className="h-10 w-10 text-[#A76CE1]" strokeWidth={1.5} />
            )}
          </div>
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
                return !["/admin/AdminCOE", "/admin/schedule-approval"].includes(item.to);
              }
              return true;
            })
            .map((item, idx) => {

              // Admin and Subadmin can both access all messaging views.
              if ((user?.role === "Subadmin" || user?.role === "Admin") && item.label === "Messages") {
                return (
                  <Fragment key={idx}>
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
                            to="/admin/AdminMessages"
                            className={({ isActive }) =>
                              `flex items-center gap-2 p-2 rounded ${
                                isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                              }`
                            }
                            onClick={() => setSidebarOpen(false)}
                          >
                            <Contact size={16} /> Staff Message
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/admin/subadmin-message"
                            className={({ isActive }) =>
                              `flex items-center gap-2 p-2 rounded ${
                                isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                              }`
                            }
                            onClick={() => setSidebarOpen(false)}
                          >
                            <ShieldUser size={16} /> Guards Message
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/admin/applicant-message"
                            className={({ isActive }) =>
                              `flex items-center gap-2 p-2 rounded ${
                                isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                              }`
                            }
                            onClick={() => setSidebarOpen(false)}
                          >
                            <FileUser size={16} /> Applicants Message
                          </NavLink>
                        </li>
                      </ul>
                    )}
                    {item.label === userManagementAnchorLabel && renderUserManagementDropdown()}
                  </Fragment>
                );
              }

              // Regular Nav Item
              return (
                <Fragment key={idx}>
                  <NavLink
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

                  {item.label === userManagementAnchorLabel && renderUserManagementDropdown()}
                </Fragment>
              );
            })}

          {/* NEW: REQUESTS DROPDOWN */}
          {/* Admin is the unrestricted role, so keep request links visible there too. */}
          {(user?.role === "Subadmin" || user?.role === "Admin") && ( 
            <div>
              <button
                onClick={() => setRequestsDropdown(!requestsDropdown)}
                className="flex items-center justify-between w-full p-2 rounded hover:bg-[#0b2433]"
              >
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} />
                  <span>Requests</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${requestsDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {requestsDropdown && (
                <ul className="ml-8 mt-1 space-y-1 text-sm">
                  {requestItems.map((item, idx) => (
                    <li key={idx}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center gap-2 p-2 rounded ${
                            isActive ? "bg-[#142235] text-white" : "hover:bg-[#0b2433]"
                          }`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        {item.icon}
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* POSTS DROPDOWN */}
          <div>
            <button
              onClick={() => setPostsDropdown(!postsDropdown)}
              className="flex items-center justify-between w-full p-2 rounded hover:bg-[#0b2433]"
            >
              <div className="flex items-center gap-3">
                <User size={18} />
                <span>Manage Posts</span>
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
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-2 rounded hover:bg-[#0b2433] text-red-400 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-40 z-30 md:hidden lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-5 md:pt-0 overflow-y-auto md:ml-64">
        <div key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
