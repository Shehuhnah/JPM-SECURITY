import React, { useState } from "react";
import Navbar from "../components/navbar";

export default function GuardAttendancePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // sample static data
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
      place: "QC",
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
    <div className="flex min-h-screen bg-[#0f172a]">
      <Navbar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-x-auto">
        <h2 className="text-xl text-white font-bold pb-3">
          Guards Attendance
        </h2>

        <div className="flex justify-end gap-2 mb-4 flex-col sm:flex-row">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-3 py-2 rounded-md shadow-sm bg-gray-900 text-white hover:bg-gray-800 transition"
          >
            <option value="All">All</option>
            <option value="Guard">Guard</option>
            <option value="Sub-admin">Sub-admin</option>
            <option value="Applicant">Applicant</option>
          </select>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Search guard..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md bg-gray-900 text-white 
               focus:outline-none focus:ring focus:ring-blue-300 
               w-full sm:w-64"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full min-w-[800px] border-collapse rounded-lg overflow-hidden">
            <thead className="bg-gray-500 text-white text-sm md:text-base">
              <tr>
                <th className="px-4 py-3 font-semibold">Guard Name</th>
                <th className="px-4 py-3 font-semibold">Place</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Time In</th>
                <th className="px-4 py-3 font-semibold">Time Out</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Working Hour</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">{a.place}</td>
                  <td className="px-4 py-3">{a.date}</td>
                  <td className="px-4 py-3">{a.timeIn}</td>
                  <td className="px-4 py-3">{a.timeOut}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === "On Duty"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.workingHour}</td>
                  <td className="px-4 py-3 text-gray-500">⋮</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

       
      </div>
    </div>
  );
}
