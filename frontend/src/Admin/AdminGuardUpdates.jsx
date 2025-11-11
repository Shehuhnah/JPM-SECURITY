import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, UserCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AdminGuardUpdates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { user, token } = useAuth();

  // Load guards from backend
  useEffect(() => {
    document.title = "Guards Updates | JPM Security Agency";
    fetchGuards();
  }, []);

  // Fetch guards from backend
  const fetchGuards = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("http://localhost:5000/api/guards", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGuards(data);
      } else {
        setError("Failed to load guards");
      }
    } catch (error) {
      console.error("Error fetching guards:", error);
      setError("Error loading guards");
    } finally {
      setLoading(false);
    }
  };

  // Filter guards by search
  const filteredGuards = guards.filter((g) =>
    g.fullName.toLowerCase().includes(search.toLowerCase()) ||
    g.guardId.toLowerCase().includes(search.toLowerCase()) ||
    g.dutyStation.toLowerCase().includes(search.toLowerCase())
  );

  

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 px-4 sm:px-8 py-6">
        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-2">
            <Shield className=" text-blue-400" size={30}/>
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

        {/* ===== Loading State ===== */}
        {loading ? (
          <div className="text-center mt-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-gray-400 mt-2">Loading guards...</p>
          </div>
        ) : error ? (
          <div className="text-center mt-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchGuards}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* ===== Guards Grid ===== */
          filteredGuards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {filteredGuards.map((guard) => (
                <div
                  key={guard._id}
                  onClick={() => navigate(`/admin/AdminGuardUpdates2/${guard._id}`)}
                  className="group relative bg-[#1e293b] rounded-2xl shadow-lg p-5 flex flex-col items-center text-center hover:bg-[#243046] hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-blue-500 shadow-md mb-3 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {guard.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-2 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1e293b] ${
                        guard.status === "Active"
                          ? "bg-green-400"
                          : "bg-gray-400"
                      }`}
                    ></span>
                  </div>

                  {/* Info */}
                  <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                    {guard.fullName}
                  </h2>
                  <p className="text-xs text-gray-500 mb-1">ID: {guard.guardId}</p>
                  <p className="text-sm text-gray-400 mt-1">{guard.dutyStation}</p>
                  <p className="text-xs text-gray-500">{guard.position}</p>

                  <div
                    className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      guard.status === "Active"
                        ? "bg-green-500/20 text-green-400"
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
              {search ? `No guards found matching "${search}".` : "No guards found."}
            </div>
          )
        )}

        {/* ===== Footer ===== */}
        <div className="text-center text-gray-500 text-xs mt-10">
          © {new Date().getFullYear()} JPM Security Agency — Admin Dashboard
        </div>
      </main>
    </div>
  );
}
