import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Menu, X, LogOut, Briefcase, Building2, MessageCircle } from "lucide-react";
import logo from "../assets/jpmlogo.png";

export default function ApplicantsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md flex flex-col transform transition-transform duration-300 z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:static`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between py-6 border-b px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="logo" className="w-12 h-12" />
            <span className="font-bold text-gray-800 text-lg">
              JPM SECURITY AGENCY
            </span>
          </Link>

          {/* Close button (mobile only) */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center mt-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl">
            👤
          </div>
          <h3 className="font-medium text-gray-700 mt-2">Applicant Name</h3>
          <p className="text-xs text-gray-500">Applicant</p>
        </div>

        {/* Navigation */}
        <nav className="w-full flex-1 px-6 space-y-2 text-gray-700 overflow-y-auto">
          <Link
            to="/Applicants/ApplicantsHiringDetails"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium"
          >
            <Briefcase size={18} />
            Hiring Details
          </Link>

          <Link
            to="/Applicants/ApplicantsCompanyDetails"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium"
          >
            <Building2 size={18} />
            Company Details
          </Link>

          <Link
            to="/Applicants/ApplicantsMessages"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium"
          >
            <MessageCircle size={18} />
            Messages
          </Link>

          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium text-red-600"
          >
            <LogOut size={18} />
            Logout
          </Link>
        </nav>
      </aside>

      {/* Overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
        ></div>
      )}

      {/* ===== Main Content ===== */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={28} />
          </button>
          <span className="font-bold">Applicants Portal</span>
        </div>

        {/* This is the only scrollable area */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
