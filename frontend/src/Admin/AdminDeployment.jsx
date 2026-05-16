import { useState, useEffect, Fragment, useMemo } from "react";
import { getPersonName } from "../utils/name";
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
  Search,
  Table,
  LayoutGrid,
  ChevronDown,
  Eye,
  Pencil,
  Trash,
  RefreshCcw,
  Clock,
  Shield,
  MapPin,
  User,
  X
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast, Bounce } from "react-toastify";
import TablePagination from "../components/admin/TablePagination.jsx";
import "react-toastify/dist/ReactToastify.css";

const api = import.meta.env.VITE_API_URL;
const LIST_PAGE_SIZE = 5;

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

  @media (max-width: 640px) {
    .fc-header-toolbar {
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem !important;
    }
    .fc-toolbar-chunk:nth-child(2) {
      width: 100%;
      display: flex;
      justify-content: center;
      order: -1;
      margin-bottom: 0.25rem;
    }
    .fc-toolbar-title {
      font-size: 1.1rem !important;
    }
    .fc-button {
      padding: 0.25rem 0.5rem !important;
      font-size: 0.75rem !important;
    }
  }
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
  const [shiftFilter, setShiftFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("calendar");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [deleteSchedModal, setDeleteSchedModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

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
    const matchesShift = shiftFilter === "All" || s.shiftType === shiftFilter;
    const haystack = [
      getPersonName(s.guardId, ""),
      s.deploymentLocation,
      s.client,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = !searchQuery.trim() || haystack.includes(searchQuery.trim().toLowerCase());
    return matchesClient && matchesStatus && matchesShift && matchesSearch;
  });

  const getCreatedAtValue = (schedule) => new Date(schedule?.createdAt || 0).getTime();
  const formatShortDate = (value) =>
    new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });

  const formatTimeRange = (timeIn, timeOut) =>
    `${new Date(timeIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(timeOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  const sortedBatchGroups = useMemo(() => {
    const groupedBatches = filteredSchedules.reduce((acc, schedule) => {
      const batchKey = schedule.batchId || schedule._id;
      if (!acc[batchKey]) acc[batchKey] = [];
      acc[batchKey].push(schedule);
      return acc;
    }, {});

    return Object.entries(groupedBatches)
      .map(([batchKey, batchSchedules]) => ({
        batchKey,
        batchSchedules,
        latestCreatedAt: Math.max(...batchSchedules.map(getCreatedAtValue)),
      }))
      .sort((a, b) => b.latestCreatedAt - a.latestCreatedAt);
  }, [filteredSchedules]);

  const totalBatchPages = Math.max(1, Math.ceil(sortedBatchGroups.length / LIST_PAGE_SIZE));
  const paginatedBatchGroups = sortedBatchGroups.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, statusFilter, shiftFilter, searchQuery, viewMode]);

  useEffect(() => {
    if (currentPage > totalBatchPages) {
      setCurrentPage(totalBatchPages);
    }
  }, [currentPage, totalBatchPages]);

  const getGuardSummaries = (batchSchedules) => {
    if (!batchSchedules?.length) return [];

    return Object.values(
      batchSchedules.reduce((acc, schedule) => {
        const guardKey = schedule.guardId?._id || schedule.guardId || schedule._id;
        if (!acc[guardKey]) {
          acc[guardKey] = {
            guardKey,
            guard: schedule.guardId,
            position: schedule.position,
            deploymentLocation: schedule.deploymentLocation,
            shiftType: schedule.shiftType,
            days: [],
          };
        }

        acc[guardKey].days.push({
          id: schedule._id,
          timeIn: schedule.timeIn,
          timeOut: schedule.timeOut,
        });

        return acc;
      }, {})
    ).map((summary) => ({
      ...summary,
      days: [...summary.days].sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn)),
    }));
  };

  const openBatchDetails = (batchSchedules) => {
    const orderedSchedules = [...batchSchedules].sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
    setSelectedBatchDetails({
      client: batchSchedules[0]?.client,
      deploymentLocation: batchSchedules[0]?.deploymentLocation,
      shiftType: batchSchedules[0]?.shiftType,
      isApproved: batchSchedules[0]?.isApproved,
      remarks: batchSchedules[0]?.remarks,
      schedules: orderedSchedules,
      guardSummaries: getGuardSummaries(batchSchedules),
    });
  };

  const calendarEvents = filteredSchedules.map((s, idx) => ({
    id: String(idx),
    title: `${getPersonName(s.guardId, "Unassigned")} (${s.shiftType})`,
    start: s.timeIn,
    end: s.timeOut,
    backgroundColor: shiftColors[s.shiftType] || "#3b82f6",
    borderColor: shiftColors[s.shiftType] || "#3b82f6",
    textColor: "#fff", // Always white text for contrast on dark bg
    extendedProps: {
      client: s.client,
      location: s.deploymentLocation,
      status: s.isApproved,
      guardName: getPersonName(s.guardId),
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
    <div className="min-h-screen bg-[#0f172a] text-white p-2 md:p-6 font-sans">
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(180px,220px)_minmax(220px,1fr)_minmax(180px,220px)_minmax(160px,190px)_minmax(150px,180px)_auto] gap-3 w-full xl:w-auto xl:items-center">
            {/* View Mode Toggle */}
            <div className="relative min-w-0">
                <Menu>
                    <Menu.Button className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#1e293b] border border-gray-700 rounded-lg hover:bg-gray-800 transition text-sm text-gray-200">
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

            <div className="relative min-w-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search guard, client, or address"
                    className="w-full bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Client Filter */}
            <div className="relative min-w-0">
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
                className="w-full min-w-0 bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Declined">Declined</option>
            </select>

            <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="w-full min-w-0 bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                <option value="All">All Shifts</option>
                <option value="Day Shift">Day Shift</option>
                <option value="Night Shift">Night Shift</option>
            </select>

            {/* Actions */}
            <div className="grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[48px_minmax(160px,1fr)] gap-2">
                <button
                    onClick={fetchData}
                    className="h-[42px] px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
                    title="Refresh Data"
                >
                    <RefreshCcw size={20} />
                </button>
                <button
                    onClick={() => navigate("/admin/deployment/add-schedule")}
                    className="h-[42px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shadow-lg shadow-blue-900/20"
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
                    <div className="p-2 md:p-6 bg-[#1e293b] rounded-xl">
                        {!selectedClient && (
                           <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-900/20 border border-blue-900/50 text-blue-200 rounded-xl flex items-start gap-3 text-xs md:text-sm shadow-sm">
                              <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0">
                                  <Filter size={16} className="text-blue-400" />
                              </div>
                              <p className="leading-relaxed pt-0.5">
                                  <span className="font-bold text-blue-100">Tip:</span> Select a specific <strong className="text-white">Client</strong> from the dropdown above to filter the calendar view effectively.
                              </p>
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
                    <div className="p-2 md:p-6 space-y-8">
                        {sortedBatchGroups.length === 0 ? (
                             <div className="text-center py-20 text-gray-500">No schedules found matching your filters.</div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-[#0f172a]/60 px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Table size={16} className="text-blue-400" />
                                        <span>
                                            Showing newest deployment batches first
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        {sortedBatchGroups.length} batches
                                    </span>
                                </div>

                                {paginatedBatchGroups.map(({ batchKey, batchSchedules }) => {
                                    const guardSummaries = getGuardSummaries(batchSchedules);
                                    return (
                                        <div key={batchKey} className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-md">
                                            
                                            {/* Batch Header */}
                                            <div className="p-4 bg-slate-800/50 border-b border-gray-700 flex flex-col xs:flex-row xs:items-center justify-between gap-4">
                                                
                                                {/* Left Side: Info */}
                                                <div className="flex items-start gap-3">
                                                    {/* Shift Indicator Bar */}
                                                    <div className={`w-1 self-stretch rounded-full ${batchSchedules[0].shiftType === 'Night Shift' ? 'bg-red-500' : 'bg-yellow-500'} min-h-[40px] md:min-h-0`}></div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-300">
                                                            <Building2 size={14} />
                                                            <span>{batchSchedules[0].client || "Unassigned Client"}</span>
                                                        </div>
                                                        <h3 className="font-semibold text-white text-base md:text-lg leading-tight mb-1">{batchSchedules[0].deploymentLocation}</h3>
                                                        
                                                        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-400">
                                                            <span className={`font-medium ${batchSchedules[0].shiftType === 'Night Shift' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                                {batchSchedules[0].shiftType}
                                                            </span>
                                                            <span className="hidden md:inline">•</span>
                                                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider border ${
                                                                batchSchedules[0].isApproved === "Approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                                batchSchedules[0].isApproved === "Declined" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                                "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                            }`}>
                                                                {batchSchedules[0].isApproved}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side: Actions */}
                                                <div className="flex items-center justify-end gap-2 mt-2 md:mt-0">
                                                    <button
                                                        onClick={() => openBatchDetails(batchSchedules)}
                                                        className="p-2 md:p-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition active:scale-95"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18}/>
                                                    </button>
                                                    {batchSchedules[0].isApproved === "Declined" && (
                                                        <Link 
                                                            to={`/admin/deployment/add-schedule/${batchSchedules[0]._id}`}
                                                            className="p-2 md:p-2.5 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 rounded-lg transition active:scale-95"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={18}/>
                                                        </Link>
                                                    )}
                                                    <button 
                                                        onClick={() => openDeleteModal(batchSchedules)}
                                                        className="p-2 md:p-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition active:scale-95"
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
                                                            <th className="py-3 px-6 font-medium">Guard Summary</th>
                                                            <th className="py-3 px-6 font-medium">Assignment Summary</th>
                                                            <th className="py-3 px-6 font-medium">Schedule Overview</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700/50">
                                                        {guardSummaries.map((summary) => (
                                                            <tr key={summary.guardKey} className="hover:bg-slate-800/30 transition align-top">
                                                                <td className="py-4 px-6 font-medium text-white">
                                                                    <div className="flex items-start gap-2">
                                                                        <Shield size={16} className="mt-0.5 shrink-0 text-blue-500"/>
                                                                        <div className="min-w-0">
                                                                            <div className="truncate text-white">{getPersonName(summary.guard, "Unassigned")}</div>
                                                                            <div className="text-xs text-slate-500">
                                                                                {summary.days.length} scheduled day{summary.days.length > 1 ? "s" : ""}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-6 text-gray-300">
                                                                    <div className="flex min-w-0 flex-col">
                                                                        <span className="break-words text-white">{summary.deploymentLocation}</span>
                                                                        <span className="mt-1 text-xs text-blue-400">{summary.position}</span>
                                                                        <span className={`mt-2 inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-medium ${
                                                                            summary.shiftType === "Night Shift"
                                                                              ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                                                              : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                                                                        }`}>
                                                                            {summary.shiftType}
                                                                        </span>
                                                                        <span className="mt-2 text-xs leading-5 text-slate-400">
                                                                            {summary.days[0] ? formatTimeRange(summary.days[0].timeIn, summary.days[0].timeOut) : "No time range"}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-6">
                                                                    <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="text-xs uppercase tracking-wide text-slate-500">Coverage</span>
                                                                            <span className="text-xs font-medium text-slate-300">
                                                                                {formatShortDate(summary.days[0]?.timeIn)} to {formatShortDate(summary.days[summary.days.length - 1]?.timeIn)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm text-slate-200">
                                                                            {summary.days.length} assigned day{summary.days.length > 1 ? "s" : ""}
                                                                        </div>
                                                                        <div className="text-xs leading-5 text-slate-400">
                                                                            Open the detail panel to view the full deployment calendar and exact scheduled dates for this batch.
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden divide-y divide-gray-700/50">
                                                {guardSummaries.map((summary) => (
                                                    <div key={summary.guardKey} className="p-4 flex flex-col gap-3">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                            <div className="font-medium text-white flex min-w-0 items-center gap-2">
                                                                <Shield size={16} className="text-blue-500"/>
                                                                <span className="truncate">{getPersonName(summary.guard, "Unassigned")}</span>
                                                            </div>
                                                            <span className="w-fit text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{summary.position}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-400 flex items-start gap-2">
                                                            <MapPin size={16} className="mt-0.5 text-gray-600 shrink-0"/>
                                                            <span className="break-words">{summary.deploymentLocation}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                                                            <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                                                summary.shiftType === "Night Shift"
                                                                  ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                                                  : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                                                            }`}>
                                                                {summary.shiftType}
                                                            </span>
                                                            <span className="text-slate-300">{summary.days.length} day(s)</span>
                                                        </div>
                                                        <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span>Coverage window</span>
                                                                <span className="text-xs text-slate-400">
                                                                    {formatShortDate(summary.days[0]?.timeIn)} to {formatShortDate(summary.days[summary.days.length - 1]?.timeIn)}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 text-xs text-slate-500">
                                                                Tap View Details to inspect the full deployment calendar and all scheduled dates.
                                                            </div>
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
                                )})}

                                <TablePagination
                                    page={currentPage}
                                    limit={LIST_PAGE_SIZE}
                                    totalItems={sortedBatchGroups.length}
                                    currentCount={paginatedBatchGroups.length}
                                    totalPages={totalBatchPages}
                                    label="deployment batches"
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}
                    </div>
                )}
            </>
        )}
      </div>

      {/* ===== ADD CLIENT MODAL ===== */}
      <Transition appear show={Boolean(selectedBatchDetails)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedBatchDetails(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-gradient-to-br from-[#0f172a] to-[#1e293b] shadow-2xl border-l border-slate-700/50">
                    <div className="sticky top-0 z-20 border-b border-slate-700/50 bg-[#0f172a]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Dialog.Title className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner shrink-0">
                              <CalendarDays className="text-blue-400" size={24} />
                            </div>
                            <span className="truncate">{selectedBatchDetails?.client || "Deployment Details"}</span>
                          </Dialog.Title>
                          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300 font-medium">
                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400 shrink-0"/> <span className="truncate max-w-[200px] sm:max-w-none">{selectedBatchDetails?.deploymentLocation}</span></span>
                            <span className="text-slate-600 hidden sm:inline">•</span>
                            <span className="flex items-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0"><Clock size={14} className="text-slate-400 shrink-0"/> {selectedBatchDetails?.shiftType}</span>
                            <span className="text-slate-600 hidden sm:inline">•</span>
                            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-fit mt-1 sm:mt-0 ${
                              selectedBatchDetails?.isApproved === "Approved"
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : selectedBatchDetails?.isApproved === "Declined"
                                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                            }`}>
                              {selectedBatchDetails?.isApproved}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBatchDetails(null)}
                          className="shrink-0 rounded-full bg-slate-800/80 p-2 sm:p-2.5 text-slate-400 hover:bg-red-500 hover:text-white transition-all duration-200 border border-slate-700/50"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6 sm:space-y-8">
                      <div className="rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-[#1e293b]/40 p-5 sm:p-6 lg:p-8 shadow-xl backdrop-blur-sm">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
                          <LayoutGrid size={20} className="text-emerald-400 sm:w-6 sm:h-6" />
                          Deployment Info
                        </h3>
                        <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.3fr_1fr]">
                          <div className="space-y-4 sm:space-y-5">
                            <div className="rounded-xl sm:rounded-2xl border border-slate-700/30 bg-[#0f172a]/60 p-4 sm:p-5 shadow-sm">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                <User size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
                                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-400">Client</div>
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white ml-6 sm:ml-7">{selectedBatchDetails?.client}</div>
                            </div>
                            <div className="rounded-xl sm:rounded-2xl border border-slate-700/30 bg-[#0f172a]/60 p-4 sm:p-5 shadow-sm">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                <MapPin size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
                                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-400">Address</div>
                              </div>
                              <div className="text-sm sm:text-base font-semibold text-slate-200 ml-6 sm:ml-7 leading-relaxed">{selectedBatchDetails?.deploymentLocation}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div className="rounded-xl sm:rounded-2xl border border-slate-700/30 bg-[#0f172a]/60 p-4 sm:p-5 shadow-sm">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                <Clock size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
                                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-400">Shift</div>
                              </div>
                              <div className="text-sm sm:text-base font-bold text-white ml-6 sm:ml-7">{selectedBatchDetails?.shiftType}</div>
                            </div>
                            <div className="rounded-xl sm:rounded-2xl border border-slate-700/30 bg-[#0f172a]/60 p-4 sm:p-5 shadow-sm">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                <Shield size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
                                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-400">Guards</div>
                              </div>
                              <div className="text-sm sm:text-base font-bold text-white ml-6 sm:ml-7">{selectedBatchDetails?.guardSummaries?.length || 0} assigned</div>
                            </div>
                            <div className="rounded-xl sm:rounded-2xl border border-slate-700/30 bg-[#0f172a]/60 p-4 sm:p-5 shadow-sm sm:col-span-2">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                <CalendarDays size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
                                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-400">Batch Range</div>
                              </div>
                              <div className="text-sm sm:text-base font-bold text-blue-400 ml-6 sm:ml-7">
                                {(selectedBatchDetails?.schedules?.length || 0) > 0
                                  ? `${formatShortDate(selectedBatchDetails.schedules[0].timeIn)} - ${formatShortDate(selectedBatchDetails.schedules[selectedBatchDetails.schedules.length - 1].timeIn)}`
                                  : "No schedule dates"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-8">
                        <div className="rounded-3xl border border-slate-700/50 bg-[#1e293b]/40 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
                          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                                <CalendarDays size={24} className="text-blue-400" />
                                Deployment Calendar
                              </h3>
                              <p className="text-sm text-slate-400 mt-2">Scheduled days in this deployment batch</p>
                            </div>
                            <div className="rounded-2xl border border-slate-700/50 bg-[#0f172a]/60 px-6 py-4 text-right flex flex-col items-center justify-center sm:items-end shadow-inner">
                              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Total shifts</div>
                              <div className="text-3xl font-black text-blue-400 leading-none mt-2">{selectedBatchDetails?.schedules?.length || 0}</div>
                            </div>
                          </div>
                          <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-[#0f172a]/50 p-4 shadow-inner relative z-10">
                            <FullCalendar
                              plugins={[dayGridPlugin]}
                              initialView="dayGridMonth"
                              height="auto"
                              headerToolbar={{ left: "prev,next", center: "title", right: "" }}
                              events={(selectedBatchDetails?.schedules || []).map((schedule) => ({
                                id: schedule._id,
                                title: getPersonName(schedule.guardId, "Guard"),
                                start: schedule.timeIn,
                                end: schedule.timeOut,
                                backgroundColor: shiftColors[schedule.shiftType] || "#3b82f6",
                                borderColor: shiftColors[schedule.shiftType] || "#3b82f6",
                                textColor: "#fff",
                              }))}
                            />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-700/50 bg-[#1e293b]/40 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                            <Shield size={24} className="text-indigo-400" />
                            Guard Coverage
                          </h3>
                          <p className="mt-2 text-sm text-slate-400 mb-8">Assigned guards and their coverage window</p>
                          <div className="space-y-4">
                            {(selectedBatchDetails?.guardSummaries || []).map((summary) => (
                              <div key={summary.guardKey} className="rounded-2xl border border-slate-700/50 bg-[#0f172a]/60 p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                <div className="flex items-center gap-5">
                                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                                    {getPersonName(summary.guard, "G").charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-lg font-bold text-white">{getPersonName(summary.guard, "Unassigned")}</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-400">
                                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">{summary.position}</span>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-blue-400 font-semibold">{summary.days.length} shift(s)</span>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-300 bg-slate-800/50 px-2 py-0.5 rounded flex items-center gap-1.5">
                                        <CalendarDays size={12} className="text-slate-500" />
                                        {summary.days.length > 0
                                          ? `${formatShortDate(summary.days[0].timeIn)} - ${formatShortDate(summary.days[summary.days.length - 1].timeIn)}`
                                          : "No dates"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className={`w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0 ${
                                  summary.shiftType === "Night Shift"
                                    ? "border border-red-500/30 bg-red-500/10 text-red-400"
                                    : "border border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                                }`}>
                                  {summary.shiftType}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {selectedBatchDetails?.remarks && (
                        <div className="rounded-2xl border border-red-900/30 bg-red-900/20 p-4 text-sm text-red-200 flex items-start gap-2">
                          <span className="font-bold shrink-0">Note:</span>
                          {selectedBatchDetails.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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
