import React from "react";
import Navbar from "../components/navbar.jsx";

export default function AdminCOEApproved() {
  const approved = [
    { id: 1, name: "Vic Fuentes", guardId: "123", date: "2025-10-08" },
    { id: 2, name: "Tony Perry", guardId: "124", date: "2025-10-07" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <main className="flex-1 p-6 overflow-x-auto">
        <h1 className="text-xl font-bold mb-4 text-white">
          Approved Certificate of Employment Requests
        </h1>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-[#183D3D] text-white">
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Guard ID</th>
                <th className="px-4 py-2">Date Approved</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.guardId}</td>
                  <td className="px-4 py-3">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
