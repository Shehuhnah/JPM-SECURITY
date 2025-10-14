import React, { useState, useEffect } from "react";

export default function GuardReqCOE() {
  const [purpose, setPurpose] = useState("");
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {
    name: "John Doe",
    id: "12345",
  };

  // Load existing requests
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("coeRequests")) || [];
    setRequests(saved);
  }, []);

  // Save new requests
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!purpose.trim()) {
      setMessage("Please enter the purpose of your request.");
      return;
    }

    const newRequest = {
      id: Date.now(),
      guardName: user.name,
      guardId: user.id,
      purpose,
      status: "Pending",
      requestedAt: new Date().toLocaleString(),
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);
    localStorage.setItem("coeRequests", JSON.stringify(updatedRequests));

    setPurpose("");
    setMessage("Your COE request has been sent!");
    setTimeout(() => setMessage(""), 2500);
  };

  return (
    <div className="min-h-screen bg-[#1B3C53] flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Certificate of Employment Request
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Purpose
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Example: For loan application"
              rows="3"
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gray-700 hover:bg-[#456882] text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            Submit Request
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-green-600 font-medium">
            {message}
          </p>
        )}
      </div>

      {/* List of Requests */}
      <div className="w-full max-w-3xl mt-8">
        <h2 className="text-xl font-semibold mb-3 text-white">
          Your Previous Requests
        </h2>

        {requests.length === 0 ? (
          <p className="text-white text-center">
            No COE requests yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border bg-gray-300 border-gray-200 text-sm">
              <thead className="bg-gray-700 text-white">
                <tr>
                  <th className="p-2 text-left">Purpose</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="bg-white border-gray-200  hover:bg-gray-200"
                  >
                    <td className="p-2">{r.purpose}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2">{r.requestedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
