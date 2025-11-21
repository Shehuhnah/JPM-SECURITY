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
  Trash,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminSchedApproval() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showApproveBatchModal, setShowApproveBatchModal] = useState(false);
  const [batchToApprove, setBatchToApprove] = useState(null);
  const [showDeclineBatchModal, setShowDeclineBatchModal] = useState(false);
  const [batchToDecline, setBatchToDecline] = useState(null);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }

  }, [user, loading, navigate]);

  // Fetch all schedules 
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

  useEffect(() => {
    document.title = "Manage Schedules | JPM Security Agency";
    fetchData();
  }, []);

  const openApproveBatchModal = (batch) => {
  console.log("openApproveBatchModal called with batch:", batch);
    setBatchToApprove(batch);
    setShowApproveBatchModal(true);
    console.log("setShowApproveBatchModal(true) called.");
  };

  const openDeclineBatchModal = (batch) => {
    console.log("openDeclineBatchModal called with batch:", batch);
    setBatchToDecline(batch);
    setShowDeclineBatchModal(true);
    setRemarks(""); // Reset remarks
    console.log("setShowDeclineBatchModal(true) called.");
  };

  const handleApproveBatch = async () => {
    if (!batchToApprove) return;
    setSubmitting(true);
    try {
      const id = batchToApprove[0]._id;
      const res = await fetch(`http://localhost:5000/api/schedules/batch/approve/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve batch');
      
      toast.success("Schedule Approve Successfully", {
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
      await refresh();
      setShowApproveBatchModal(false);
      setBatchToApprove(null);
    } catch (error) {
      toast.error("Error Approving Schedule: ", error, {
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
      console.error('Error approving batch:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineBatch = async (declineRemarks) => {
    if (!batchToDecline) return;
    if (!declineRemarks) {
      toast.error("Remarks are required to decline!", {
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
    setSubmitting(true);
    try {
      const id = batchToDecline[0]._id;
      const res = await fetch(`http://localhost:5000/api/schedules/batch/decline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ remarks: declineRemarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to decline batch');

      toast.success("Schedule Decline Successfully", {
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
      await refresh();
      setShowDeclineBatchModal(false);
      setBatchToDecline(null);
      setRemarks("");
    } catch (error) {
      toast.error("Error Declining Schedule: ", error, {
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
      console.error('Error declining batch:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const refresh = async () => {
    await fetchData();
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
      toast.success("Schedule reopened and set to Pending.", {
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
    } catch (err) {
      console.error("Failed to reopen schedule:", err);
      toast.error("Failed to reopen schedule:", err, {
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
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-white mb-3 border-l-4 border-teal-500 pl-3">
                    {clientName}
                  </h2>
                </div>

                {Object.entries(
                  clientSchedules.reduce((batchAcc, schedule) => {
                    const batchKey = `${schedule.deploymentLocation}-${schedule.shiftType}-${schedule.isApproved}`;
                    if (!batchAcc[batchKey]) batchAcc[batchKey] = [];
                    batchAcc[batchKey].push(schedule);
                    return batchAcc;
                  }, {})
                ).map(([batchKey, batchSchedules]) => (
                  <div key={batchKey} className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-md font-semibold text-gray-300 pl-3 border-l-2 border-blue-500">
                          {batchSchedules[0].deploymentLocation} -{" "}
                          {batchSchedules[0].shiftType}{" "}
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                              batchSchedules[0].isApproved === "Approved"
                                ? "bg-green-600/20 text-green-400 border border-green-500/50"
                                : batchSchedules[0].isApproved === "Pending"
                                ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/50"
                                : "bg-red-600/20 text-red-400 border border-red-500/50"
                            }`}
                          >
                            {batchSchedules[0].isApproved}
                          </span>
                        </h3>
                        <div className="flex items-center justify-center gap-2">
                            {batchSchedules[0].isApproved === 'Pending' && (
                                <>
                                    <button 
                                      onClick={() => openApproveBatchModal(batchSchedules)}
                                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                                        <ThumbsUp size={16}/>
                                        Approve
                                    </button>
                                    <button 
                                      onClick={() => openDeclineBatchModal(batchSchedules)}
                                      className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm font-medium">
                                        <ThumbsDown size={16}/>
                                        Decline
                                    </button>
                                </>
                            )}
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
                            <th className="py-3 px-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchSchedules.map((s, i) => (
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
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      s.isApproved === "Approved"
                                        ? "bg-green-600 text-white"
                                        : s.isApproved === "Declined"
                                        ? "bg-red-600 text-white"
                                        : "bg-yellow-600 text-black"
                                    }`}
                                  >
                                    {s.isApproved || "Pending"}
                                  </span>
                                  {s.isApproved === "Declined" && (
                                    <button
                                      onClick={() => reopenSchedule(s._id)}
                                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                                    >
                                      Reopen
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
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

      {/* ===== APPROVE BATCH MODAL ===== */}
      <Transition appear show={showApproveBatchModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setShowApproveBatchModal(false)}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
            <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ThumbsUp className="text-green-400" /> Approve Schedule Batch
            </Dialog.Title>
            {batchToApprove && (
                <div className="text-gray-300 space-y-2">
                    <p>Are you sure you want to approve this schedule batch?</p>
                    <div className="bg-[#0f172a] p-3 rounded-lg border border-gray-600 text-sm">
                        <p><strong>Client:</strong> {batchToApprove[0].client}</p>
                        <p><strong>Location:</strong> {batchToApprove[0].deploymentLocation}</p>
                        <p><strong>Shift:</strong> {batchToApprove[0].shiftType}</p>
                        <p><strong>Schedules:</strong> {batchToApprove.length}</p>
                    </div>
                </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowApproveBatchModal(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white">Cancel</button>
                <button onClick={handleApproveBatch} className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg text-white font-medium">Confirm Approve</button>
            </div>
        </Dialog.Panel>
      </div>
      </Dialog>
      </Transition>

      {/* ===== DECLINE BATCH MODAL ===== */}
      <Transition appear show={showDeclineBatchModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeclineBatchModal(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ThumbsDown className="text-red-400" /> Decline Schedule Batch
              </Dialog.Title>
              {batchToDecline && (
                  <div className="text-gray-300 space-y-3">
                      <p>You are about to decline the following schedule batch:</p>
                      <div className="bg-[#0f172a] p-3 rounded-lg border border-gray-600 text-sm">
                          <p><strong>Client:</strong> {batchToDecline[0].client}</p>
                          <p><strong>Location:</strong> {batchToDecline[0].deploymentLocation}</p>
                          <p><strong>Shift:</strong> {batchToDecline[0].shiftType}</p>
                          <p><strong>Schedules:</strong> {batchToDecline.length}</p>
                      </div>
                      <label className="block text-sm font-medium text-gray-300 pt-2">Reason for Declining</label>
                      <textarea
                          rows="3"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Enter detailed reason..."
                          className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-red-500"
                      />
                  </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowDeclineBatchModal(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white">Cancel</button>
                  <button onClick={() => handleDeclineBatch(remarks)} className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-white font-medium">Confirm Decline</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      <ToastContainer/>
    </div>
  );
}
