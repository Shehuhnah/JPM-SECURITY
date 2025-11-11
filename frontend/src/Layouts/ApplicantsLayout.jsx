import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LogOut, Briefcase, MessageCircle } from "lucide-react";
import logo from "../assets/jpmlogo.png";

export default function ApplicantsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1e293b] border-r border-gray-800 shadow-lg flex flex-col transform transition-transform duration-300 z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:static`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between py-6 border-b border-gray-800 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="logo" className="w-12 h-12" />
            <span className="font-bold text-gray-100 text-lg">
              JPM SECURITY
            </span>
          </Link>

          {/* Close button (mobile only) */}
          <button
            className="md:hidden text-gray-400 hover:text-gray-200"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center mt-6 mb-6 px-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-2xl shadow-lg">
            👤
          </div>
          <h3 className="font-medium text-gray-100 mt-2">Applicant Portal</h3>
          <p className="text-xs text-gray-400">Job Application</p>
        </div>

        {/* Navigation */}
        <nav className="w-full flex-1 px-4 space-y-2 text-gray-300 overflow-y-auto">
          <Link
            to="/job-application-process/applicants"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all font-medium ${
              location.pathname === "/job-application-process/applicants"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                : "hover:bg-[#162236] text-gray-300"
            }`}
          >
            <Briefcase size={18} />
            Hiring Details
          </Link>

          <Link
            to="/job-application-process/applicants/messages"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all font-medium ${
              location.pathname === "/job-application-process/applicants/messages"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                : "hover:bg-[#162236] text-gray-300"
            }`}
          >
            <MessageCircle size={18} />
            Messages
          </Link>

          <div className="pt-4 border-t border-gray-800 mt-4">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 font-medium transition-all"
            >
              <LogOut size={18} />
              Logout
            </Link>
          </div>
        </nav>
      </aside>

      {/* Overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        ></div>
      )}

      {/* ===== Main Content ===== */}
      <main className="flex-1 flex flex-col bg-[#0f172a]">
        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between bg-[#1e293b] border-b border-gray-800 shadow-md px-4 py-3">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="text-gray-300 hover:text-gray-100"
          >
            <Menu size={28} />
          </button>
          <span className="font-bold text-gray-100">Applicants Portal</span>
        </div>

        {/* This is the only scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
