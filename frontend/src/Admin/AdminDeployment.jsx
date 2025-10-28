import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminDeployment() {
  const navigate = useNavigate();
  const { admin, token } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [clients, setClients] = useState(["All Clients"]);
  const [showClientModal, setShowClientModal] = useState(false);

  // ✅ Redirect if not logged in
  useEffect(() => {
    document.title = "Deployment | JPM Security Agency"
    if (!admin || !token) {
      navigate("/admin/login", { replace: true });
    }
  }, [admin, token, navigate]);

  // ✅ Map schedules into FullCalendar event format
  const events = schedules.map((s, idx) => ({
    id: String(idx),
    title: `${s.guardName} (${s.shiftType})`,
    start: s.timeIn,
    end: s.timeOut,
    color: s.shiftType === "Night Shift" ? "#1e3a8a" : "#3b82f6",
    extendedProps: {
      client: s.client,
      location: s.deploymentLocation,
    },
  }));

  // 📅 Add or edit event
  const handleAddSchedule = (schedule) => {
    if (editEvent !== null) {
      setSchedules((prev) =>
        prev.map((s, idx) =>
          idx === parseInt(editEvent.id) ? { ...s, ...schedule } : s
        )
      );
      setEditEvent(null);
    } else {
      setSchedules([...schedules, schedule]);
    }
    setShowForm(false);
  };

  // 🗑️ Delete
  const handleDeleteSchedule = (id) => {
    setSchedules((prev) => prev.filter((_, i) => i !== parseInt(id)));
  };

  // 🎯 Drag & Drop
  const handleEventDrop = (info) => {
    const updated = schedules.map((s, i) =>
      i === parseInt(info.event.id)
        ? {
            ...s,
            timeIn: info.event.start.toISOString(),
            timeOut: info.event.end?.toISOString() || s.timeOut,
          }
        : s
    );
    setSchedules(updated);
  };

  // 📏 Resize Event
  const handleEventResize = (info) => {
    const updated = schedules.map((s, i) =>
      i === parseInt(info.event.id)
        ? { ...s, timeOut: info.event.end.toISOString() }
        : s
    );
    setSchedules(updated);
  };

  // 🧠 Add new client
  const handleAddClient = (newClient) => {
    if (!clients.includes(newClient)) {
      setClients([...clients, newClient]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">
          🗓️ Deployment Schedule
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => setShowClientModal(true)}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            + Add Client
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            + Add Schedule
          </button>
        </div>
      </header>

      {/* Calendar */}
      <div className="bg-[#1e293b] p-4 rounded-xl shadow-lg">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="85vh"
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          selectable={true}
          select={(info) => {
            setSelectedDate(info.startStr);
            setShowForm(true);
          }}
          eventClick={(info) => {
            setEditEvent(info.event);
            setShowForm(true);
          }}
          events={events}
          eventContent={(eventInfo) => (
            <div className="text-xs">
              <b>{eventInfo.event.title}</b>
              <p className="text-gray-300">
                {eventInfo.event.extendedProps.client}
              </p>
            </div>
          )}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
        />
      </div>

      {/* Schedule Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white text-black p-6 rounded-lg w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">
              {editEvent ? "Edit Schedule" : "Add Schedule"}
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
                  timeIn: form.timeIn.value,
                  timeOut: form.timeOut.value,
                };
                handleAddSchedule(newSchedule);
              }}
              className="flex flex-col gap-3"
            >
              <input
                name="guardName"
                placeholder="Guard Name"
                className="border p-2 rounded"
                defaultValue={editEvent?.title?.split("(")[0]?.trim() || ""}
                required
              />
              <input
                name="location"
                placeholder="Deployment Location"
                className="border p-2 rounded"
                required
              />
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

              <div className="flex justify-between mt-4">
                {editEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteSchedule(editEvent.id);
                      setShowForm(false);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditEvent(null);
                    }}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
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
              <input
                name="clientName"
                placeholder="Client Name"
                className="border p-2 rounded"
                required
              />
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
