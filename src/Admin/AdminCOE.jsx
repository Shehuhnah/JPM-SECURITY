import React, { useState } from "react";
import Navbar from "../components/navbar.jsx";

export default function RequestedCOE() {
  const [search, setSearch] = useState("");

  const requests = [
    { id: 1, name: "Vic Fuentes", guardId: "123", phone: "09123456789", email: "vic@mail.com" },
    { id: 2, name: "Tony Perry", guardId: "124", phone: "09123456788", email: "tony@mail.com" },
    { id: 3, name: "Gerard N.O Way", guardId: "125", phone: "09123456787", email: "gerard@mail.com" },
    { id: 4, name: "Kellin Quinn", guardId: "126", phone: "09123456786", email: "kellin@mail.com" },
    { id: 5, name: "Taylor York", guardId: "127", phone: "09123456785", email: "taylor@mail.com" },
    { id: 6, name: "Hayley Williams", guardId: "128", phone: "09123456784", email: "hayley@mail.com" },
    { id: 7, name: "Ben Barlow", guardId: "129", phone: "09123456783", email: "ben@mail.com" },
    { id: 8, name: "Sam Bettley", guardId: "130", phone: "09123456782", email: "sam@mail.com" },
  ];

  const filtered = requests.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Sidebar */}
     
        <Navbar />
      {/* Main Content */}
      <main className="flex-1 p-6 overflow-x-auto">
        {/* Header + Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-xl font-bold mb-2 md:mb-0 text-white">
            Requested Certificate of Employment
          </h1>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md text-white focus:ring-2 focus:ring-white w-full md:w-64"
          />
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-[#183D3D] text-white text-sm">
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Guard ID</th>
                <th className="px-4 py-2">Phone Number</th>
                <th className="px-4 py-2">Email Address</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img
                      src={`https://i.pravatar.cc/40?u=${r.id}`}
                      alt={r.name}
                      className="w-8 h-8 rounded-full"
                    />
                    {r.name}
                  </td>
                  <td className="px-4 py-3">{r.guardId}</td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    <button className="px-3 py-1 rounded bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
                      Accept
                    </button>
                    <button className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600">
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
