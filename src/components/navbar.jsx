import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaFileAlt,
  FaUserShield,
  FaUser,
  FaRegEnvelope,
  FaRegClipboard,
  FaBuilding,
  FaUsers,
  FaRegClock,
  FaChevronDown,
} from "react-icons/fa";

// Import avatar and logo from assets
import avatar from "../assets/gerard.jpg";   // adjust filename to match your file
import logo from "../assets/jpmlogo.png";   // adjust filename to match your file

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(false);

  return (
    <div className="w-64 bg-white border-r shadow min-h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center py-6 border-b px-4">
        <img src={logo} alt="logo" className="w-12 h-12 mr-2" />
        <span className="font-bold text-gray-800 text-lg text-center">
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

      {/* Menu */}
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
          to="/Admin/AdminGuardUpdate"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaUserShield />
          <span>Guard Update</span>
        </Link>

        <Link
          to="/Admin/AdminCOE"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaRegClipboard />
          <span>Requested COE</span>
        </Link>

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
              className={`transition-transform ${
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
          to="/admin/AdminAttendance"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
        >
          <FaRegClock />
          <span>Attendance</span>
        </Link>

        <button
          
        ><Link to={'/'}>Logout</Link></button>
      </nav>
    </div>
  );
}
