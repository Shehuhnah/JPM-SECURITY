import { useEffect, useState } from "react";
import {
  ShieldUser,
  CalendarClock,
  Megaphone,
  FileText,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
const api = import.meta.env.VITE_API_URL;

export default function GuardAnnouncement() {
  const {user: guard, loading} = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [viewedIds, setViewedIds] = useState([]);

  // Load viewed announcements from localStorage
  useEffect(() => {
    if (guard?._id) {
      const stored = localStorage.getItem(`viewedAnnouncements_${guard._id}`);
      if (stored) {
        try {
          setViewedIds(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing viewed announcements", e);
        }
      }
    }
  }, [guard]);

  const markAsRead = (id) => {
    const updated = [...viewedIds, id];
    setViewedIds(updated);
    if (guard?._id) {
      localStorage.setItem(`viewedAnnouncements_${guard._id}`, JSON.stringify(updated));
    }
  };

  const isNewAnnouncement = (createdAt) => {
    const today = new Date();
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 7; // Announcement is new if created within the last 7 days
  };

  useEffect(() => {
    document.title = "Guard Announcement | JPM Security Agency";
     if (!guard && !loading) {
        navigate("/guard/Login");
        return;
      }
  }, [guard, navigate]);

  // Fetch announcements from backend
  useEffect(() => {
    document.title = "Announcement | JPM Agency Security";

    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${api}/api/posts` ,{
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch announcements");
        const data = await res.json();
        setAnnouncements(data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Format date & time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-gray-100">
      {/* Header */}
      <header className="sticky top-0 bg-[#1B3C53]/90 backdrop-blur-md shadow-md border-b border-blue-900 z-20">
        <div className="flex items-center justify-center py-5 space-x-3">
          <Megaphone className="text-blue-400 w-6 h-6 animate-pulse" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white uppercase">
            Guard Announcements
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-400" />
              <p>Loading announcements...</p>
            </div>
          ) : announcements.length > 0 ? (
            announcements.map((a) => (
              <div
                key={a._id}
                className={`relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] border ${
                  !viewedIds.includes(a._id) && isNewAnnouncement(a.createdAt)
                    ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "border-gray-700"
                } rounded-2xl shadow-lg p-6 sm:p-8 hover:border-blue-600/60 hover:shadow-blue-500/20 transition duration-300 group`}
              >
                {/* NEW Badge */}
                {!viewedIds.includes(a._id) && isNewAnnouncement(a.createdAt) && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1 z-10">
                    <Megaphone size={12} /> NEW
                  </div>
                )}
                
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-gray-700 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-600/10 border border-blue-600/30 rounded-full group-hover:scale-105 transition-transform">
                      <ShieldUser className="text-blue-400 w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white flex items-center gap-2">
                        {a.author?.name || a.author || "ADMIN"}
                      </h2>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3 text-gray-400" />
                        {formatDate(a.createdAt)} • {formatTime(a.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600/10 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-700/30">
                    <FileText size={14} />
                    Announcement
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-1 tracking-wide">
                  {a.title || "Untitled"}
                </h3>

                {/* Subject */}
                <p className="text-sm text-gray-300 italic mb-3">
                  <span className="font-semibold text-gray-400">Subject:</span>{" "}
                  {a.subject || "No subject"}
                </p>

                {/* Body */}
                <p className="text-gray-100 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {a.body || "No announcement details available."}
                </p>

                {/* Footer */}
                <div className="mt-5 border-t border-gray-700 pt-3 text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <span className="italic text-center sm:text-left">📢 JPM Security Agency — “Duty. Discipline. Integrity.”</span>
                  {!viewedIds.includes(a._id) && isNewAnnouncement(a.createdAt) && (
                    <button
                      onClick={() => markAsRead(a._id)}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md"
                    >
                      <CheckCircle size={14} /> Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 italic mt-10">
              No announcements available.
            </p>
          )}
        </div>
      </main>

      {/* MODAL HERE */}

    </div>
  );
}
