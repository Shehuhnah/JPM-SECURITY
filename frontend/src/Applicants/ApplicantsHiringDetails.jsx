
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
    {
      id: 2,
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
    {
      id: 3,
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
    {
      id: 4,
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
    <>
      <header className="text-center text-2xl font-bold py-4 bg-gray-700 text-white">HIRINGS</header>
      <main className="grid bg-[#0f172a] 2xl:grid-cols-2 gap-6 p-6">
        {hirings.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 flex flex-col"
          >
            {/* Header */}
            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
              <p className="text-sm text-gray-800 mt-1">
                <span className="font-medium">Position:</span>{" "}
                <span className="underline">{job.position}</span>
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-medium">Location:</span>{" "}
                <span className="underline">{job.location}</span>
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-medium">Employment:</span>{" "}
                <span className="underline">{job.employment}</span>
              </p>
            </div>

            {/* Qualifications */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">✅ Qualifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {job.qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">📌 Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="mt-auto pt-4 border-t">
              <h3 className="font-semibold text-gray-800 mb-2">📩 How to Apply</h3>
              <p className="text-sm text-gray-600 mb-1">
                Send us a message directly in this system or contact:
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">📞 Number:</span> {job.contact.number}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">✉️ Email:</span>{" "}
                <a
                  href={`mailto:${job.contact.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {job.contact.email}
                </a>
              </p>
            </div>
          </div>
        ))}
      </main>
    </>
  );
};

export default ApplicantsHiringDetails;
