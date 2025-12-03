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
  Clock,
  MapPin,
  User,
  Shield,
  X
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const api = import.meta.env.VITE_API_URL;

// --- Custom Styles for Dark Mode FullCalendar ---
const calendarStyles = `
  .fc {
    --fc-page-bg-color: transparent;
    --fc-neutral-bg-color: #1e293b;
    --fc-list-event-hover-bg-color: #334155;
    --fc-today-bg-color: rgba(51, 65, 85, 0.3);
    --fc-border-color: #334155;
    --fc-button-text-color: #fff;
    --fc-button-bg-color: #2563eb;
    --fc-button-border-color: #2563eb;
    --fc-button-hover-bg-color: #1d4ed8;
    --fc-button-hover-border-color: #1d4ed8;
    --fc-button-active-bg-color: #1e40af;
    --fc-button-active-border-color: #1e40af;
    color: #e2e8f0;
    font-family: inherit;
  }
  .fc-theme-standard .fc-scrollgrid {
    border-color: #334155;
  }
  .fc th {
    background-color: #0f172a;
    padding: 12px 0;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    color: #94a3b8;
  }
  .fc-daygrid-day-number {
    color: #cbd5e1;
    font-weight: 500;
    padding: 8px;
  }
  .fc-col-header-cell-cushion {
    color: #e2e8f0;
  }
  .fc-event {
    cursor: pointer;
    border: none;
    padding: 2px 4px;
    font-size: 0.75rem;
    border-radius: 4px;
  }
  .fc-popover {
    background-color: #1e293b !important;
    border-color: #475569 !important;
  }
  .fc-popover-header {
    background-color: #0f172a !important;
    color: #e2e8f0 !important;
  }
  .fc-popover-body {
    color: #e2e8f0 !important;
  }
`;

