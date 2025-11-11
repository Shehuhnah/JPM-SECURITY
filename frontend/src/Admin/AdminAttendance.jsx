import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Clock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function GuardAttendancePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { admin, token } = useAuth(); //fetch admin data
  
  useEffect(() => {
      if (!admin || !token) {
        navigate("/admin/Login");
      }
    }, [admin, token, navigate]);

  // ✅ Sample static data (replace with backend later)
  const attendance = [
    {
      id: 1,
      name: "Vic Fuentes",
      place: "Makati",
      date: "2025-09-20",
      timeIn: "08:00 AM",
      timeOut: "05:00 PM",
      status: "On Duty",
      workingHour: "9h",
    },
    {
      id: 2,
      name: "Tony Perry",
      place: "Taguig",
      date: "2025-09-20",
      timeIn: "09:00 AM",
      timeOut: "06:00 PM",
      status: "Inactive",
      workingHour: "8h",
    },
    {
      id: 3,
      name: "Gerard Way",
      place: "Quezon City",
      date: "2025-09-20",
      timeIn: "07:30 AM",
      timeOut: "04:30 PM",
      status: "On Duty",
      workingHour: "9h",
    },
  ];

  const filtered = attendance.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 flex flex-col p-4 md:p-6">
        {/* ===== Header ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
          <h2 className="text-3xl font-bold tracking-wide text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            Guards Attendance
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-700 bg-[#1e293b] text-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All</option>
              <option value="On Duty">On Duty</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search guard..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1e293b] border border-gray-700 rounded-md pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="overflow-x-auto bg-[#1e293b]/60 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-[#234C6A] text-gray-100 text-sm uppercase tracking-wider">
              <tr className="text-center">
                <th className="px-4 py-3 ">Guard Name</th>
                <th className="px-4 py-3 ">Place</th>
                <th className="px-4 py-3 ">Date</th>
                <th className="px-4 py-3 ">Time In</th>
                <th className="px-4 py-3 ">Time Out</th>
                <th className="px-4 py-3 ">Status</th>
                <th className="px-4 py-3 ">Working Hour</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-gray-700 hover:bg-[#243046] transition-colors text-sm text-center"
                  >
                    <td className="px-4 py-3 font-medium text-white">{a.name}</td>
                    <td className="px-4 py-3">{a.place}</td>
                    <td className="px-4 py-3 text-gray-300">{a.date}</td>
                    <td className="px-4 py-3">{a.timeIn}</td>
                    <td className="px-4 py-3">{a.timeOut}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          a.status === "On Duty"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">{a.workingHour}</td>

                    <td className="px-4 py-3 text-center">
                      <button
                        className="text-blue-400 hover:text-blue-300 transition"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-6 text-center text-gray-400 italic"
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Summary / Footer ===== */}
        <div className="flex justify-between items-center mt-6 text-gray-400 text-sm">
          <p>Total Guards: {attendance.length}</p>
          <p>
            Showing <span className="text-blue-400">{filtered.length}</span> of{" "}
            <span className="text-blue-400">{attendance.length}</span> entries
          </p>
        </div>
      </main>
    </div>
  );
}
