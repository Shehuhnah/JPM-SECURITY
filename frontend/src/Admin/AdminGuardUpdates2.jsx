import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft, Clock, MapPin, User, Shield } from "lucide-react";

function AdminGuardUpdates2() {
  const { id } = useParams();
  const { token } = useAuth();
  const [guard, setGuard] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchGuardData();
    }
  }, [id]);

  const fetchGuardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch guard data
      const guardResponse = await fetch(`http://localhost:5000/api/guards/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (guardResponse.ok) {
        const guardData = await guardResponse.json();
        setGuard(guardData);
        
        // Fetch logs for this guard
        await fetchGuardLogs(id);
      } else {
        setError("Guard not found");
      }
    } catch (error) {
      console.error("Error fetching guard data:", error);
      setError("Error loading guard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuardLogs = async (guardId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/logbook?guardId=${guardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const logsData = await response.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0f172a] items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <p className="text-gray-400 mt-2">Loading guard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#0f172a] items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            to="/admin/AdminGuardUpdates"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Back to Guards
          </Link>
        </div>
      </div>
    );
  }

  if (!guard) {
    return (
      <div className="flex min-h-screen bg-[#0f172a] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Guard not found</p>
          <Link
            to="/admin/AdminGuardUpdates"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Back to Guards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 px-4 sm:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin/AdminGuardUpdates"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
          >
            <ArrowLeft size={20} />
            Back to Guards
          </Link>
        </div>

        {/* Guard Profile Card */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-blue-500 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {guard.fullName.charAt(0).toUpperCase()}
              </div>
              <span
                className={`absolute bottom-2 right-0 w-4 h-4 rounded-full border-2 border-[#1e293b] ${
                  guard.status === "Active" ? "bg-green-400" : "bg-gray-400"
                }`}
              ></span>
            </div>

            {/* Guard Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{guard.fullName}</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <User size={16} className="text-blue-400" />
                  <span>ID: {guard.guardId}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin size={16} className="text-blue-400" />
                  <span>{guard.dutyStation}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Shield size={16} className="text-blue-400" />
                  <span>{guard.position}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock size={16} className="text-blue-400" />
                  <span>{guard.shift}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    guard.status === "Active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {guard.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-blue-400" />
              Guard Logs
            </h2>
            <span className="text-sm text-gray-400">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="bg-[#0f172a] border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-blue-400">{log.type}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString()} at{" "}
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300 mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-400" />
                      <span className="font-semibold">{log.post}</span> — {log.shift}
                    </div>
                  </div>
                  
                  <p className="text-gray-100 leading-relaxed">{log.remarks}</p>
                  
                  {log.updatedAt && log.updatedAt !== log.createdAt && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Edited on {new Date(log.updatedAt).toLocaleDateString()} at{" "}
                      {new Date(log.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No log entries yet</p>
              <p className="text-gray-500 text-sm mt-2">
                This guard hasn't created any log entries.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminGuardUpdates2;