export default function AdminSchedApproval() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modals
  const [showApproveBatchModal, setShowApproveBatchModal] = useState(false);
  const [batchToApprove, setBatchToApprove] = useState(null);
  const [showDeclineBatchModal, setShowDeclineBatchModal] = useState(false);
  const [batchToDecline, setBatchToDecline] = useState(null);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [schedulesRes, clientsRes] = await Promise.all([
        fetch(`${api}/api/schedules/get-schedules`, { credentials: "include" }),
        fetch(`${api}/api/clients/get-clients`, { credentials: "include" }),
      ]);
      
      if (!schedulesRes.ok) throw new Error("Failed to fetch schedules");
      if (!clientsRes.ok) throw new Error("Failed to fetch clients");

      const [schedulesData, clientsData] = await Promise.all([
        schedulesRes.json(),
        clientsRes.json(),
      ]);

      setSchedules(schedulesData);
      setClients(clientsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to fetch data.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    document.title = "Manage Schedules | JPM Security Agency";
    fetchData();
  }, []);

  // --- Handlers ---

  const openApproveBatchModal = (batch) => {
    setBatchToApprove(batch);
    setShowApproveBatchModal(true);
  };

  const openDeclineBatchModal = (batch) => {
    setBatchToDecline(batch);
    setShowDeclineBatchModal(true);
    setRemarks("");
  };

  const handleApproveBatch = async () => {
    if (!batchToApprove || batchToApprove.length === 0) return;
    setSubmitting(true);
    try {
      const id = batchToApprove[0];
      const res = await fetch(`${api}/api/schedules/batch/approve/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve batch");
      
      toast.success("Schedule Approved Successfully");
      await fetchData();
      setShowApproveBatchModal(false);
      setBatchToApprove(null);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineBatch = async (declineRemarks) => {
    if (!batchToDecline || !declineRemarks) {
      toast.error("Remarks are required!");
      return;
    }
    setSubmitting(true);
    try {
      const id = batchToDecline[0];
      const res = await fetch(`${api}/api/schedules/batch/decline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remarks: declineRemarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to decline batch");
      
      toast.success("Schedule Declined Successfully");
      await fetchData();
      setShowDeclineBatchModal(false);
      setBatchToDecline(null);
      setRemarks("");
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Data Processing ---

  const shiftColors = { "Night Shift": "#ef4444", "Day Shift": "#eab308" };

  const filteredSchedules = schedules.filter((s) => {
    const matchesClient = !selectedClient || selectedClient === "All" || s.client === selectedClient;
    const matchesStatus = !statusFilter || statusFilter === "All" || s.isApproved === statusFilter;
    return matchesClient && matchesStatus;
  });

  const calendarEvents = filteredSchedules.map((s) => ({
    id: s._id,
    title: `${s.guardId?.fullName || "Unassigned"} (${s.shiftType})`,
    start: s.timeIn,
    end: s.timeOut,
    backgroundColor: s.isApproved === "Approved" ? "#22c55e" : (shiftColors[s.shiftType] || "#3b82f6"),
    borderColor: s.isApproved === "Approved" ? "#22c55e" : (shiftColors[s.shiftType] || "#3b82f6"),
    textColor: "#fff",
    extendedProps: s,
  }));

  const groupedForTable = filteredSchedules.reduce((acc, schedule) => {
    const key = `${schedule.client}-${schedule.shiftType}`;
    if (!acc[key]) {
      acc[key] = {
        client: schedule.client,
        shiftType: schedule.shiftType,
        isApproved: schedule.isApproved,
        schedules: [],
      };
    }
    acc[key].schedules.push(schedule);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-6 font-sans">
      <style>{calendarStyles}</style>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      {/* ===== HEADER ===== */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <CalendarDays className="text-blue-500" size={28} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Schedule Approval</h1>
                <p className="text-slate-400 text-sm mt-1">Review and manage guard shifts.</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* View Mode Toggle */}
            <div className="relative">
                <Menu>
                    <Menu.Button className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 bg-[#1e293b] border border-gray-700 rounded-lg hover:bg-gray-800 transition text-sm text-gray-200">
                        {viewMode === "calendar" ? <><LayoutGrid size={16} /> Calendar View</> : <><Table size={16} /> List View</>}
                        <ChevronDown size={14} className="text-gray-500" />
                    </Menu.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-[#1e293b] border border-gray-700 rounded-xl shadow-xl z-20 focus:outline-none overflow-hidden">
                            <Menu.Item>
                                {({ active }) => (
                                    <button onClick={() => setViewMode("calendar")} className={`${active ? "bg-blue-600 text-white" : "text-gray-300"} flex items-center gap-2 w-full px-4 py-3 text-sm`}>
                                        <LayoutGrid size={16} /> Calendar View
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button onClick={() => setViewMode("table")} className={`${active ? "bg-blue-600 text-white" : "text-gray-300"} flex items-center gap-2 w-full px-4 py-3 text-sm`}>
                                        <Table size={16} /> List View
                                    </button>
                                )}
                            </Menu.Item>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>

            {/* Client Filter */}
            <div className="relative flex-grow sm:flex-grow-0">
                <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                    <option value="">All Clients</option>
                    {clients.map((c) => (
                        <option key={c._id} value={c.clientName}>{c.clientName}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <Filter size={14} />
                </div>
            </div>

            {/* Status Filter */}
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
            </select>

            <button
                onClick={fetchData}
                className="px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
                title="Refresh Data"
            >
                <RefreshCw size={20} />
            </button>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-1 shadow-xl min-h-[600px]">
        {isLoadingData ? (
             <div className="flex flex-col items-center justify-center h-[600px] text-blue-400 animate-pulse">
                <CalendarDays size={48} className="mb-4 opacity-50" />
                <p>Loading schedules...</p>
             </div>
        ) : (
            <>
                {viewMode === "calendar" ? (
                    <div className="p-4 md:p-6 bg-[#1e293b] rounded-xl">
                        {!selectedClient && (
                            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-900/50 text-blue-200 rounded-lg flex items-center gap-2 text-sm">
                                <Filter size={16} /> 
                                Tip: Select a specific <strong>Client</strong> from the dropdown above to filter the calendar view effectively.
                            </div>
                        )}
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            height="auto"
                            events={calendarEvents}
                            eventClick={(info) => setSelectedEvent(info.event.extendedProps)}
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,timeGridWeek"
                            }}
                        />
                    </div>
                ) : (
                    // ===== LIST VIEW (Grouped) =====
                    <div className="p-4 md:p-6 space-y-8">
                        {Object.values(groupedForTable).length === 0 ? (
                             <div className="text-center py-20 text-gray-500">No schedules found matching your filters.</div>
                        ) : (
                            Object.values(groupedForTable).map((group, idx) => (
                                <div key={idx} className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-md">
                                    {/* Group Header */}
                                    <div className="p-4 bg-slate-800/50 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${group.shiftType === 'Night Shift' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{group.client}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <span className={group.shiftType === 'Night Shift' ? 'text-red-400' : 'text-yellow-400'}>{group.shiftType}</span>
                                                    <span>•</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                        group.isApproved === "Approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                        group.isApproved === "Declined" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                    }`}>
                                                        {group.isApproved}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {group.isApproved === "Pending" && (
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <button
                                                    onClick={() => openApproveBatchModal(group.schedules.map(s => s._id))}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                                >
                                                    <ThumbsUp size={16} /> Approve Batch
                                                </button>
                                                <button
                                                    onClick={() => openDeclineBatchModal(group.schedules.map(s => s._id))}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                                >
                                                    <ThumbsDown size={16} /> Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-[#0f172a] text-gray-400 border-b border-gray-700">
                                                <tr>
                                                    <th className="py-3 px-6 font-medium">Guard Name</th>
                                                    <th className="py-3 px-6 font-medium">Location & Position</th>
                                                    <th className="py-3 px-6 font-medium">Schedule Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700/50">
                                                {group.schedules.map((s) => (
                                                    <tr key={s._id} className="hover:bg-slate-800/30 transition">
                                                        <td className="py-3 px-6 font-medium text-white flex items-center gap-2">
                                                            <User size={16} className="text-gray-500"/>
                                                            {s.guardId?.fullName || "Unassigned"}
                                                        </td>
                                                        <td className="py-3 px-6 text-gray-300">
                                                            <div className="flex flex-col">
                                                                <span className="text-white">{s.deploymentLocation}</span>
                                                                <span className="text-xs text-blue-400">{s.position}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-6">
                                                            <div className="flex items-center gap-2 text-gray-300">
                                                                <Clock size={14} className="text-gray-500"/>
                                                                {new Date(s.timeIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                                                <span className="text-gray-600">-</span>
                                                                {new Date(s.timeOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                            </div>
                                                            <div className="text-xs text-gray-500 ml-6">
                                                                {new Date(s.timeIn).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden divide-y divide-gray-700/50">
                                        {group.schedules.map((s) => (
                                            <div key={s._id} className="p-4 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium text-white flex items-center gap-2">
                                                        <Shield size={16} className="text-blue-500"/>
                                                        {s.guardId?.fullName}
                                                    </div>
                                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{s.position}</span>
                                                </div>
                                                <div className="text-sm text-gray-400 flex items-start gap-2">
                                                    <MapPin size={16} className="mt-0.5 text-gray-600 shrink-0"/>
                                                    {s.deploymentLocation}
                                                </div>
                                                <div className="text-sm text-gray-300 flex items-center gap-2 bg-slate-800/50 p-2 rounded mt-1">
                                                    <Clock size={16} className="text-gray-500"/>
                                                    <span>
                                                        {new Date(s.timeIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(s.timeOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </>
        )}
      </div>

      {/* ===== MODALS ===== */}
      
      {/* Approve Modal */}
      <Transition appear show={showApproveBatchModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowApproveBatchModal(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <ThumbsUp className="text-green-500" size={24}/>
                </div>
                <Dialog.Title className="text-xl font-bold text-white mb-2">Approve Schedule?</Dialog.Title>
                <p className="text-gray-400 text-sm mb-6">
                  You are about to approve this entire batch of shifts. This action will notify the guards.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowApproveBatchModal(false)}
                    className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveBatch}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-green-900/20 transition disabled:opacity-50"
                  >
                    {submitting ? "Approving..." : "Confirm"}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Decline Modal */}
      <Transition appear show={showDeclineBatchModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeclineBatchModal(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                    <ThumbsDown className="text-red-500" size={24}/> Decline Batch
                 </Dialog.Title>
                 <button onClick={() => setShowDeclineBatchModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">
                Please provide a reason for declining. This note will be sent to the admin/guards.
              </p>
              
              <textarea
                rows="4"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for rejection (e.g. Conflict in schedule)..."
                className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none resize-none mb-6"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeclineBatchModal(false)}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeclineBatch(remarks)}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-medium shadow-lg shadow-red-900/20 transition disabled:opacity-50"
                >
                  {submitting ? "Declining..." : "Decline Batch"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}