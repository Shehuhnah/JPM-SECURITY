import { Link } from "react-router-dom";
export default function ApplicantsHiringDetails() {
  const hirings = [
    {
      id: 1,
      title: "WE’RE HIRING! – JPM SECURITY AGENCY",
      position: "Security Guard",
      location: "Various client sites across Cavite",
      employment: "Full-Time / Reliever / Night Shift / Day Shift",
      qualifications: [
        "Male or Female, 21 – 45 years old",
        "At least High School Graduate",
        "With valid Security License (License/ID)",
        "Physically and mentally fit",
        "With good moral character and no criminal record",
        "Willing to undergo training if required",
        "Previous experience is an advantage but not required",
      ],
      requirements: [
        "Updated Resume / Bio-data",
        "Valid Security License / Certificate of Training",
        "Barangay Clearance",
        "Police or NBI Clearance",
        "Medical Certificate",
        "2x2 ID Picture (2 copies)",
        "Any valid government-issued ID",
      ],
      contact: {
        number: "09368835488 / 09923728671",
        email: "jpmsecagency@gmail.com",
      },
    },
    // Add more openings as needed
  ];

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
        {hirings.map((job) => (
          <div
            key={job.id}
            className="relative bg-[#1e293b]/90 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-lg hover:shadow-blue-900/40 transition-all duration-300 p-8 flex flex-col group overflow-hidden"
          >
            {/* Subtle Accent Border on Hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-600/40 rounded-2xl transition duration-500 pointer-events-none"></div>

            {/* Job Header */}
            <div className="border-b border-gray-600 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                {job.title}
              </h2>
              <div className="space-y-1 text-sm text-gray-300">
                <p>
                  <span className="font-medium text-blue-400">Position:</span>{" "}
                  {job.position}
                </p>
                <p>
                  <span className="font-medium text-blue-400">Location:</span>{" "}
                  {job.location}
                </p>
                <p>
                  <span className="font-medium text-blue-400">Employment:</span>{" "}
                  {job.employment}
                </p>
              </div>
            </div>

            {/* Qualifications */}
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="block w-1.5 h-5 bg-blue-500 rounded"></span>
                Qualifications
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 leading-relaxed">
                {job.qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="block w-1.5 h-5 bg-blue-500 rounded"></span>
                Requirements
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 leading-relaxed">
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Contact & Apply */}
            <div className="mt-auto pt-6 border-t border-gray-700 text-center">
              <Link to="/job-application-process/applicants/messages">
                <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-6 py-2 rounded-md transition-transform transform hover:-translate-y-0.5 shadow-md mb-2">
                  Apply Now
                </button>
              </Link>
              
              <p className="text-xs text-gray-400">or reach us directly:</p>
              <p className="text-sm mt-1 text-gray-300">
                <span className="text-blue-400 font-medium">📞</span>{" "}
                {job.contact.number}
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-blue-400 font-medium">✉️</span>{" "}
                <a
                  href={`mailto:${job.contact.email}`}
                  className="hover:text-blue-400 underline transition"
                >
                  {job.contact.email}
                </a>
              </p>
            </div>
          </div>
        ))}
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
