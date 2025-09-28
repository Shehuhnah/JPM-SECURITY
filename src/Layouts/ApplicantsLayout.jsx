import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

import logo from "../assets/jpmlogo.png"; 

export default function ApplicantsLayout() {
  const [openAttendance, setOpenAttendance] = useState(false);

  return (
    <div className="flex min-h-screen  bg-[#0f172a]">
      <aside className="w-64 bg-white shadow-md flex flex-col items-center">
       <div className="flex items-center justify-center py-6 border-b px-4">
               <Link to="/">
                  <img src={logo} alt="logo" className="w-12 h-12" />
              </Link>
               <span className="font-bold text-gray-800 text-lg text-center">
                 JPM SECURITY AGENCY
               </span>
             </div>
       

        {/* Profile (temporary icon) */}
        <div className="flex flex-col items-center mt-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl">
            👤
          </div>
          <h3 className="font-medium text-gray-700 mt-2">Applicants Name</h3>
          <p className="text-xs text-gray-500">Applicant</p>
        </div>

        {/* Navigation */}
        <nav className="w-full flex-1 px-6 space-y-2 text-gray-700">
          <Link
            to="Applicants/ApplicantsHiringDetails"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Hiring Details
          </Link>

          <Link
            to="Apicants/ApplicantsCompanyDetails"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Company Details
          </Link>

          <Link
            to="Applicants/ApplicantsMessages"
            className="block p-2 rounded hover:bg-gray-100 font-medium"
          >
            Messages
          </Link>

          <button className="w-full text-left p-2 rounded hover:bg-gray-100 font-medium">
            <Link to="/">Logout</Link>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
