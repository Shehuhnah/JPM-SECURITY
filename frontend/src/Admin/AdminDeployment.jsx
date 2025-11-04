import { useState, useEffect, Fragment } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, Transition } from "@headlessui/react";
import { Shield, Building2  } from "lucide-react";
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
  const clientColors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"
  ];

  useEffect(() => {
    document.title = "Deployment | JPM Security Agency";
    if (!admin || !token) navigate("/admin/login", { replace: true });
  }, [admin, token, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesRes, clientsRes] = await Promise.all([
          fetch("http://localhost:5000/api/schedules/get-schedules", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/clients/get-clients", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!schedulesRes.ok || !clientsRes.ok)
          throw new Error("Failed to fetch schedules or clients");

        const [schedulesData, clientsData] = await Promise.all([
          schedulesRes.json(),
          clientsRes.json(),
        ]);

        setSchedules(schedulesData);
        setClients(clientsData.map((c) => c.clientName)); // store only client names
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (token) fetchData();
  }, [token]);


  const events = schedules.map((s, idx) => ({
    id: String(idx),
    title: `${s.guardName} (${s.shiftType})`,
    start: s.timeIn,
    end: s.timeOut,
    color: clientColors[s.client.charCodeAt(0) % clientColors.length],
    extendedProps: {
      client: s.client,
      location: s.deploymentLocation,
    },
  }));


  const handleAddClient = async (newClient) => {
    try {
      const res = await fetch("http://localhost:5000/api/clients/create-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add client");

      console.log("✅ Client created:", data.client);
      setClients((prev) => [...prev, data.client]);
    } catch (err) {
      console.error("Error adding client:", err.message);
    }
  };

  const handleDeleteSchedule = (id) => {
    setSchedules((prev) => prev.filter((_, i) => i !== parseInt(id)));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      {/* Header */}
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
            onClick={() => navigate("/admin/deployment/add-schedule")}
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
          eventDrop={(info) => {
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
          }}
          eventResize={(info) => {
            const updated = schedules.map((s, i) =>
              i === parseInt(info.event.id)
                ? { ...s, timeOut: info.event.end.toISOString() }
                : s
            );
            setSchedules(updated);
          }}
          selectable={true}
          select={(info) => {
            navigate(`/admin/deployment/add-schedule?date=${info.startStr}`);
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

      {/* Add/Edit Schedule Modal ) */}
      <Transition appear show={showForm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowForm(false)}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl border border-gray-700">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-[#0f172a] rounded-full flex items-center justify-center border-2 border-gray-600">
                      <Shield className="text-blue-400 w-7 h-7" />
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white">
                        {editEvent ? "Edit Schedule" : "Add New Schedule"}
                      </Dialog.Title>
                      <p className="text-gray-400 text-sm">
                        Manage deployment schedules and assignments.
                      </p>
                    </div>
                  </div>

                  {/* Form */}
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
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-300 text-sm mb-1">
                            Guard Name
                          </label>
                          <input
                            name="guardName"
                            placeholder="Enter Guard Name"
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                            defaultValue={editEvent?.title?.split("(")[0]?.trim() || ""}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 text-sm mb-1">
                            Deployment Location
                          </label>
                          <input
                            name="location"
                            placeholder="Enter Location"
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 text-sm mb-1">
                            Client
                          </label>
                          <select
                            name="client"
                            className="w-full bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {clients.map((client, i) => (
                              <option key={i} value={client}>
                                {client}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-300 text-sm mb-1">
                            Shift Type
                          </label>
                          <select
                            name="shiftType"
                            className="w-full bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="Day Shift">Day Shift</option>
                            <option value="Night Shift">Night Shift</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-300 text-sm mb-1">
                            Time In
                          </label>
                          <input
                            type="datetime-local"
                            name="timeIn"
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 text-sm mb-1">
                            Time Out
                          </label>
                          <input
                            type="datetime-local"
                            name="timeOut"
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-end gap-4 border-t border-gray-700 pt-4">
                      {editEvent && (
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteSchedule(editEvent.id);
                            setShowForm(false);
                          }}
                          className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg text-white"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditEvent(null);
                        }}
                        className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-8 py-2 rounded-lg shadow text-white font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 🟩 Add Client Modal  */}
      <Transition appear show={showClientModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowClientModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl border border-gray-700">
                <Dialog.Title className="text-2xl font-bold text-white mb-6 flex items-center gap-x-3">
                  <Building2 className="text-blue-400" size={32}/> Add New Client
                </Dialog.Title>

                <form
                 onSubmit={(e) => {
                  e.preventDefault();
                  const newClient = {
                    clientName: e.target.clientName.value,
                    clientContact: e.target.clientContact.value,
                    clientTypeOfEstablishment: e.target.clientTypeOfEstablishment.value,
                    clientAddress: e.target.clientAddress.value,
                    clientContactPerson: e.target.clientContactPerson.value,
                  };
                  handleAddClient(newClient);
                  e.target.reset();
                  setShowClientModal(false);
                }}

                  className="space-y-6"
                >
                  {/* Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">
                          Client Name
                        </label>
                        <input
                          name="clientName"
                          placeholder="Enter Client Name"
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm mb-1">
                          Contact Number
                        </label>
                        <input
                          name="clientContact"
                          placeholder="e.g. 09171234567"
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm mb-1">
                          Type of Establishment
                        </label>
                        <input
                          name="clientTypeOfEstablishment"
                          placeholder="e.g. Mall, Bank, Office"
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">
                          Address
                        </label>
                        <input
                          name="clientAddress"
                          placeholder="Enter Client Address"
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 text-sm mb-1">
                          Contact Person
                        </label>
                        <input
                          name="clientContactPerson"
                          placeholder="Enter Contact Person Name"
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowClientModal(false)}
                      className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-6 py-2 rounded-lg text-white font-medium"
                    >
                      Add Client
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
