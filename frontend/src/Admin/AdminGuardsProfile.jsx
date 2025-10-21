import { useState } from "react";
import { Search, Shield, UserCheck, Clock, UserPlus } from "lucide-react";

export default function GuardTable() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const guards = [
    {
      name: "Juan Dela Cruz",
      id: "G-001",
      position: "Security Guard",
      dutystation: "SM Mall of Asia",
      address: "Quezon City",
      contact: "09123456789",
      email: "juan@email.com",
      shift: "Night Shift",
    },
    {
      name: "Maria Santos",
      id: "G-002",
      position: "Officer in Charge",
      dutystation: "Robinsons Tagaytay",
      address: "Dasmariñas",
      contact: "09998887777",
      email: "maria@email.com",
      shift: "Day Shift",
    },
    {
      name: "Jose Ramos",
      id: "G-003",
      position: "Inspector",
      dutystation: "Ayala Mall Dasma",
      address: "Silang",
      contact: "09223334444",
      email: "jose@email.com",
      shift: "Night Shift",
    },
    {
      name: "Pedro Cruz",
      id: "G-004",
      position: "Security Guard",
      dutystation: "Lancaster Residences",
      address: "Imus",
      contact: "09771234567",
      email: "pedro@email.com",
      shift: "Day Shift",
    },
  ];

  // Filter logic
  const filteredData = guards.filter(
    (g) =>
      (filter === "All" || g.position === filter) &&
      (g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        g.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <div className="flex-1 flex flex-col p-6">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="py-3">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <Shield className="text-blue-500" /> Guards Profile
            </h2>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-700 px-3 py-2 rounded-md bg-[#1e293b] text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Positions</option>
              <option value="Security Guard">Security Guard</option>
              <option value="Officer in Charge">Officer in Charge</option>
              <option value="Inspector">Inspector</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-md bg-[#1e293b] border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5"
            >
              <UserPlus size={18} />
              Add Guard
            </button>
          </div>
        </header>

        {/* Table Section */}
        <div className="overflow-x-auto bg-[#1e293b]/70 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-[#10263a] text-gray-100 uppercase tracking-wide text-xs md:text-sm">
              <tr>
                <th className="p-3 text-left">Guard Name</th>
                <th className="p-3 text-left">Guard ID</th>
                <th className="p-3 text-left">Position</th>
                <th className="p-3 text-left">Duty Station</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Shift</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((g, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-700 hover:bg-blue-900/20 transition"
                  >
                    <td className="p-3 font-medium flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      {g.name}
                    </td>
                    <td className="p-3">{g.id}</td>
                    <td className="p-3 text-blue-400">{g.position}</td>
                    <td className="p-3">{g.dutystation}</td>
                    <td className="p-3">{g.contact}</td>
                    <td className="p-3 text-gray-300">{g.email}</td>
                    <td className="p-3 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {g.shift}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500 italic">
                    No results found.
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
