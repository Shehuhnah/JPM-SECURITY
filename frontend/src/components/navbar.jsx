import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaFileAlt,
  FaUserShield,
  FaUser,
  FaRegEnvelope,
  FaRegClipboard,
  FaUsers,
  FaRegClock,
  FaChevronDown,
} from "react-icons/fa";

import avatar from "../assets/gerard.jpg";
import logo from "../assets/jpmlogo.png";

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(false); // Posts dropdown
  const [openCOE, setOpenCOE] = useState(false); // ✅ COE dropdown

  return (
    <div className="w-64 bg-white border-r shadow min-h-screen flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-center py-6 border-b px-4">
        <Link to="/">
          <img src={logo} alt="logo" className="w-12 h-12" />
        </Link>
        <span className="font-bold text-gray-800 text-lg text-center ml-2">
          JPM SECURITY AGENCY
        </span>
      </div>

      {/* User Profile */}
      <div className="flex flex-col items-center py-6 border-b">
        <img
          src={avatar}
          alt="Admin Avatar"
          className="w-16 h-16 rounded-full border mb-3"
        />
        <h3 className="font-semibold text-gray-700">Gerard N.O Way</h3>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 text-gray-700">
        <Link
          to="/Admin/AdminDeployment"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaCalendarAlt />
          <span>Detachment/Deployment</span>
        </Link>

        <Link
          to="/Admin/AdminResume"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaFileAlt />
          <span>Resume</span>
        </Link>

        <Link
          to="/Admin/AdminGuardUpdates"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaUserShield />
          <span>Guard Update</span>
        </Link>

        {/* ✅ COE DROPDOWN */}
        <div>
          <button
            onClick={() => setOpenCOE(!openCOE)}
            className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <FaRegClipboard />
              <span>Certificate of Employment</span>
            </div>
            <FaChevronDown
              className={`transition-transform duration-200 ${
                openCOE ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown content */}
          {openCOE && (
            <ul className="ml-8 mt-1 space-y-1 text-sm animate-fadeIn">
              <li>
                <Link
                  to="/Admin/AdminCOE"
                  className="block p-2 rounded hover:bg-gray-100"
                >
                  Requested COE
                </Link>
              </li>
              <li>
                <Link
                  to="/Admin/AdminCOEApproved"
                  className="block p-2 rounded hover:bg-gray-100"
                >
                  Approved COE
                </Link>
              </li>
              <li>
                <Link
                  to="/Admin/AdminCOEDeclined"
                  className="block p-2 rounded hover:bg-gray-100"
                >
                  Declined COE
                </Link>
              </li>
            </ul>
          )}
        </div>

        <Link
          to="/Admin/AdminMessages"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaRegEnvelope />
          <span>Messages</span>
        </Link>

        {/* Posts Dropdown */}
        <div>
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <FaUser />
              <span>Posts</span>
            </div>
            <FaChevronDown
              className={`transition-transform duration-200 ${
                openDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {openDropdown && (
            <ul className="ml-8 mt-1 space-y-1 text-sm">
              <li>
                <Link
                  to="/Admin/AdminPosts"
                  className="block p-2 rounded hover:bg-gray-100"
                >
                  Announcement
                </Link>
              </li>
              <li>
                <Link
                  to="/Admin/AdminHiring"
                  className="block p-2 rounded hover:bg-gray-100"
                >
                  Hiring
                </Link>
              </li>
              <li>
                <Link
                  to="/Admin/CompanyDetails"
                  className="block p-2 rounded hover:bg-gray-100"
                >
                  Company Details
                </Link>
              </li>
            </ul>
          )}
        </div>

        <Link
          to="/Admin/UserAccounts"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaUsers />
          <span>Users</span>
        </Link>

        <Link
          to="/Admin/AdminGuardsProfile"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaUsers />
          <span>Guards Profile</span>
        </Link>

        <Link
          to="/Admin/AdminAttendance"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaRegClock />
          <span>Attendance</span>
        </Link>

        <button className="w-full mt-4 text-left p-2 text-red-600 hover:bg-gray-100 rounded">
          <Link to="/">Logout</Link>
        </button>
      </nav>
    </div>
  );
}
