import { NavLink, Outlet } from "react-router-dom";

export default function GuardsLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-3xl">👤</span>
          </div>
          <h2 className="mt-3 font-semibold text-center text-gray-800">
            Guard Name
          </h2>
          <p className="text-sm text-gray-500">Guard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-3 text-gray-700">
            <li>
              <NavLink
                to="GuardAttendanceTimeIn"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md font-medium transition ${
                    isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`
                }
              >
                📊 Attendance
              </NavLink>
              <ul className="ml-6 mt-2 space-y-1 text-sm text-gray-600">
                <li>
                  <NavLink
                    to="GuardAttendanceTimeIn"
                    className={({ isActive }) =>
                      isActive ? "text-blue-600" : "hover:text-blue-600"
                    }
                  >
                    Time In
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="GuardAttendanceTimeOut"
                    className={({ isActive }) =>
                      isActive ? "text-blue-600" : "hover:text-blue-600"
                    }
                  >
                    Time Out
                  </NavLink>
                </li>
              </ul>
            </li>
            <li>
              <NavLink
                to="GuardDetachment"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md font-medium transition ${
                    isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`
                }
              >
                📄 Detachment / Deployment
              </NavLink>
            </li>
            <li>
              <NavLink
                to="GuardAnnouncement"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md font-medium transition ${
                    isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`
                }
              >
                📢 Announcement
              </NavLink>
            </li>
            <li>
              <NavLink
                to="GuardLogBook"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md font-medium transition ${
                    isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`
                }
              >
                🔄 Log Book
              </NavLink>
            </li>
            <li>
              <NavLink
                to="GuardReqCOE"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md font-medium transition ${
                    isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`
                }
              >
                📑 Request COE
              </NavLink>
            </li>
            
            <li>
              <NavLink
                to="hirings"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md font-medium transition ${
                    isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`
                }
              >
                📝 Hirings
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
