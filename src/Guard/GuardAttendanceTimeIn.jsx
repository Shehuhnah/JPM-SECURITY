
function GuardAttendanceTimeIn() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  return (
    <div className="flex min-h-screen">
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

export default GuardAttendanceTimeIn;
