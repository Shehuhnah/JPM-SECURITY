import { useState } from "react";
import { FaUsers, FaUser, FaUserShield, FaRegAddressCard } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function MainPage() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleAdminAccess = () => {
    if (code === "1234") {
      navigate("/Admin/AdminDeployment"); 
    } else {
      alert("Invalid code. Try again!");
    }
  };

  return (
    <div>
      <div
        className="min-h-screen bg-center bg-repeat text-white flex items-center justify-center px-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: "#111",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="flex min-h-screen justify-center items-center">
          <main>
            <h1 className="text-2xl font-bold text-center">JPM SECURITY AGENCY</h1>
            <p className="text-lg text-center">What type of user are you?</p>

            <div className="fixed-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols- gap-7 text-center mt-10">
              {/* Guard */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center">
                <FaUsers className="text-5xl text-black mb-2 text-center" />
                <h2 className="text-lg font-semibold mb-2 text-black">Guard</h2>
                <button className="bg-black hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-full text-base transition-all duration-300 w-full md:w-auto">
                  <Link to="/Guard/GuardLogin"> Click this</Link>
                </button>
              </div>

              {/* Sub-Admin */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center">
                <FaUser className="text-5xl text-black mb-2" />
                <h2 className="text-lg font-semibold mb-2 text-black">Sub-Admin</h2>
                <button className="bg-black hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-full text-base transition-all duration-300 w-full md:w-auto">
                  <Link to="/components/SubDashboard"> Click this</Link>
                </button>
              </div>

              {/* Applicant */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center">
                <FaRegAddressCard className="text-5xl text-black mb-2" />
                <h2 className="text-lg font-semibold mb-2 text-black">Applicant</h2>
                <button className="bg-black hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-full text-base transition-all duration-300 w-full md:w-auto">
                  <Link to="/Applicants/ApplicantsHiringDetails"> Click this</Link>
                </button>
              </div>

              {/* Admin with passcode */}
              <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center">
                <FaUserShield className="text-5xl text-black mb-2" />
                <h2 className="text-lg font-semibold mb-2 text-black">Admin</h2>
                <input
                  type="text"
                  placeholder="Enter Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border border-black rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                />
                <button
                  onClick={handleAdminAccess}
                  className="bg-black hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-full text-base transition-all duration-300 w-full md:w-auto mt-2"
                >
                  Enter
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
