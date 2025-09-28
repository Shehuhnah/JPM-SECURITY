import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/navbar";

function AdminGuardUpdates2() {
  const { id } = useParams();
  const [guard, setGuard] = useState(null);

  useEffect(() => {
    // Mock data for now
    const guards = [
      { id: 1, name: "Vic Fuentes", avatar: "/avatars/male1.png", details: "On duty at Gate 1" },
      { id: 2, name: "Tony Perry", avatar: "/avatars/male2.png", details: "Night shift, Lobby" },
      { id: 3, name: "Gerard N.O Way", avatar: "/avatars/male3.png", details: "On leave today" },
      { id: 4, name: "Kellin Quinn", avatar: "/avatars/female1.png", details: "Assigned at Parking Area" },
    ];
    const selected = guards.find((g) => g.id === parseInt(id));
    setGuard(selected || null);
  }, [id]);

  if (!guard) {
    return <p className="p-6">Guard not found.</p>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 px-6 py-6">
        <Link
          to="/admin/guard-updates"
          className="inline-block mb-4 text-blue-600 hover:underline"
        >
          ← Back to Guard Updates
        </Link>

        <div className="bg-white rounded-xl shadow p-6 max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={guard.avatar}
              alt={guard.name}
              className="w-16 h-16 rounded-full"
            />
            <h2 className="text-xl font-bold">{guard.name}</h2>
          </div>

          <p className="text-gray-700">{guard.details}</p>
        </div>
      </main>
    </div>
  );
}

export default AdminGuardUpdates2;
