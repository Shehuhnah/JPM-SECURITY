import React, { useState, Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { Transition } from "@headlessui/react";
import {
  FaCalendarAlt, FaFileAlt, FaUserShield, FaUser, FaRegEnvelope,
  FaRegClipboard, FaUsers, FaRegClock, FaChevronDown, FaBars, FaTimes,
} from "react-icons/fa";

import avatar from "../assets/gerard.jpg";
import logo from "../assets/jpmlogo.png";

// Re-usable NavLink
const NavLink = ({ to, icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-600 text-white font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

// Re-usable Dropdown
const Dropdown = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
        <FaChevronDown
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <Transition
        show={isOpen}
        enter="transition-opacity ease-linear duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-linear duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <ul className="ml-4 mt-1 pl-4 border-l border-gray-200 space-y-1 text-sm">
          {children}
        </ul>
      </Transition>
    </div>
  );
};

// The core navigation panel
const NavigationPanel = ({ onLinkClick }) => (
  <div className="w-64 bg-white border-r shadow-lg min-h-screen flex flex-col overflow-y-auto">
    {/* Logo */}
    <div className="flex items-center justify-center py-6 border-b px-4">
      <Link to="/" onClick={onLinkClick}>
        <img src={logo} alt="logo" className="w-12 h-12" />
      </Link>
      <span className="font-bold text-gray-800 text-lg text-center ml-2">
        JPM SECURITY
      </span>
    </div>

    {/* User Profile */}
    <div className="flex flex-col items-center py-6 border-b">
      <img src={avatar} alt="Admin Avatar" className="w-16 h-16 rounded-full border mb-3" />
      <h3 className="font-semibold text-gray-700">Gerard N.O Way</h3>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2">
      <NavLink to="/admin/dashboard" icon={<FaUserShield />} onClick={onLinkClick}>Dashboard</NavLink>
      <NavLink to="/adminDeployment" icon={<FaCalendarAlt />} onClick={onLinkClick}>Detachment</NavLink>
      <NavLink to="/Admin/AdminResume" icon={<FaFileAlt />} onClick={onLinkClick}>Resume</NavLink>
      
      <Dropdown title="Posts" icon={<FaUser />}>
        <NavLink to="/Admin/AdminPosts" onClick={onLinkClick}>Announcement</NavLink>
        <NavLink to="/Admin/AdminHiring" onClick={onLinkClick}>Hiring</NavLink>
        <NavLink to="/Admin/CompanyDetails" onClick={onLinkClick}>Company Details</NavLink>
      </Dropdown>
      
      <Dropdown title="Cert. of Employment" icon={<FaRegClipboard />}>
        <NavLink to="/Admin/AdminCOE" onClick={onLinkClick}>Requested COE</NavLink>
        <NavLink to="/Admin/AdminCOEApproved" onClick={onLinkClick}>Approved COE</NavLink>
        <NavLink to="/Admin/AdminCOEDeclined" onClick={onLinkClick}>Declined COE</NavLink>
      </Dropdown>

      <NavLink to="/Admin/AdminMessages" icon={<FaRegEnvelope />} onClick={onLinkClick}>Messages</NavLink>
      <NavLink to="/Admin/UserAccounts" icon={<FaUsers />} onClick={onLinkClick}>Users</NavLink>
      <NavLink to="/Admin/AdminGuardsProfile" icon={<FaUsers />} onClick={onLinkClick}>Guards Profile</NavLink>
      <NavLink to="/Admin/AdminAttendance" icon={<FaRegClock />} onClick={onLinkClick}>Attendance</NavLink>
      
      <div className="pt-4 border-t mt-4">
        <NavLink to="/" icon={<FaUserShield />} onClick={onLinkClick}>Logout</NavLink>
      </div>
    </nav>
  </div>
);


export default function ResponsiveNavbar({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <NavigationPanel onLinkClick={handleLinkClick} />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center bg-white p-4 border-b sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
           <img src={logo} alt="logo" className="w-8 h-8" />
           <span className="font-bold text-gray-800">JPM SECURITY</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700">
          <FaBars size={24} />
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      <Transition show={isMobileMenuOpen} as={Fragment}>
        <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
          {/* Off-canvas menu */}
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <FaTimes className="h-6 w-6 text-white" />
                </button>
              </div>
              <NavigationPanel onLinkClick={handleLinkClick} />
            </div>
          </Transition.Child>
          {/* Backdrop */}
          <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          </Transition.Child>
        </div>
      </Transition>

      {/* Main Content */}
      <main className="md:pl-64">
        {children}
      </main>
    </div>
  );
}