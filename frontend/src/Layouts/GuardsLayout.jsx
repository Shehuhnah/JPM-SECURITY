import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  CalendarDays,
  Megaphone,
  BookOpen,
  FileText,
  Clock,
  LogOut,
  Menu,
  X,
  UserRoundPen,
  ChevronDown,
  ChevronRight,
  Camera,
  IdCardLanyard,
  AlertTriangle,
  AlertCircle,
  Info,
  Hourglass,
  Bell,
  MessageCircle
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";
import logo from "../assets/jpmlogo.png";
const api = import.meta.env.VITE_API_URL;

export default function GuardsLayout() {
  const { user: guard, loading, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openAttendance, setOpenAttendance] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDuty, setActiveDuty] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const checkActiveDuty = async () => {
    if (!guard?._id) return;
    try {
      const res = await fetch(`${api}/api/attendance/${guard._id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const active = Array.isArray(data)
          ? data.find((record) => record.status === "On Duty" && !record.timeOut)
          : null;
        setActiveDuty(active);
      }
    } catch (err) {
      console.error("Error checking active duty status:", err);
    }
  };

  useEffect(() => {
    if (guard?._id) {
      checkActiveDuty();
      const interval = setInterval(checkActiveDuty, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [guard?._id]);

  useEffect(() => {
    if (!activeDuty || !activeDuty.timeIn || location.pathname === "/guard/guard-attendance/time-out") {
      setActiveModal(null);
      return;
    }

    const checkModalTriggers = () => {
      const start = new Date(activeDuty.timeIn);
      const now = new Date();
      let diffMs = now - start;
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
      }
      const elapsedHours = diffMs / (1000 * 60 * 60);
      const recordId = activeDuty._id;

      // 1. 24 Hours Trigger (Maximum Limit)
      if (elapsedHours >= 24) {
        if (!localStorage.getItem(`guard_notified_24h_${recordId}`)) {
          setActiveModal("24h");
          return;
        }
      }

      // 2. 18 Hours Trigger (OT Warning)
      if (elapsedHours >= 18) {
        if (localStorage.getItem(`guard_overtime_choice_${recordId}`) === "yes") {
          if (!localStorage.getItem(`guard_notified_18h_${recordId}`)) {
            setActiveModal("18h");
            return;
          }
        }
      }

      // 3. 12 Hours Trigger (Shift Complete)
      if (elapsedHours >= 12) {
        if (!localStorage.getItem(`guard_overtime_choice_${recordId}`)) {
          setActiveModal("12h");
          return;
        }
      }

      // 4. 6 Hours Trigger (Informative mid-shift warning)
      if (elapsedHours >= 6 && elapsedHours < 12) {
        if (!localStorage.getItem(`guard_notified_6h_${recordId}`)) {
          setActiveModal("6h");
          return;
        }
      }
    };

    checkModalTriggers();
    const interval = setInterval(checkModalTriggers, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [activeDuty, location.pathname]);

  const handleModal6hDismiss = () => {
    if (activeDuty) {
      localStorage.setItem(`guard_notified_6h_${activeDuty._id}`, "true");
    }
    setActiveModal(null);
  };

  const handleModalTimeOut = () => {
    setActiveModal(null);
    setSidebarOpen(false);
    navigate("/guard/guard-attendance/time-out");
  };

  const handleModalOvertime = () => {
    if (activeDuty) {
      localStorage.setItem(`guard_overtime_choice_${activeDuty._id}`, "yes");
    }
    setActiveModal(null);
  };

  const handleModal18hDismiss = () => {
    if (activeDuty) {
      localStorage.setItem(`guard_notified_18h_${activeDuty._id}`, "true");
    }
    setActiveModal(null);
  };

  const handleModal24hDismiss = () => {
    if (activeDuty) {
      localStorage.setItem(`guard_notified_24h_${activeDuty._id}`, "true");
    }
    setActiveModal(null);
    navigate("/guard/guard-attendance/time-out");
  };

  useEffect(() => {
    if (!guard && !loading) {
      navigate("/guard/login");
      return;
    }

    if (!loading && (guard?.role === "Admin" || guard?.role === "Subadmin")) {
      navigate("/admin");
    }
  }, [guard, loading, navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${api}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      clearAuth();
      navigate("/guard/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { to: "/guard/announcements", label: "Announcement", icon: <Megaphone size={18} /> },
    { to: "/guard/detachment", label: "Detachment / Deployment", icon: <Shield size={18} /> },
    { to: "/guard/my-attendance", label: "My Attendance", icon: <Clock size={18} /> },
    { to: "/guard/leaves", label: "Leave Request", icon: <CalendarDays size={18} /> },
    { to: "/guard/messages", label: "Messages", icon: <MessageCircle size={18} /> },
    { to: "/guard/logbook", label: "Log Book", icon: <BookOpen size={18} /> },
    { to: "/guard/request-coe", label: "Request COE", icon: <FileText size={18} /> },
    { to: "/guard/request-id", label: "Request ID", icon: <IdCardLanyard size={18}/> },
    { to: "/guard/manage-profile", label: "Guard Profile", icon: <UserRoundPen size={18}/>},
  ];

  const attendanceItems = [
    { to: "/guard/guard-attendance/time-in", label: "Time In", icon: <Camera size={16} /> },
    { to: "/guard/guard-attendance/time-out", label: "Time Out", icon: <Clock size={16} /> },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="flex h-screen bg-[#0f172a]">
        {/* ===== Sidebar ===== */}
        <aside
          className={`
            fixed top-0 left-0 
            w-72
            bg-[#1e293b] border-r border-gray-700 
            flex flex-col
            h-full
            overflow-hidden
            transition-transform duration-300 z-50 
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          {/* Header / Logo */}
          <div className="flex items-center justify-between py-6 border-b border-gray-700 px-6 shrink-0">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="logo" className="w-10 h-10" />
              <div className="hidden sm:block">
                <span className="font-bold text-white text-lg">JPM SECURITY</span>
                <p className="text-xs text-gray-400">Guard Portal</p>
              </div>
            </Link>

            {/* Hide button (mobile) */}
            <button
              className="lg:hidden text-gray-400 hover:text-white transition"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col items-center py-6 px-6 border-b border-gray-700 shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
              <UserRoundPen className="text-white w-8 h-8" />
            </div>
            <h3 className="font-semibold text-white text-lg">
              {getPersonName(guard, "Guard Name")}
            </h3>
            <p className="text-sm text-gray-400">{guard?.position || "Security Guard"}</p>
            <div className="mt-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
              <span className="text-green-400 text-xs font-medium">Online</span>
            </div>
          </div>

          {/* Navigation (scrollable) */}
          <nav className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-2 text-gray-300">

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
          </nav>

          {/* Logout (ALWAYS visible + mobile safe) */}
          <div className="px-6 py-4 border-t border-gray-700 shrink-0 bg-[#1e293b]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-lg font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all w-full"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
        {/* Overlay (mobile) */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          ></div>
        )}
        {/* ===== Main Content ===== */}
        <main className="flex-1 flex flex-col overflow-x-hidden lg:ml-72">

          {/* ✅ Topbar (large screen) */}
          <div className="hidden lg:flex items-center justify-between bg-[#1e293b] border-b border-gray-700 px-6 py-4 sticky top-0 z-30">

            {/* ✅ LEFT SIDE — Logo + Message icon */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={logo} alt="logo" className="w-10 h-10" />
                <span className="font-bold text-white text-lg">JPM SECURITY</span>
              </div>
            </div>
          </div>

          {/* ✅ Topbar (mobile only) */}
          <div className="lg:hidden flex items-center justify-between bg-[#1e293b] border-b border-gray-700 shadow-lg px-4 py-4 sticky top-0 z-30">

            {/* Sidebar Toggle */}
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white transition">
              <Menu size={28} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={logo} alt="logo" className="w-8 h-8" />
              <span className="font-bold text-white">JPM SECURITY</span>
            </div>

            {/* Mobile Message + Notification Icons */}
            <div className="flex items-center gap-4">
              <Link to="/guard/messages" className="text-gray-400 hover:text-white transition">
                <MessageCircle size={22} />
              </Link>
            </div>
          </div>

        {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0f172a]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Dynamic Shift Reminder Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className={`p-6 flex items-center gap-4 border-b border-gray-700 ${
              activeModal === '24h' 
                ? 'bg-red-500/10' 
                : activeModal === '6h' 
                  ? 'bg-blue-500/10' 
                  : 'bg-amber-500/10'
            }`}>
              <div className={`p-3 rounded-full ${
                activeModal === '24h' 
                  ? 'bg-red-500/20 text-red-400' 
                  : activeModal === '6h' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-amber-500/20 text-amber-400'
              }`}>
                {activeModal === '24h' && <AlertTriangle className="w-6 h-6" />}
                {activeModal === '18h' && <Hourglass className="w-6 h-6" />}
                {activeModal === '12h' && <Clock className="w-6 h-6" />}
                {activeModal === '6h' && <Info className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {activeModal === '24h' && "Shift Limit Reached"}
                  {activeModal === '18h' && "Overtime Reminder"}
                  {activeModal === '12h' && "Shift Completed"}
                  {activeModal === '6h' && "Shift Reminder"}
                </h3>
                <p className="text-xs text-gray-400">JPM Security Management System</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {activeModal === '6h' && (
                  <>
                    You have been on duty for <strong>6 hours</strong> now. Please remember to time out correctly at the end of your shift to ensure your working hours are logged properly.
                  </>
                )}
                {activeModal === '12h' && (
                  <>
                    Your standard <strong>12-hour shift</strong> is completed. If your shift is over, please time out now. If you are authorized to continue working, choose overtime.
                  </>
                )}
                {activeModal === '18h' && (
                  <>
                    You have been on duty for <strong>18 hours</strong> (including overtime). Please ensure your supervisor is aware, and don't forget to time out correctly when your duty concludes.
                  </>
                )}
                {activeModal === '24h' && (
                  <>
                    You have reached the maximum allowed limit of <strong>24 hours</strong> on duty. The system is halting your shift hours. Please time out immediately.
                  </>
                )}
              </p>

              {/* Status details */}
              {activeDuty && (
                <div className="bg-[#0f172a] rounded-lg p-3 border border-gray-700/50 space-y-1.5 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Duty Location:</span>
                    <span className="text-gray-200 font-semibold">{activeDuty.scheduleId?.client || "Active Post"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time In:</span>
                    <span className="text-gray-200 font-mono">
                      {new Date(activeDuty.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-slate-800/50 border-t border-gray-700 flex justify-end gap-3">
              {activeModal === '6h' && (
                <button
                  onClick={handleModal6hDismiss}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-all shadow-md shadow-blue-900/30 w-full sm:w-auto"
                >
                  Understood
                </button>
              )}
              {activeModal === '12h' && (
                <>
                  <button
                    onClick={handleModalOvertime}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-200 font-semibold px-4 py-2 rounded-lg text-sm transition-all border border-gray-600 flex-1"
                  >
                    Will you overtime?
                  </button>
                  <button
                    onClick={handleModalTimeOut}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-md shadow-amber-900/30 flex-1"
                  >
                    Time out
                  </button>
                </>
              )}
              {activeModal === '18h' && (
                <>
                  <button
                    onClick={handleModal18hDismiss}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-200 font-semibold px-4 py-2 rounded-lg text-sm transition-all border border-gray-600 flex-1"
                  >
                    Continue
                  </button>
                  <button
                    onClick={handleModalTimeOut}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-md shadow-amber-900/30 flex-1"
                  >
                    Time out
                  </button>
                </>
              )}
              {activeModal === '24h' && (
                <button
                  onClick={handleModal24hDismiss}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-all shadow-md shadow-red-900/30 w-full flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Time out Immediately
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
