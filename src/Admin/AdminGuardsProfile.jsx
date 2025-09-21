import React, { useState } from "react";
import Navbar from "../components/navbar";

export default function GuardTable() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const guards = [
    {
      name: "Juan Dela Cruz",
      id: "G-001",
      hiringDate: "2022-01-10",
      tenure: "2 years",
      position: "Security Guard",
      status: "Active",
      address: "Quezon City",
      contact: "09123456789",
      email: "juan@email.com",
      role: "Guard",
    },
    {
      name: "Pedro Santos",
      id: "G-002",
      hiringDate: "2021-05-22",
      tenure: "3 years",
      position: "Head Guard",
      status: "Suspended",
      address: "Makati City",
      contact: "09987654321",
      email: "pedro@email.com",
      role: "Sub-admin",
    },
    {
      name: "Maria Lopez",
      id: "G-003",
      hiringDate: "2023-03-15",
      tenure: "1 year",
      position: "Security Guard",
      status: "Active",
      address: "Cebu City",
      contact: "09112223333",
      email: "maria@email.com",
      role: "Applicant",
    },
  ];

  const filteredData = guards.filter(
    (g) =>
      (filter === "All" || g.role === filter) &&
      (g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <div className="w-64 bg-white">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6">
        {/* Header with Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-xl text-white font-bold">Admin Hiring Posts</h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border px-3 py-2 rounded-md shadow-sm bg-gray-900 text-white hover:bg-gray-900 transition"
            >
              <option value="All">All</option>
              <option value="Guard">Guard</option>
              <option value="Sub-admin">Sub-admin</option>
              <option value="Applicant">Applicant</option>
            </select>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border px-3 py-2 rounded-md bg-gray-900 text-white focus:outline-none focus:ring focus:ring-blue-300 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table Container (scrollable on small screens) */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[800px] border-collapse rounded-lg overflow-hidden">
            <thead className="bg-gray-500 text-white text-sm md:text-base">
              <tr>
                <th className="p-3 text-left">Guard Name</th>
                <th className="p-3 text-left">Guard ID</th>
                <th className="p-3 text-left">Hiring Date</th>
                <th className="p-3 text-left">Tenure</th>
                <th className="p-3 text-left">Position</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((g, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-700 text-white hover:bg-gray-700 text-sm md:text-base"
                  >
                    <td className="p-3">{g.name}</td>
                    <td className="p-3">{g.id}</td>
                    <td className="p-3">{g.hiringDate}</td>
                    <td className="p-3">{g.tenure}</td>
                    <td className="p-3">{g.position}</td>
                    <td className="p-3">
                      {g.status === "Active" ? (
                        <span className="px-3 py-1 text-sm rounded-full bg-green-900 text-green-300">
                          ● Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-sm rounded-full bg-gray-600 text-gray-300">
                          ● Suspended
                        </span>
                      )}
                    </td>
                    <td className="p-3">{g.address}</td>
                    <td className="p-3">{g.contact}</td>
                    <td className="p-3">{g.email}</td>
                    <td className="p-3">{g.role}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center py-6 text-gray-400 italic"
                  >
                    No results found
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
