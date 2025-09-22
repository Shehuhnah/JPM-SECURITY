import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

import logo from "../assets/jpmlogo.png"; 

export default function GuardsLayout() {
  const [openAttendance, setOpenAttendance] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <aside className="w-64 bg-white shadow-md flex flex-col items-center">
       <div className="flex items-center justify-center py-6 border-b px-4">
               <img src={logo} alt="logo" className="w-12 h-12" />
               <span className="font-bold text-gray-800 text-lg text-center">
                 JPM SECURITY AGENCY
               </span>
             </div>
       

        {/* Profile (temporary icon) */}
        <div className="flex flex-col items-center mt-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl">
            👤
          </div>
          <h3 className="font-medium text-gray-700 mt-2">Guard Name</h3>
          <p className="text-xs text-gray-500">Security Guard</p>
        </div>

        {/* Navigation */}
        <nav className="w-full flex-1 px-6 space-y-2 text-gray-700">
          <Link
            to="GuardDetachment"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Detachment / Deployment
          </Link>

          <Link
            to="GuardAnnouncement"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Announcement
          </Link>

          <Link
            to="GuardLogBook"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Log Book
          </Link>

          <Link
            to="GuardReqCOE"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Request COE
          </Link>

          <Link
            to="hirings"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Hirings
          </Link>

          {/* Attendance Dropdown */}
          <div>
            <button
              onClick={() => setOpenAttendance(!openAttendance)}
              className="w-full text-left p-2 rounded hover:bg-gray-100 font-medium"
            >
              Attendance
            </button>

            {openAttendance && (
              <ul className="ml-4 mt-1 space-y-1 text-sm">
                <li>
                  <Link
                    to="GuardAttendanceTimeIn"
                    className="block p-2 rounded hover:bg-gray-100"
                  >
                    Time In
                  </Link>
                </li>
                <li>
                  <Link
                    to="GuardAttendanceTimeOut"
                    className="block p-2 rounded hover:bg-gray-100"
                  >
                    Time Out
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <button className="w-full text-left p-2 rounded hover:bg-gray-100 font-medium">
            <Link to="/">Logout</Link>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
