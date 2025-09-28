import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function AdminGuardUpdates() {
  const navigate = useNavigate();
  const [guards, setGuards] = useState([
    { id: 1, name: "Vic Fuentes", avatar: "/avatars/male1.png" },
    { id: 2, name: "Tony Perry", avatar: "/avatars/male2.png" },
    { id: 3, name: "Gerard N.O Way", avatar: "/avatars/male3.png" },
    { id: 4, name: "Kellin Quinn", avatar: "/avatars/female1.png" },
  ]);

  useEffect(() => {
    // Later replace with backend fetch
    // fetch("/api/guards").then(res => res.json()).then(setGuards);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Navbar />

      {/* Content */}
      <main className="flex-1 px-6 py-6">
        <h1 className="text-2xl font-bold text-center mb-6">GUARDS UPDATES</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {guards.map((guard) => (
            <div
              key={guard.id}
              onClick={() => navigate(`/Admin/guard-AdminGuardUpdates2/${guard.id}`)}
              className="flex items-center gap-4 bg-white rounded-xl shadow p-4 hover:shadow-lg transition cursor-pointer"
            >
              <img
                src={guard.avatar}
                alt={guard.name}
                className="w-12 h-12 rounded-full"
              />
              <span className="font-medium">{guard.name}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default AdminGuardUpdates;
