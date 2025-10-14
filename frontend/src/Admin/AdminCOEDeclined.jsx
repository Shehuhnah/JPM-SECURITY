import React from "react";
import Navbar from "../components/navbar.jsx";

export default function AdminCOEDeclined() {
  const declined = [
    { id: 1, name: "Gerard Way", guardId: "125", reason: "Incomplete requirements" },
    { id: 2, name: "Hayley Williams", guardId: "128", reason: "Invalid ID submitted" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <main className="flex-1 p-6 overflow-x-auto">
        <h1 className="text-xl font-bold mb-4 text-white">
          Declined Certificate of Employment Requests
        </h1>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-[#183D3D] text-white">
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Guard ID</th>
                <th className="px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {declined.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.guardId}</td>
                  <td className="px-4 py-3 text-red-600">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
