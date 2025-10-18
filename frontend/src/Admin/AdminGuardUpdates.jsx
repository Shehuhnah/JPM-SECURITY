import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, UserCheck } from "lucide-react";

export default function AdminGuardUpdates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [guards, setGuards] = useState([
    { id: 1, name: "Vic Fuentes", avatar: "/avatars/male1.png", status: "Active", site: "SM Dasmariñas" },
    { id: 2, name: "Tony Perry", avatar: "/avatars/male2.png", status: "On Duty", site: "Vista Mall Tagaytay" },
    { id: 3, name: "Gerard N.O Way", avatar: "/avatars/male3.png", status: "Off Duty", site: "Robinsons Imus" },
    { id: 4, name: "Kellin Quinn", avatar: "/avatars/female1.png", status: "Active", site: "Ayala Mall Bacoor" },
    { id: 4, name: "Kellin Quinn", avatar: "/avatars/female1.png", status: "Active", site: "Ayala Mall Bacoor" },

  ]);

  // ✅ For future backend integration
  useEffect(() => {
    document.title = "Guards Updates | JPM Security Agency";
    // Example:
    // fetch("http://localhost:5000/api/guards")
    //   .then((res) => res.json())
    //   .then(setGuards)
    //   .catch((err) => console.error("Failed to fetch guards:", err));
  }, []);

  // ✅ Filter guards by search
  const filteredGuards = guards.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 px-4 sm:px-8 py-6">
        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Guards Updates
          </h1>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guard..."
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ===== Guards Grid ===== */}
        {filteredGuards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {filteredGuards.map((guard) => (
              <div
                key={guard.id}
                onClick={() => navigate(`/Admin/AdminGuardUpdates2/${guard.id}`)}
                className="group relative bg-[#1e293b] rounded-2xl shadow-lg p-5 flex flex-col items-center text-center hover:bg-[#243046] hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={guard.avatar}
                    alt={guard.name}
                    className="w-20 h-20 rounded-full border-2 border-blue-500 shadow-md mb-3"
                  />
                  <span
                    className={`absolute bottom-2 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1e293b] ${
                      guard.status === "Active"
                        ? "bg-green-400"
                        : guard.status === "On Duty"
                        ? "bg-yellow-400"
                        : "bg-gray-400"
                    }`}
                  ></span>
                </div>

                {/* Info */}
                <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                  {guard.name}
                </h2>
                <p className="text-sm text-gray-400 mt-1">{guard.site}</p>

                <div
                  className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                    guard.status === "Active"
                      ? "bg-green-500/20 text-green-400"
                      : guard.status === "On Duty"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {guard.status}
                </div>

                {/* Hover indicator */}
                <div className="absolute inset-0 border-2 border-transparent rounded-2xl group-hover:border-blue-500 transition-all"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-16 text-gray-400 italic">
            No guards found matching “{search}”.
          </div>
        )}

        {/* ===== Footer ===== */}
        <div className="text-center text-gray-500 text-xs mt-10">
          © {new Date().getFullYear()} JPM Security Agency — Admin Dashboard
        </div>
      </main>
    </div>
  );
}
