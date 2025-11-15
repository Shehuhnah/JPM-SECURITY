import { useState, useEffect, Fragment } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, Transition, Menu  } from "@headlessui/react";
import {
  CalendarDays,
  Building2,
  Filter,
  PlusCircle,
  ClipboardList,
  Table,
  LayoutGrid,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminDeployment() {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // <-- renamed
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [viewMode, setViewMode] = useState("calendar");
  const [statusFilter, setStatusFilter] = useState("All"); // ✅ New state

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesRes, clientsRes] = await Promise.all([
          fetch("http://localhost:5000/api/schedules/get-schedules", {
            credentials: "include",
          }),
          fetch("http://localhost:5000/api/clients/get-clients", {
            credentials: "include",
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

    if (user) fetchData();
  }, [user]);

  const shiftColors = {
    "Night Shift": "#ef4444", // red
    "Day Shift": "#fde047", // yellow
  };

  // ✅ FILTER LOGIC
  const filteredSchedules = schedules.filter((s) => {
    const matchesClient =
      !selectedClient || selectedClient === "All" || s.client === selectedClient;

    // ✅ Compare actual string value (Approved/Pending/Declined)
    const matchesStatus =
      !statusFilter || statusFilter === "All" || s.isApproved === statusFilter;

    return matchesClient && matchesStatus;
  });

  // Generate events only from filtered schedules
  const filteredEvents = filteredSchedules.map((s, idx) => ({
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
      status: s.isApproved, // optional — you can use this later for badges or tooltips
    },
  }));

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

      <div className="flex justify-between items-center gap-4 mb-4 text-sm ">
        {/* ===== LEGEND ===== */}
        <div className="items-center text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#fde047] rounded-sm"></span> Day Shift
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#ef4444] rounded-sm"></span> Night Shift
          </div>
        </div>
        <div className="flex justify-between items-center">
          {/* FILTERS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
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
            {/* Right: Status Filter */}
            <div className="flex items-center gap-2 bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1e293b]  text-gray-200 text-sm rounded-lg  focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
          </div>
          {/* View Mode Dropdown */}
          <div className="flex items-center gap-2 ml-2">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button
                className="flex items-center justify-center gap-2 bg-[#1e293b] border border-gray-600 text-gray-200 hover:bg-gray-700 px-3 py-3 rounded-lg text-sm font-medium"
              >
                {viewMode === "calendar" ? (
                  <LayoutGrid size={16} />
                ) : (
                  <Table size={16} />
                )}
                <ChevronDown size={14} className="opacity-70" />
              </Menu.Button>

              <Menu.Items className="absolute right-1 mt-2 w-40 origin-top-left bg-[#1e293b] border border-gray-700 rounded-lg shadow-lg focus:outline-none z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md ${
                          viewMode === "calendar"
                            ? "bg-blue-600 text-white"
                            : active
                            ? "bg-gray-700 text-white"
                            : "text-gray-300"
                        }`}
                      >
                        <LayoutGrid size={16} /> Calendar View
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setViewMode("table")}
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md ${
                          viewMode === "table"
                            ? "bg-blue-600 text-white"
                            : active
                            ? "bg-gray-700 text-white"
                            : "text-gray-300"
                        }`}
                      >
                        <Table size={16} /> Table View
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>

      {/* ===== VIEW RENDERING ===== */}
      <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-700">
        {viewMode === "calendar" ? (
          selectedClient ? (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="80vh"
              events={filteredEvents}
              eventContent={(eventInfo) => (
                <div className="text-xs">
                  <b>{eventInfo.event.title}</b>
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
          )
        ) : (
          // ===== TABLE VIEW =====
          <div className="space-y-10">
            {Object.entries(
  filteredSchedules.reduce((acc, schedule) => {
    const client = schedule.client || "Unknown Client";
    if (!acc[client]) acc[client] = [];
    acc[client].push(schedule);
    return acc;
  }, {})
            ).map(([clientName, clientSchedules]) => (
              <div key={clientName}>
                {/* Client Header */}
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white mb-3 border-l-4 border-teal-500 pl-3">
                    {clientName}
                  </h2>
                  <div className="flex items-center gap-2 mb-3 pr-5">
                    <span className="text-gray-400 text-sm">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          statusFilter === "Approved"
                            ? "bg-green-600/20 text-green-400 border border-green-500/50"
                            : statusFilter === "Pending"
                            ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/50"
                            : statusFilter === "Declined"
                            ? "bg-red-600/20 text-red-400 border border-red-500/50"
                            : "bg-gray-700 text-gray-300 border border-gray-600/50"
                        }`}
                    >
                      {statusFilter}
                    </span>
                  </div>
                </div>

                {/* ✅ Use clientSchedules, not schedules */}
                <div className="overflow-x-auto rounded-lg shadow-lg">
                  <table className="min-w-full text-sm text-gray-300 border border-gray-700 rounded-lg overflow-hidden">
                    <thead className="bg-[#0f172a] text-gray-400">
                      <tr>
                        <th className="py-3 px-4 text-left">Guard Name</th>
                        <th className="py-3 px-4 text-left">Location</th>
                        <th className="py-3 px-4 text-left">Shift</th>
                        <th className="py-3 px-4 text-left">Time In</th>
                        <th className="py-3 px-4 text-left">Time Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientSchedules.map((s, i) => (
                        <tr
                          key={i}
                          className={`${
                            i % 2 === 0 ? "bg-[#1e293b]" : "bg-[#162033]"
                          } hover:bg-[#2a3954]`}
                        >
                          <td className="py-3 px-4">{s.guardName}</td>
                          <td className="py-3 px-4">{s.deploymentLocation}</td>
                          <td
                            className={`py-3 px-4 font-semibold ${
                              s.shiftType === "Night Shift"
                                ? "text-red-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {s.shiftType}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(s.timeIn).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(s.timeOut).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {/* If no schedules at all */}
            {filteredSchedules.length === 0 && (
              <p className="text-center text-gray-500 italic py-10">
                No schedules found for any client.
              </p>
            )}
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
