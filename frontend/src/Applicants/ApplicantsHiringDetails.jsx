import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Briefcase, Clock, FileText, CalendarDays, Info, ChevronLeft } from "lucide-react";
const api = import.meta.env.VITE_API_URL;

export default function ApplicantsHiringDetails() {
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6 text-center text-gray-300">
        Loading job listings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6 text-center text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen text-gray-100">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-md transition hover:bg-slate-900/80"
        >
          <ChevronLeft size={16} />
          Back to Home
        </button>
      </div>
      {/* Header */}
      <header className="relative overflow-hidden border-b border-blue-500/40 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_42%),linear-gradient(180deg,#10263a_0%,#0f172a_100%)] px-4 py-12 text-center shadow-lg sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-24 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="mb-3 text-3xl font-bold tracking-wide text-white uppercase sm:text-4xl md:text-5xl">
            Join Our Team
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-300 md:text-base">
            Be part of a trusted security force dedicated to protection, professionalism,
            and excellence. Explore our latest job opportunities below.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-1 w-24 rounded-full bg-blue-500"></div>
          </div>
        </div>
      </header>

      {/* Job Listings */}
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-8 lg:py-14">
        {hirings.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-dashed border-gray-700 bg-[#1e293b]/30 px-6 py-12 text-center text-gray-400">
            No active job postings at the moment.
          </div>
        ) : (
          hirings.map((job) => (
            <div
              key={job._id}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#1e293b]/90 p-5 shadow-lg transition-all duration-300 group hover:shadow-blue-900/40 sm:p-6 lg:p-8"
            >
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-600/40 rounded-2xl transition duration-500 pointer-events-none"></div>

              <div className="mb-4 border-b border-gray-600 pb-4">
                <h2 className="mb-4 flex items-start gap-2 text-xl font-bold tracking-wide text-white sm:text-2xl">
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
                  <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line sm:text-base">
                    {job.description}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-gray-700 text-center">
                <Link to={`/job-application-process/applicants/messages?hiringId=${encodeURIComponent(job._id)}&title=${encodeURIComponent(job.title || "")}&position=${encodeURIComponent(job.position || "")}&location=${encodeURIComponent(job.location || "")}`}>
                  <button className="mb-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-400 sm:w-auto">
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
