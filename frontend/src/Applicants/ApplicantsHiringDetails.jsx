import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, Clock, FileText, CalendarDays, Info } from "lucide-react";
const api = import.meta.env.VITE_API_URL;

export default function ApplicantsHiringDetails() {
  const [hirings, setHirings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHirings = async () => {
      try {
        const res = await fetch(`${api}/api/hirings`);
        if (!res.ok) throw new Error("Failed to fetch hiring posts");
        const data = await res.json();
        setHirings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHirings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-gray-300">
        Loading job listings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen text-gray-100">
      {/* Header */}
      <header className="bg-[#10263a] py-16 text-center border-b border-blue-500/40 shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-wide uppercase">
          Join Our Team
        </h1>
        <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
          Be part of a trusted security force dedicated to protection, professionalism,
          and excellence. Explore our latest job opportunities below.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="w-24 h-1 bg-blue-500 rounded-full"></div>
        </div>
      </header>

      {/* Job Listings */}
      <main className="max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-2 gap-10">
        {hirings.length === 0 ? (
          <p className="text-center col-span-2 text-gray-400">
            No active job postings at the moment.
          </p>
        ) : (
          hirings.map((job) => (
            <div
              key={job._id}
              className="relative bg-[#1e293b]/90 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-lg hover:shadow-blue-900/40 transition-all duration-300 p-8 flex flex-col group overflow-hidden"
            >
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-600/40 rounded-2xl transition duration-500 pointer-events-none"></div>

              <div className="border-b border-gray-600 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-white mb-4 tracking-wide flex items-center gap-2">
                  <Info className="w-6 h-6 text-blue-400" />
                  {job.title}
                </h2>

                <div className="space-y-2 text-sm text-gray-300">
                  <p className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-blue-400">Position:</span> {job.position}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-blue-400">Location:</span> {job.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-blue-400">Employment:</span> {job.employmentType}
                  </p>
                </div>
              </div>

              {/* Job Description */}
              {job.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Description
                  </h3>
                  <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {job.description}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-gray-700 text-center">
                <Link to={`/job-application-process/applicants/messages?hiringId=${encodeURIComponent(job._id)}&title=${encodeURIComponent(job.title || "")}&position=${encodeURIComponent(job.position || "")}&location=${encodeURIComponent(job.location || "")}`}>
                  <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-6 py-2 rounded-md transition-transform transform hover:-translate-y-0.5 shadow-md mb-2">
                    Apply Now
                  </button>
                </Link>
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  Posted on{" "}
                  {new Date(job.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#10263a] py-8 text-center border-t border-gray-800">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} JPM Security Agency — Protecting Lives and Property with Integrity.
        </p>
      </footer>
    </div>
  );
}
