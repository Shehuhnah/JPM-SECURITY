import { useState, useEffect, Fragment } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, Transition } from "@headlessui/react";
import {
  CalendarDays,
  Building2,
  Filter,
  PlusCircle,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminDeployment() {
  const navigate = useNavigate();
  const { admin, token } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

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
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (token) fetchData();
  }, [token]);

  console.log(schedules)

  const shiftColors = {
    "Night Shift": "#ef4444", // red
    "Day Shift": "#fde047", // yellow
  };

  const events = schedules.map((s, idx) => ({
    id: String(idx),
    title: `${s.guardName} (${s.shiftType})`,
    start: s.timeIn,
    end: s.timeOut,
    backgroundColor: shiftColors[s.shiftType] || "#3b82f6",
    borderColor: shiftColors[s.shiftType] || "#3b82f6",
    textColor: s.shiftType === "Day Shift" ? "#000" : "#fff",
    display: "block",
    extendedProps: {
      client: s.client,
      location: s.deploymentLocation,
    },
  }));

  const filteredEvents =
    !selectedClient || selectedClient === "All"
      ? []
      : events.filter(
          (event) => event.extendedProps.client === selectedClient
        );

  const handleAddClient = async (newClient) => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/clients/create-client",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newClient),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add client");

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
      {/* ===== HEADER ===== */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-center sm:text-left">
            Deployment Schedule
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Client Filter */}
          <div className="flex items-center gap-2 bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-[#1e293b] text-gray-200 text-sm focus:outline-none"
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client._id} value={client.clientName}>
                  {client.clientName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowClientModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <PlusCircle size={16} /> Add Client
            </button>
            <button
              onClick={() => navigate("/admin/deployment/add-schedule")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <ClipboardList size={16} /> Add Schedule
            </button>
          </div>
        </div>
      </header>

      {/* ===== LEGEND ===== */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#fde047] rounded-sm"></span> Day Shift
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#ef4444] rounded-sm"></span> Night Shift
        </div>
      </div>

      {/* ===== CALENDAR ===== */}
      <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-700">
        {selectedClient ? (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="80vh"
            events={filteredEvents}
            eventContent={(eventInfo) => (
              <div className="text-xs">
                <b>{eventInfo.event.title}</b>
                <p className="text-gray-200">
                  {eventInfo.event.extendedProps.location}
                </p>
              </div>
            )}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
          />
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">
              <Filter className="inline-block w-5 h-5 mr-2" />
              Please select a client to view deployment schedules.
            </p>
          </div>
        )}
      </div>

      {/* ===== ADD CLIENT MODAL ===== */}
      <Transition appear show={showClientModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowClientModal(false)}
        >
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

          <div className="fixed inset-0 flex items-center justify-center p-4">
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
                <Dialog.Title className="text-2xl font-bold text-white mb-6 flex items-center gap-x-3">
                  <Building2 className="text-blue-400" size={32} /> Add New Client
                </Dialog.Title>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newClient = {
                      clientName: e.target.clientName.value,
                      clientContact: e.target.clientContact.value,
                      clientTypeOfEstablishment:
                        e.target.clientTypeOfEstablishment.value,
                      clientAddress: e.target.clientAddress.value,
                      clientContactPerson: e.target.clientContactPerson.value,
                    };
                    handleAddClient(newClient);
                    e.target.reset();
                    setShowClientModal(false);
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">
                          Client Name
                        </label>
                        <input
                          name="clientName"
                          placeholder="e.g. Jollibee - Cavite"
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
                          placeholder="09171234567"
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

                    {/* Right */}
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
