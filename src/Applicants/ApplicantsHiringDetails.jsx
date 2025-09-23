
import React from "react";
import ApplicantsLayout from "../Layouts/ApplicantsLayout";
import Navbar from "../Applicants/ApplicantsLayout";

const ApplicantsHiringDetails = () => {
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
        number: "0992 372 8671",
        email: "jpmsecagency@gmail.com",
      },
    },

  ];

  return (
    <ApplicantsLayout>
      {/*Header */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <ApplicantsLayout />
        <h1 className="text-center text-2xl font-bold py-4">HIRINGS</h1>
      </header>

      {}
      <main className="flex min-h-screen bg-[#0f172a]">
        {hirings.map((job) => (
          <div
            key={job.id}
            className="bg-gray-100 p-6 rounded-lg shadow mb-6"
          >
            <h2 className="font-bold text-lg mb-2">{job.title}</h2>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Position:</strong> {job.position}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Location:</strong> {job.location}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Employment Type:</strong> {job.employment}
            </p>

            <div className="mt-4">
              <h3 className="font-semibold">Qualifications:</h3>
              <ul className="list-disc ml-6 text-sm">
                {job.qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold">Requirements:</h3>
              <ul className="list-disc ml-6 text-sm">
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 text-sm">
              <h3 className="font-semibold">How to Apply:</h3>
              <p>Send us a message directly in this system or contact:</p>
              <p>
                <strong>Number:</strong> {job.contact.number}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href={`mailto:${job.contact.email}`}
                  className="text-blue-600 underline"
                >
                  {job.contact.email}
                </a>
              </p>
            </div>
          </div>
        ))}
      </main>
    </ApplicantsLayout>
  );
};

export default ApplicantsHiringDetails;
