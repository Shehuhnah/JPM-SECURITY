import React from "react";

function GuardAttendance() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <h2 className="mt-2 font-semibold text-center">
            {user?.fullName || "Guest"}
          </h2>
        </div>

        <nav>
          <ul className="space-y-2">
            <li className="font-medium">📄 Detachment / Deployment</li>
            <li className="font-medium">📢 Important Announcement</li>
            <li className="font-medium">🔄 Updates</li>
            <li className="font-medium">📑 Request COE</li>
            <li className="font-medium">📊 Attendance</li>
            <ul className="ml-4 space-y-1 text-sm text-gray-700">
              <li>Time In</li>
              <li>Time Out</li>
            </ul>
            <li className="font-medium">📝 Hirings</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-gray-200 w-60 h-60 rounded-xl flex flex-col items-center justify-center">
          <div className="w-20 h-20 border-2 border-gray-500 rounded-full flex items-center justify-center">
            👤
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="font-bold text-lg">
            {user?.fullName?.toUpperCase() || "GUARD NAME"}
          </h2>
          <p>Date: </p>
          <p>Time In: </p>
          <p>Place: </p>
        </div>

        <button className="mt-4 bg-gray-400 text-white px-6 py-2 rounded-md">
          SUBMIT
        </button>
      </main>
    </div>
  );
}

export default GuardAttendance;
