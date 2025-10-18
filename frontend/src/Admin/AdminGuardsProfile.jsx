import React, { useState } from "react";
import Navbar from "../components/navbar";

export default function GuardTable() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const guards = [
    {
      name: "Juan Dela Cruz",
      id: "G-001",
      position: "Security Guard",
      dutystation: "Site A",
      address: "Quezon City",
      contact: "09123456789",
      email: "juan@email.com",
      shift: "Night Shift",
    },
        {
      name: "Juan Dela Cruz",
      id: "G-001",
      position: "Security Guard",
      dutystation: "Site A",
      address: "Quezon City",
      contact: "09123456789",
      email: "juan@email.com",
      shift: "Night Shift",
    },

        {
      name: "Juan Dela Cruz",
      id: "G-001",
      position: "Security Guard",
      dutystation: "Site A",
      address: "Quezon City",
      contact: "09123456789",
      email: "juan@email.com",
      shift: "Night Shift",
    },

        {
      name: "Juan Dela Cruz",
      id: "G-001",
      position: "Security Guard",
      dutystation: "Site A",
      address: "Quezon City",
      contact: "09123456789",
      email: "juan@email.com",
      shift: "Night Shift",
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
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6">
        {/* Header with Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-xl text-white font-bold fi">Guards Profile</h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border px-3 py-2 rounded-md shadow-sm bg-gray-900 text-white hover:bg-gray-900 transition"
            >
              <option value="All">Security Guard</option>
              <option value="Guard">Officer in Charge</option>
              <option value="Sub-admin">Inspector</option>
              <option value="Applicant">Operation Officer</option>
              <option value="Applicant">Head Operation</option>
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

        {/* Table Container */}
        <div className="overflow-x-auto flex-1  bg-white shadow-md rounded-lg">
          <table className="w-full min-w-[800px] border-collapse rounded-lg overflow-hidden">
            <thead className="bg-gray-500 text-white text-sm md:text-base sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left w-50">Guard Name</th>
                <th className="p-3 text-left w-24">Guard ID</th>
                <th className="p-3 text-left w-35">Position</th>
                <th className="p-3 text-left w-30">Duty Station</th>
                <th className="p-3 text-left w-32">Contact</th>
                <th className="p-3 text-left w-56">Email</th>
                <th className="p-3 text-left w-32">Shift</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((g, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-700 hover:bg-gray-200 text-sm md:text-base"
                  >
                    <td className="p-3">{g.name}</td>
                    <td className="p-3">{g.id}</td>
                    <td className="p-3">{g.position}</td>
                    <td className="p-3">{g.dutystation}</td>
                    <td className="p-3">{g.contact}</td>
                    <td className="p-3">{g.email}</td>
                    <td className="p-3">{g.shift}</td>
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
