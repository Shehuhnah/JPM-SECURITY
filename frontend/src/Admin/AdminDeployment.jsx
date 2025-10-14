import { useState } from "react";
import Navbar from "../components/navbar";

export default function AdminDeployment() {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [currentMonth, setCurrentMonth] = useState(5); // June (0-based index)
  const [currentYear, setCurrentYear] = useState(2025);
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Get number of days in selected month/year
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handleAdd = (schedule) => {
    if (editIndex !== null) {
      const updated = [...schedules];
      updated[editIndex] = schedule;
      setSchedules(updated);
      setEditIndex(null);
    } else {
      setSchedules([...schedules, schedule]);
    }
  };

  const handleDelete = (idx) => {
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">
      {/* Content Area */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
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

          <button
            onClick={() => setShowForm(true)}
            className="bg-[#456882] text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Add Schedule
          </button>
        </div>

        {/* Month + Year Title */}
        <h2 className="text-4xl font-bold text-center">
          {months[currentMonth]} {currentYear}
        </h2>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const daySchedules = schedules.filter(
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
                      <p className="font-semibold">{s.shiftType}</p>
                      <p>{s.guardName}</p>
                      <p>{s.deploymentLocation}</p>
                      <p>
                        {new Date(s.timeIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // 24h format
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
                          onClick={() => handleDelete(idx)}
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

      {/* Popup Form Modal */}
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
                  shiftType: form.shiftType.value,
                  deploymentLocation: form.location.value,
                  timeIn: new Date(form.timeIn.value),
                  timeOut: new Date(form.timeOut.value),
                };
                handleAdd(newSchedule);
                setShowForm(false);
              }}
              className="flex flex-col gap-3 text-black"
            >
              <input
                name="guardName"
                placeholder="Guard Name"
                className="border p-2 rounded"
                required
              />
              <input
                name="location"
                placeholder="Deployment Location"
                className="border p-2 rounded"
                required
              />
              <select
                name="shiftType"
                className="border p-2 rounded"
                required
              >
                <option value="Opening">Day Shift</option>
                <option value="Closing">Night Shift</option>
              </select>
              <input
                type="datetime-local"
                name="timeIn"
                className="border p-2 rounded"
                required
              />
              <input
                type="datetime-local"
                name="timeOut"
                className="border p-2 rounded"
                required
              />
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
    </div>
  );
}
