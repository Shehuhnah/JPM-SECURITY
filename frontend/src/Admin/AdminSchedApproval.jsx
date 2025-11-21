import React, { useEffect, useState, Fragment } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  CalendarDays,
  Filter,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Table,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminSchedApproval() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }

  }, [user, loading, navigate]);

  // Fetch all schedules 
  useEffect(() => {
    document.title = "Manage Schedules | JPM Security Agency";
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

        const [schedulesData, clientsData] = await Promise.all([
          schedulesRes.json(),
          clientsRes.json(),
        ]);

        if (!schedulesRes.ok) throw new Error(schedulesData.message);
        if (!clientsRes.ok) throw new Error(clientsData.message);

        setSchedules(schedulesData);
        setClients(clientsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const refresh = async () => {
    try {
      const [schedulesRes, clientsRes] = await Promise.all([
        fetch("http://localhost:5000/api/schedules/get-schedules", {
          credentials: "include",
        }),
        fetch("http://localhost:5000/api/clients/get-clients", {
          credentials: "include",
        }),
      ]);

      const [schedulesData, clientsData] = await Promise.all([
        schedulesRes.json(),
        clientsRes.json(),
      ]);

      if (!schedulesRes.ok) throw new Error(schedulesData.message);
      if (!clientsRes.ok) throw new Error(clientsData.message);

      setSchedules(schedulesData);
      setClients(clientsData);
    } catch (err)
      {
      console.error("Failed to fetch data:", err);
    }
  };

  const shiftColors = {
    "Night Shift": "#ef4444", // red
    "Day Shift": "#fde047", // yellow
  };

  // ===== Filter schedules by selected client and status =====
  const filteredSchedules = schedules.filter((s) => {
    const matchesClient =
      !selectedClient || selectedClient === "All" || s.client === selectedClient;
    const matchesStatus =
      !statusFilter || statusFilter === "All" || s.isApproved === statusFilter;
    return matchesClient && matchesStatus;
  });

  // ===== Convert to FullCalendar format =====
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
      ...s,
    },
  }));

  // ===== Approve all schedules for selected client =====
  const handleApprove = async () => {
    if (!selectedClient || selectedClient === "All"){
      toast.error("Please Select Specific Client First! ", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }

    const clientSchedules = schedules.filter(
      (s) => s.client === selectedClient && s.isApproved === "Pending"
    );

    if (clientSchedules.length === 0){
      toast.error(`No Pending Schedules for ${selectedClient}!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/schedules/approve-client-schedules`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ client: selectedClient }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve schedules");

       toast.success(`All Schedules for ${selectedClient} Approved!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });

      setSchedules((prev) =>
        prev.map((s) =>
          s.client === selectedClient ? { ...s, isApproved: "Approved" } : s
        )
      );
      refresh();
    } catch (err) {
      console.error(err);
    };
  }

  // ===== Decline all schedules for selected client =====
  const handleDecline = async (remarks) => {
    if (!selectedClient || selectedClient === "All") {
      toast.error("Please Select a Specific Client First. ", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    const clientSchedules = schedules.filter(
      (s) => s.client === selectedClient && s.isApproved === "Pending"
    );

    if (clientSchedules.length === 0) {
      toast.error(`No Pending Schedule to Decline for: ${selectedClient}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    if (!remarks || !remarks.trim()){
      toast.error("Please Provide a Reason for Declining", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/schedules/decline-client-schedules`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            client: selectedClient,
            remarks,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`All Schedule for ${selectedClient} Declined!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });

      setSchedules((prev) =>
        prev.map((s) =>
          s.client === selectedClient
            ? { ...s, isApproved: "Declined", declineRemarks: remarks }
            : s
        )
      );
    } catch (err) {
      toast.error( err.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }
  };

  // Reopen a previously declined schedule (set status back to Pending)
  const reopenSchedule = async (scheduleId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/schedules/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: scheduleId, isApproved: "Pending" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reopen schedule");

      setSchedules((prev) => prev.map((s) => (s._id === scheduleId ? { ...s, isApproved: "Pending" } : s)));
      alert("✅ Schedule reopened and set to Pending.");
    } catch (err) {
      console.error("Failed to reopen schedule:", err);
      alert(err.message || "Failed to reopen schedule.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      {/* ===== HEADER ===== */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-center sm:text-left">
            Schedule Approval
          </h1>
        </div>
        <div className="flex justify-between items-center">
          {/* FILTERS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
            {/* Client Filter */}
            <button
              onClick={refresh}
              className="flex items-center justify-center px-4 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition-colors duration-200"
              title="Refresh List"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-[#1e293b] text-gray-200 text-sm focus:outline-none"
              >
                <option value="">Select Client</option>
                <option value="All">All Clients</option>
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
              <Menu.Button className="flex items-center justify-center gap-2 bg-[#1e293b] border border-gray-600 text-gray-200 hover:bg-gray-700 px-3 py-3 rounded-lg text-sm font-medium">
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
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Action Buttons */}
          {statusFilter === "Pending" && selectedClient && selectedClient !== "All" && (
            <div className="flex gap-2">
              <button
                onClick={() => setApproveModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <ThumbsUp size={16} /> Approve All
              </button>

              <button
                onClick={() => setDeclineModal(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <ThumbsDown size={16} /> Decline All
              </button>
            </div>
          )}

          {/* Declined State Button */}
          {statusFilter === "Declined" && selectedClient && selectedClient !== "All" && (
            <div className="flex gap-2">
              <button
                onClick={() => setReopenModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <ThumbsUp size={16} /> Reopen
              </button>
            </div>
          )}
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
              eventClick={(info) => {
                setSelectedEvent(info.event.extendedProps);
              }}
              eventContent={(eventInfo) => (
                <div className="text-xs p-1">
                  <b>{eventInfo.event.title}</b>
                  <p>{eventInfo.event.extendedProps.client}</p>
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
            {filteredSchedules.length === 0 && (
              <p className="text-center text-gray-500 italic py-10">
                No schedules found for the selected filters.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ===== SELECTED EVENT DISPLAY ===== */}
      {selectedEvent && (
        <div className="mt-6 bg-[#1e293b] border border-gray-700 p-4 rounded-xl">
          <h2 className="text-lg font-bold mb-2">{selectedEvent.guardName}</h2>
          <p className="text-gray-300">
            <strong>Client:</strong> {selectedEvent.client}
          </p>
          <p className="text-gray-300">
            <strong>Shift:</strong> {selectedEvent.shiftType}
          </p>
          <p className="text-gray-300">
            <strong>Location:</strong> {selectedEvent.deploymentLocation}
          </p>
          <p className="text-gray-300">
            <strong>Status:</strong> {selectedEvent.isApproved || "Pending"}
          </p>
        </div>
      )}

      {/* ===== APPROVE MODAL ===== */}
      <Transition appear show={approveModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setApproveModal(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ThumbsUp className="text-green-400" /> Approve All Schedules
              </Dialog.Title>
              {/* Summary Info */}
              <div className="bg-[#0f172a] border border-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 mb-2">
                  You are about to approve all pending schedules for the month
                  of
                  <span className="text-green-400 font-medium ml-1">
                    {new Date().toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  .
                </p>

                <div className="text-gray-100 text-sm space-y-1">
                  <p>
                    <span className="text-gray-400">🏢 Client:</span>{" "}
                    <span className="font-medium text-white">
                      {selectedClient}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">
                      🕒 Total Pending Work Days:
                    </span>{" "}
                    <span className="font-semibold text-yellow-400">
                      {
                        schedules.filter(
                          (s) =>
                            s.client === selectedClient &&
                            s.isApproved === "Pending"
                        ).length
                      }
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">👮 Guards Involved:</span>{" "}
                    <span className="font-semibold text-blue-400">
                      {
                        [
                          ...new Set(
                            schedules
                              .filter(
                                (s) =>
                                  s.client === selectedClient &&
                                  s.isApproved === "Pending"
                              )
                              .map((s) => s.guardName)
                          ),
                        ].length
                      }
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">📅 Coverage Dates:</span>{" "}
                    <span className="text-gray-200">
                      {(() => {
                        const scheds = schedules.filter(
                          (s) =>
                            s.client === selectedClient &&
                            s.isApproved === "Pending"
                        );
                        if (!scheds.length) return "N/A";
                        const dates = scheds.map((s) => new Date(s.timeIn));
                        const earliest = new Date(
                          Math.min(...dates)
                        ).toLocaleDateString();
                        const latest = new Date(
                          Math.max(...dates)
                        ).toLocaleDateString();
                        return `${earliest} - ${latest}`;
                      })()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Warning */}
              <p className="text-gray-400 text-xs mb-6 italic">
                ⚠️ Once approved, these schedules will be locked and visible to
                the assigned guards.
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setApproveModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setSubmitting(true);
                      await handleApprove();
                      setApproveModal(false);
                    } catch (error) {
                      console.error("Error approving schedules:", error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                >
                  {submitting ? "Approving..." : "Confirm Approve"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* ===== DECLINE MODAL ===== */}
      <Transition appear show={declineModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeclineModal(false)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ThumbsDown className="text-red-400" /> Decline All Schedules
              </Dialog.Title>

              {/* Context Info */}
              <div className="bg-[#0f172a] border border-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 mb-3">
                  You are about to decline all{" "}
                  <span className="font-semibold text-white">
                    {selectedClient}
                  </span>{" "}
                  schedules for{" "}
                  <span className="text-red-400 font-medium">
                    {new Date().toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  .
                </p>

                {/* Summary Details */}
                <div className="text-sm text-gray-200 space-y-1">
                  <p>
                    <span className="text-gray-400">📅 Coverage:</span>{" "}
                    <span className="text-gray-100">
                      {(() => {
                        const scheds = schedules.filter(
                          (s) =>
                            s.client === selectedClient &&
                            s.isApproved === "Pending"
                        );
                        if (!scheds.length) return "N/A";
                        const dates = scheds.map((s) => new Date(s.timeIn));
                        const earliest = new Date(
                          Math.min(...dates)
                        ).toLocaleDateString();
                        const latest = new Date(
                          Math.max(...dates)
                        ).toLocaleDateString();
                        return `${earliest} - ${latest}`;
                      })()}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">📅 Client:</span>{" "}
                    <span className="text-gray-100">
                      {selectedClient && selectedClient !== "All" ? selectedClient : "N/A"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">
                      📦 Total Pending Schedules:
                    </span>{" "}
                    <span className="font-semibold text-yellow-400">
                      {
                        schedules.filter(
                          (s) =>
                            s.client === selectedClient &&
                            s.isApproved === "Pending"
                        ).length
                      }
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">👮 Guards Involved:</span>{" "}
                    <span className="font-semibold text-blue-400">
                      {
                        [
                          ...new Set(
                            schedules
                              .filter(
                                (s) =>
                                  s.client === selectedClient &&
                                  s.isApproved === "Pending"
                              )
                              .map((s) => s.guardName)
                          ),
                        ].length
                      }
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">🗓️ Total Workdays:</span>{" "}
                    <span className="font-semibold text-green-400">
                      {
                        [
                          ...new Set(
                            schedules
                              .filter(
                                (s) =>
                                  s.client === selectedClient &&
                                  s.isApproved === "Pending"
                              )
                              .map((s) => new Date(s.timeIn).toDateString())
                          ),
                        ].length
                      }
                    </span>
                  </p>
                </div>
              </div>

              {/* Remarks Input */}
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Reason for Declining
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter detailed reason..."
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 mb-4 focus:ring-2 focus:ring-red-500"
              />

              <p className="text-xs text-gray-500 italic mb-4">
                ⚠️ Declining will mark all pending schedules for this client as{" "}
                <span className="text-red-400">Declined</span>. This action
                cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeclineModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!remarks.trim())
                      return toast.error("Please Provide a Reason for Declining", {
                                position: "top-right",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: false,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "dark",
                                transition: Bounce,
                              });;
                    try {
                      setSubmitting(true);
                      await handleDecline(remarks);
                      setDeclineModal(false);
                    } catch (error) {
                      console.error("Error declining schedules:", error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                >
                  {submitting ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      <ToastContainer/>
    </div>
  );
}
