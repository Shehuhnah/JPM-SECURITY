import { useState, useEffect, Fragment } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  CalendarDays,
  Building2,
  Filter,
  ClipboardList,
  Table,
  LayoutGrid,
  ChevronDown,
  Pencil,
  Trash,
  RefreshCcw,
  MapPin,
  Clock,
  User,
  Shield,
  X
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const api = import.meta.env.VITE_API_URL;

// --- Custom Calendar Styles ---
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
  .fc-theme-standard .fc-scrollgrid { border-color: #334155; }
  .fc th { background-color: #0f172a; padding: 12px 0; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #94a3b8; }
  .fc-daygrid-day-number { color: #cbd5e1; font-weight: 500; padding: 8px; }
  .fc-col-header-cell-cushion { color: #e2e8f0; }
  .fc-event { cursor: pointer; border: none; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; }
`;

export default function AdminDeployment() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Data State
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Filter State
  const [selectedClient, setSelectedClient] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("calendar");

  // Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [deleteSchedModal, setDeleteSchedModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
    document.title = "Deployment | JPM Security Agency";
  }, [user, loading, navigate]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [schedulesRes, clientsRes] = await Promise.all([
        fetch(`${api}/api/schedules/get-schedules`, { credentials: "include" }),
        fetch(`${api}/api/clients/get-clients`, { credentials: "include" }),
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
      toast.error("Failed to load data");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // --- Helpers ---
  const shiftColors = {
    "Night Shift": "#ef4444",
    "Day Shift": "#eab308",
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchesClient = !selectedClient || selectedClient === "All" || s.client === selectedClient;
    const matchesStatus = !statusFilter || statusFilter === "All" || s.isApproved === statusFilter;
    return matchesClient && matchesStatus;
  });

  const calendarEvents = filteredSchedules.map((s, idx) => ({
    id: String(idx),
    title: `${s.guardId?.fullName || "Unassigned"} (${s.shiftType})`,
    start: s.timeIn,
    end: s.timeOut,
    backgroundColor: shiftColors[s.shiftType] || "#3b82f6",
    borderColor: shiftColors[s.shiftType] || "#3b82f6",
    textColor: "#fff", // Always white text for contrast on dark bg
    extendedProps: {
      client: s.client,
      location: s.deploymentLocation,
      status: s.isApproved,
      guardName: s.guardId?.fullName,
    },
  }));

  // --- Handlers ---

  const handleAddClient = async (newClient) => {
    try {
      const res = await fetch(`${api}/api/clients/create-client`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add client");
      
      toast.success("Client Created Successfully", { theme: "dark", transition: Bounce });
      setClients((prev) => [...prev, data.client]);
      setShowClientModal(false);
    } catch (err) {
      console.error("Error adding client:", err.message);
      toast.error(`Failed to Add Client: ${err.message}`, { theme: "dark", transition: Bounce });
    }
  };

  const openDeleteModal = (batch) => {
    setBatchToDelete(batch);
    setDeleteSchedModal(true);
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;

    try {
      const id = batchToDelete[0]._id;
      const res = await fetch(`${api}/api/schedules/batch/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete batch");

      toast.success("Schedule Deleted Successfully", { theme: "dark", transition: Bounce });
      await fetchData();
      setDeleteSchedModal(false);
      setBatchToDelete(null);
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error(`Error deleting batch: ${error.message}`, { theme: "dark", transition: Bounce });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-6 font-sans">
      <style>{calendarStyles}</style>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />

      {/* ===== HEADER ===== */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <CalendarDays className="text-blue-500" size={28} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Deployment Schedule</h1>
                <p className="text-slate-400 text-sm mt-1">Manage guard shifts and locations.</p>
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
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Declined">Declined</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={fetchData}
                    className="px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
                    title="Refresh Data"
                >
                    <RefreshCcw size={20} />
                </button>
                <button
                    onClick={() => navigate("/admin/deployment/add-schedule")}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shadow-lg shadow-blue-900/20"
                >
                    <ClipboardList size={18} /> Add Schedule
                </button>
            </div>
        </div>
      </header>

      {/* ===== LEGEND (Mobile Only) ===== */}
      <div className="md:hidden mb-4 flex gap-4 text-xs text-gray-400 justify-end">
         <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Day</div>
         <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Night</div>
      </div>

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
                        {filteredSchedules.length === 0 ? (
                             <div className="text-center py-20 text-gray-500">No schedules found matching your filters.</div>
                        ) : (
                            // Group by Client
                            Object.entries(filteredSchedules.reduce((acc, schedule) => {
                                const client = schedule.client || "Unassigned Client";
                                if (!acc[client]) acc[client] = [];
                                acc[client].push(schedule);
                                return acc;
                            }, {})).map(([clientName, clientSchedules]) => (
                                <div key={clientName} className="space-y-4">
                                    {/* Client Header */}
                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-700">
                                        <Building2 className="text-blue-500" size={24}/>
                                        <h2 className="text-xl font-bold text-white">{clientName}</h2>
                                    </div>

                                    {/* Group by Batch (Location/Shift/Status) */}
                                    {Object.entries(clientSchedules.reduce((acc, schedule) => {
                                        const batchKey = `${schedule.deploymentLocation}-${schedule.shiftType}-${schedule.isApproved}`;
                                        if (!acc[batchKey]) acc[batchKey] = [];
                                        acc[batchKey].push(schedule);
                                        return acc;
                                    }, {})).map(([batchKey, batchSchedules], idx) => (
                                        <div key={idx} className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-md">
                                            
                                            {/* Batch Header */}
                                            <div className="p-4 bg-slate-800/50 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1 h-10 rounded-full ${batchSchedules[0].shiftType === 'Night Shift' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                                    <div>
                                                        <h3 className="font-semibold text-white">{batchSchedules[0].deploymentLocation}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                                            <span className={batchSchedules[0].shiftType === 'Night Shift' ? 'text-red-400' : 'text-yellow-400'}>{batchSchedules[0].shiftType}</span>
                                                            <span>•</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                                batchSchedules[0].isApproved === "Approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                                batchSchedules[0].isApproved === "Declined" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                                "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                            }`}>
                                                                {batchSchedules[0].isApproved}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    {batchSchedules[0].isApproved === "Declined" && (
                                                        <Link 
                                                            to={`/admin/deployment/add-schedule/${batchSchedules[0]._id}`}
                                                            className="p-2 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 rounded-lg transition"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={18}/>
                                                        </Link>
                                                    )}
                                                    <button 
                                                        onClick={() => openDeleteModal(batchSchedules)}
                                                        className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition"
                                                        title="Delete Batch"
                                                    >
                                                        <Trash size={18}/>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Desktop Table */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-[#0f172a] text-gray-400 border-b border-gray-700">
                                                        <tr>
                                                            <th className="py-3 px-6 font-medium">Guard Name</th>
                                                            <th className="py-3 px-6 font-medium">Position</th>
                                                            <th className="py-3 px-6 font-medium">Time In</th>
                                                            <th className="py-3 px-6 font-medium">Time Out</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700/50">
                                                        {batchSchedules.map((s, i) => (
                                                            <tr key={i} className="hover:bg-slate-800/30 transition">
                                                                <td className="py-3 px-6 font-medium text-white flex items-center gap-2">
                                                                    <Shield size={16} className="text-blue-500"/>
                                                                    {s.guardId?.fullName || "Unassigned"}
                                                                </td>
                                                                <td className="py-3 px-6 text-gray-300">{s.position}</td>
                                                                <td className="py-3 px-6 text-gray-300">{new Date(s.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                                <td className="py-3 px-6 text-gray-300">{new Date(s.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden divide-y divide-gray-700/50">
                                                {batchSchedules.map((s, i) => (
                                                    <div key={i} className="p-4 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-medium text-white flex items-center gap-2">
                                                                <Shield size={16} className="text-blue-500"/>
                                                                {s.guardId?.fullName}
                                                            </div>
                                                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{s.position}</span>
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

                                            {/* Remarks Footer */}
                                            {batchSchedules[0]?.remarks && (
                                                <div className="bg-red-900/20 p-3 border-t border-red-900/30 text-red-200 text-sm flex items-start gap-2">
                                                    <span className="font-bold shrink-0">Note:</span>
                                                    {batchSchedules[0].remarks}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </>
        )}
      </div>

      {/* ===== ADD CLIENT MODAL ===== */}
      <Transition appear show={showClientModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowClientModal(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left shadow-xl border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-3">
                    <Building2 className="text-blue-500" size={28} /> Add New Client
                  </Dialog.Title>
                  <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
              </div>

              <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleAddClient(Object.fromEntries(formData.entries()));
                }} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Client Name</label>
                      <input name="clientName" placeholder="e.g. Jollibee - Cavite" className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Contact Number</label>
                      <input name="clientContact" placeholder="0917xxxxxxx" className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Establishment Type</label>
                      <input name="clientTypeOfEstablishment" placeholder="e.g. Mall, Bank" className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Address</label>
                      <input name="clientAddress" placeholder="Enter Full Address" className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Contact Person</label>
                      <input name="clientContactPerson" placeholder="Full Name" className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button type="button" onClick={() => setShowClientModal(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2.5 rounded-xl text-white transition">Cancel</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-900/20 transition">Add Client</button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* ===== DELETE BATCH MODAL ===== */}
      <Transition appear show={deleteSchedModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteSchedModal(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left shadow-xl border border-gray-700">
              <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-red-500/10 rounded-full"><Trash className="text-red-500" size={20} /></div>
                Confirm Deletion
              </Dialog.Title>
              
              {batchToDelete && (
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Are you sure you want to delete this schedule batch? This will remove shifts for <span className="text-white font-bold">{batchToDelete.length} guards</span>.
                  </p>
                  
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-700 text-sm space-y-2">
                    <div className="flex justify-between border-b border-gray-700 pb-2 mb-2">
                        <span className="text-gray-500">Client</span>
                        <span className="text-white font-medium">{batchToDelete[0].client}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Location</span>
                        <span className="text-gray-300">{batchToDelete[0].deploymentLocation}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Shift</span>
                        <span className={batchToDelete[0].shiftType === 'Night Shift' ? 'text-red-400' : 'text-yellow-400'}>{batchToDelete[0].shiftType}</span>
                    </div>
                  </div>

                  <p className="text-xs text-red-400 italic mt-2">
                    * This action cannot be undone.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteSchedModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBatch}
                  className="bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg shadow-red-900/20 transition"
                >
                  Delete Batch
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}