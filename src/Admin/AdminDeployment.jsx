import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";

export default function AdminDeployment() {
  const [guards, setGuards] = useState([]);
  const [newGuard, setNewGuard] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTimeOut, setNewTimeOut] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const DEFAULT_TIME_IN = "08:00"; // fixed detachment time (time in)

  const handleAddGuard = () => {
    if (!newGuard) {
      alert("Please enter a guard's name!");
      return;
    }
    setGuards([...guards, { id: Date.now(), name: newGuard, deployments: [] }]);
    setNewGuard("");
  };

  const handleAddDeployment = (guardId) => {
    if (!newDate || !newLocation || !newTimeOut) {
      alert("Please enter date, time out, and location!");
      return;
    }

    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              deployments: [
                ...g.deployments,
                {
                  id: Date.now(),
                  date: newDate,
                  timeIn: DEFAULT_TIME_IN, // auto-fill
                  timeOut: newTimeOut,
                  location: newLocation,
                },
              ],
            }
          : g
      )
    );

    setNewDate("");
    setNewTimeOut("");
    setNewLocation("");
  };

  return (
    <div className="min-h-screen bg-center bg-repeat text-white flex itemsjustify-center"
    style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: "#111",
        backgroundSize: "40px 40px",
      }}>
      <Navbar />

      <main className="flex-1 min-h-screen text-white px-8 py-6 bg-gray-900">
        <h2 className="text-2xl font-bold mb-6">Admin Deployment</h2>

        {/* Add Guard */}
        <div className="p-4 border border-gray-600 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Add Guard</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Guard Name"
              value={newGuard}
              onChange={(e) => setNewGuard(e.target.value)}
              className="border rounded px-4 py-2 flex-1 bg-transparent text-white placeholder-gray-300"
            />
            <button
              onClick={handleAddGuard}
              className="bg-black hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow"
            >
              + Add Guard
            </button>
          </div>
        </div>

        {/* Guards List */}
        {guards.length === 0 ? (
          <p className="text-gray-400 italic">No guards added yet.</p>
        ) : (
          <div className="space-y-4">
            {guards.map((g) => (
              <div
                key={g.id}
                className="p-4 border border-gray-600 rounded-lg bg-gray-800"
              >
                <div className="flex justify-between items-center mb-3">
                  <Link
                    to={`/guard/${g.id}`}
                    className="text-blue-400 hover:underline text-lg font-semibold"
                  >
                    {g.name}
                  </Link>
                  <span className="text-sm text-gray-400">
                    {g.deployments.length} deployment(s)
                  </span>
                </div>

                {/* Add Deployment for this Guard */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="border rounded px-4 py-2 flex-1 bg-transparent text-white"
                    />
                    
                    {/* THIS IS THE TIMEOUT FIELD */}
                    <input
                      type="time"
                      value={newTimeOut}           // state variable for deployment time
                      onChange={(e) => setNewTimeOut(e.target.value)}
                      className="border rounded px-4 py-2 flex-1 bg-transparent text-white"
                      placeholder="Time Out"
                    />
                    
                    <input
                      type="text"
                      placeholder="Deployment Location"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="border rounded px-4 py-2 flex-1 bg-transparent text-white placeholder-gray-300"
                    />
                    <button
                      onClick={() => handleAddDeployment(g.id)}
                      className="bg-black hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow"
                    >
                      + Add
                    </button>
                  </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
