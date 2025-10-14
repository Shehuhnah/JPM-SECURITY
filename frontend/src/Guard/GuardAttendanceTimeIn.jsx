import { Link } from "react-router-dom";

function GuardAttendanceTimeIn() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  return (
    <div className="flex min-h-screen bg-[#0f172a] items-center justify-center p-4 ">
      {/* Card Container */}
      <div className="bg-gradient-to-br from-white to-gray-100 shadow-xl rounded-2xl w-full max-w-md p-8 flex flex-col items-center">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#A1C2BD] to-[#708993] flex items-center justify-center shadow-md mb-6 text-4xl">
          👤
        </div>

        {/* User Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {user?.fullName?.toUpperCase() || "GUARD NAME"}
          </h2>
          <div className="text-gray-600 space-y-1">
            <p>
              <span className="font-medium text-gray-700">Date:</span> —
            </p>
            <p>
              <span className="font-medium text-gray-700">Time In:</span> —
            </p>
            <p>
              <span className="font-medium text-gray-700">Place:</span> —
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Link
          to="/Guard/GuardAttendanceTimeOut"
          className="w-full bg-[#1B3C53] hover:bg-[#456882] font-bold transition-colors text-white font-semibold py-3 rounded-xl shadow-lg text-center"
        >
          SUBMIT
        </Link>
      </div>
    </div>
  );
}

export default GuardAttendanceTimeIn;
