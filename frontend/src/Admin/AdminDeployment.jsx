import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminDeployment() {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState(["All Clients"]); // default client list
  const [selectedClient, setSelectedClient] = useState("All Clients");
  const [showForm, setShowForm] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const { admin, token } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirect guard (no infinite loop)
  useEffect(() => {
    if (!admin || !token) {
      navigate("/admin/Login", { replace: true });
    }
  }, [admin, token, navigate]);

  // 📅 Calculate days in selected month/year
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handleAddSchedule = (schedule) => {
    if (editIndex !== null) {
      const updated = [...schedules];
      updated[editIndex] = schedule;
      setSchedules(updated);
      setEditIndex(null);
    } else {
      setSchedules([...schedules, schedule]);
    }
  };

  const handleDeleteSchedule = (idx) => {
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  const handleAddClient = (newClient) => {
    if (!clients.includes(newClient)) {
      setClients([...clients, newClient]);
    }
  };

  // 🔍 Filter schedules by selected client
  const filteredSchedules =
    selectedClient === "All Clients"
      ? schedules
      : schedules.filter((s) => s.client === selectedClient);

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Month & Year Selector */}
          <div className="flex items-center gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="border rounded-md p-2 bg-gray-900 text-white"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="border rounded-md p-2 w-24 bg-gray-900 text-white"
            />
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="border rounded-md p-2 bg-gray-900 text-white"
            >
              {clients.map((client, i) => (
                <option key={i} value={client}>
                  {client}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowClientModal(true)}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
            >
              + Add Client
            </button>
          </div>

          {/* Add Schedule */}
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#456882] text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            + Add Schedule
          </button>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center">
          {months[currentMonth]} {currentYear}
        </h2>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const daySchedules = filteredSchedules.filter(
              (s) =>
                new Date(s.timeIn).getDate() === day &&
                new Date(s.timeIn).getMonth() === currentMonth &&
                new Date(s.timeIn).getFullYear() === currentYear
            );

            return (
              <div
                key={day}
                className="border rounded-md p-2 h-48 flex flex-col bg-white text-black"
              >
                <div className="font-bold text-sm mb-1">{day}</div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {daySchedules.map((s, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-gray-100 p-2 rounded border relative group"
                    >
                      <p className="font-semibold">{s.guardName}</p>
                      <p>{s.deploymentLocation}</p>
                      <p className="italic text-gray-500">{s.client}</p>
                      <p>
                        {new Date(s.timeIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" "}
                        -{" "}
                        {new Date(s.timeOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </p>

                      {/* Edit/Delete */}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setEditIndex(idx);
                            setShowForm(true);
                          }}
                          className="bg-yellow-400 text-xs px-2 py-1 rounded hover:bg-yellow-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(idx)}
                          className="bg-red-500 text-xs px-2 py-1 rounded hover:bg-red-600"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-black">
              {editIndex !== null ? "Edit Schedule" : "Add Schedule"}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const newSchedule = {
                  guardName: form.guardName.value,
                  deploymentLocation: form.location.value,
                  client: form.client.value,
                  shiftType: form.shiftType.value,
                  timeIn: new Date(form.timeIn.value),
                  timeOut: new Date(form.timeOut.value),
                };
                handleAddSchedule(newSchedule);
                setShowForm(false);
              }}
              className="flex flex-col gap-3 text-black"
            >
              <input name="guardName" placeholder="Guard Name" className="border p-2 rounded" required />
              <input name="location" placeholder="Deployment Location" className="border p-2 rounded" required />
              <select name="client" className="border p-2 rounded" required>
                {clients.map((client, i) => (
                  <option key={i} value={client}>
                    {client}
                  </option>
                ))}
              </select>
              <select name="shiftType" className="border p-2 rounded" required>
                <option value="Day Shift">Day Shift</option>
                <option value="Night Shift">Night Shift</option>
              </select>
              <input type="datetime-local" name="timeIn" className="border p-2 rounded" required />
              <input type="datetime-local" name="timeOut" className="border p-2 rounded" required />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditIndex(null);
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#456882] text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-lg text-black">
            <h3 className="text-lg font-bold mb-4">Add New Client</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddClient(e.target.clientName.value);
                e.target.reset();
                setShowClientModal(false);
              }}
              className="flex flex-col gap-3"
            >
              <input name="clientName" placeholder="Client Name" className="border p-2 rounded" required />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
