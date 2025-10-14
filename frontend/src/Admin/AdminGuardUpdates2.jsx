import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/navbar";

function AdminGuardUpdates2() {
  const { id } = useParams();
  const [guard, setGuard] = useState(null);
  const [editHistory, setEditHistory] = useState([]);

  useEffect(() => {
    // Mock guard data
    const guards = [
      { 
        id: 1, 
        name: "Vic Fuentes", 
        avatar: "/avatars/male1.png", 
        details: "On duty at Gate 1",
        dateAdded: "2025-10-01 09:45 AM",
        dateEdited: "2025-10-05 04:15 PM",
        history: ["2025-10-03 02:00 PM", "2025-10-05 04:15 PM"]
      },
      { 
        id: 2, 
        name: "Tony Perry", 
        avatar: "/avatars/male2.png", 
        details: "Night shift, Lobby",
        dateAdded: "2025-09-29 08:00 PM",
        dateEdited: null,
        history: []
      },
      { 
        id: 3, 
        name: "Gerard N.O Way", 
        avatar: "/avatars/male3.png", 
        details: "On leave today",
        dateAdded: "2025-09-30 11:30 AM",
        dateEdited: null,
        history: []
      },
      { 
        id: 4, 
        name: "Kellin Quinn", 
        avatar: "/avatars/female1.png", 
        details: "Assigned at Parking Area",
        dateAdded: "2025-10-02 02:00 PM",
        dateEdited: "2025-10-07 01:20 PM",
        history: ["2025-10-05 05:10 PM", "2025-10-07 01:20 PM"]
      },
    ];

    const selected = guards.find((g) => g.id === parseInt(id));
    setGuard(selected || null);
    setEditHistory(selected?.history || []);
  }, [id]);

  if (!guard) {
    return <p className="p-6">Guard not found.</p>;
  }

  return (
    <div className="flex min-h-screen  bg-[#0f172a]">
      <main className="flex-1 px-6 py-6">
        <Link
          to="/admin/AdminGuardUpdates"
          className="inline-block mb-4 text-white hover:underline"
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

          <p className="text-gray-700 mb-3">{guard.details}</p>

          <div className="text-sm text-gray-500 mb-4">
            {guard.dateEdited ? (
              <p>🕒 Last edited on <span className="font-medium">{guard.dateEdited}</span></p>
            ) : (
              <p>📅 Added on <span className="font-medium">{guard.dateAdded}</span></p>
            )}
          </div>

          {/* ✅ Edit History Section (Read-only for admin) */}
          {editHistory.length > 0 ? (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Edit History (by Guard)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {editHistory.map((date, index) => (
                  <li key={index}>• {date}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 border-t pt-4 text-sm text-gray-500">
              No edits have been made by this guard yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminGuardUpdates2;
