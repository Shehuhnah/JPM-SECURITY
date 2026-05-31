import React, { useEffect, useMemo, useState, Fragment, useCallback } from "react";
import { getPersonName } from "../utils/name";
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
  Eye,
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
import TablePagination from "../components/admin/TablePagination.jsx";
import "react-toastify/dist/ReactToastify.css";

const api = import.meta.env.VITE_API_URL;
const LIST_PAGE_SIZE = 5;

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
  const [monthFilter, setMonthFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showApproveBatchModal, setShowApproveBatchModal] = useState(false);
  const [batchToApprove, setBatchToApprove] = useState(null);
  const [showDeclineBatchModal, setShowDeclineBatchModal] = useState(false);
  const [batchToDecline, setBatchToDecline] = useState(null);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

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

  // Returns "7:00 AM – 7:00 PM" style label for a schedule entry
  const getShiftTimeRange = (shiftType) => {
    if (shiftType === "Day Shift")   return "7:00 AM – 7:00 PM";
    if (shiftType === "Night Shift") return "7:00 PM – 7:00 AM";
    return "";
  };

  // True when a batch contains both Day Shift and Night Shift entries (= Straight Shift)
  const batchIsStraightShift = (schedules = []) => {
    const types = new Set(schedules.map((s) => s.shiftType));
    return types.has("Day Shift") && types.has("Night Shift");
  };
  const formatMonthValue = (value) => {
    if (!value) return "Unknown month";
    const [year, month] = String(value).split("-").map(Number);
    if (!year || !month) return value;
    return new Date(year, month - 1, 1).toLocaleDateString([], { month: "short", year: "numeric" });
  };
  const getCoveredMonths = (items = []) => {
    const metadataMonths = items[0]?.batchMeta?.coveredMonths;
    if (Array.isArray(metadataMonths) && metadataMonths.length > 0) {
      return [...metadataMonths].sort();
    }

    return [...new Set(
      items
        .map((item) => String(item?.timeIn || "").slice(0, 7))
        .filter((value) => /^\d{4}-\d{2}$/.test(value))
    )].sort();
  };
  const getScopeLabel = (batchMeta, coveredMonths) => {
    if (batchMeta?.scopeType === "count") {
      return `Next ${batchMeta?.monthCount || coveredMonths.length || 1} Months`;
    }
    if (batchMeta?.scopeType === "custom") {
      return "Custom Months";
    }
    return "One Month";
  };
  const getBatchRangeLabel = (items = []) => {
    if (items.length === 0) return "No dates";

    const ordered = items.slice().sort((a, b) => new Date(a.timeIn) - new Date(b.timeIn));
    return `${formatShortDate(ordered[0].timeIn)} - ${formatShortDate(ordered[ordered.length - 1].timeIn)}`;
  };

  const monthOptions = useMemo(
    () =>
      [...new Set(
        schedules
          .map((schedule) => String(schedule?.timeIn || "").slice(0, 7))
          .filter((value) => /^\d{4}-\d{2}$/.test(value))
      )].sort(),
    [schedules]
  );
  const yearOptions = useMemo(
    () =>
      [...new Set(
        schedules
          .flatMap((schedule) => {
            const months = Array.isArray(schedule?.batchMeta?.coveredMonths) && schedule.batchMeta.coveredMonths.length > 0
              ? schedule.batchMeta.coveredMonths
              : [String(schedule?.timeIn || "").slice(0, 7)];
            return months
              .filter((value) => /^\d{4}-\d{2}$/.test(value))
              .map((value) => value.slice(0, 4));
          })
      )].sort(),
    [schedules]
  );

  const filteredSchedules = schedules.filter((s) => {
    const matchesClient = !selectedClient || selectedClient === "All" || s.client === selectedClient;
    const matchesStatus = !statusFilter || statusFilter === "All" || s.isApproved === statusFilter;
    const coveredMonths = Array.isArray(s.batchMeta?.coveredMonths) && s.batchMeta.coveredMonths.length > 0
      ? s.batchMeta.coveredMonths
      : [String(s.timeIn || "").slice(0, 7)];
    const matchesMonth = monthFilter === "All" || coveredMonths.includes(monthFilter);
    const coveredYears = coveredMonths
      .filter((value) => /^\d{4}-\d{2}$/.test(value))
      .map((value) => value.slice(0, 4));
    const matchesYear = yearFilter === "All" || coveredYears.includes(yearFilter);
    return matchesClient && matchesStatus && matchesMonth && matchesYear;
  });

  const getCreatedAtValue = (schedule) => new Date(schedule?.createdAt || 0).getTime();
  const formatShortDate = (value) =>
    new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });

  const formatTimeRange = (timeIn, timeOut) =>
    `${new Date(timeIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(timeOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  const calendarEvents = filteredSchedules.map((s) => ({
    id: s._id,
    title: `${getPersonName(s.guardId, "Unassigned")} (${s.shiftType})`,
    start: s.timeIn,
    end: s.timeOut,
    backgroundColor: s.isApproved === "Approved" ? "#22c55e" : (shiftColors[s.shiftType] || "#3b82f6"),
    borderColor: s.isApproved === "Approved" ? "#22c55e" : (shiftColors[s.shiftType] || "#3b82f6"),
    textColor: "#fff",
    extendedProps: s,
  }));

  const groupedForTable = useMemo(() => {
    const grouped = filteredSchedules.reduce((acc, schedule) => {
      const key = schedule.batchId || schedule._id;
      if (!acc[key]) {
        const seedSchedules = [schedule];
        const coveredMonths = getCoveredMonths(seedSchedules);
        acc[key] = {
          batchId: schedule.batchId || schedule._id,
          client: schedule.client,
          deploymentLocation: schedule.deploymentLocation,
          shiftType: schedule.shiftType,
          isApproved: schedule.isApproved,
          batchMeta: schedule.batchMeta || null,
          coveredMonths,
          scopeLabel: getScopeLabel(schedule.batchMeta, coveredMonths),
          schedules: [],
          latestCreatedAt: 0,
        };
      }
      acc[key].schedules.push(schedule);
      acc[key].coveredMonths = getCoveredMonths(acc[key].schedules);
      acc[key].scopeLabel = getScopeLabel(acc[key].batchMeta, acc[key].coveredMonths);
      acc[key].latestCreatedAt = Math.max(acc[key].latestCreatedAt, getCreatedAtValue(schedule));
      return acc;
    }, {});

    return Object.values(grouped)
      .map((g) => ({ ...g, isStraightShift: batchIsStraightShift(g.schedules) }))
      .sort((a, b) => b.latestCreatedAt - a.latestCreatedAt);
  }, [filteredSchedules]);

  const getGuardSummaries = useCallback((group) => {
    if (!group?.schedules?.length) return [];

    return Object.values(
      group.schedules.reduce((acc, schedule) => {
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
  }, []);

  const openBatchDetails = (group) => {
    setSelectedBatchDetails({
      ...group,
      coveredMonths: getCoveredMonths(group.schedules),
      scopeLabel: getScopeLabel(group.batchMeta, getCoveredMonths(group.schedules)),
      rangeLabel: getBatchRangeLabel(group.schedules),
      guardSummaries: getGuardSummaries(group),
    });
  };

  const totalBatchPages = Math.max(1, Math.ceil(groupedForTable.length / LIST_PAGE_SIZE));
  const paginatedGroups = groupedForTable.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, statusFilter, monthFilter, yearFilter, viewMode]);

  useEffect(() => {
    if (currentPage > totalBatchPages) {
      setCurrentPage(totalBatchPages);
    }
  }, [currentPage, totalBatchPages]);

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

            <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                <option value="All">All Months</option>
                {monthOptions.map((monthValue) => (
                    <option key={monthValue} value={monthValue}>
                        {formatMonthValue(monthValue)}
                    </option>
                ))}
            </select>

            <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                <option value="All">All Years</option>
                {yearOptions.map((yearValue) => (
                    <option key={yearValue} value={yearValue}>
                        {yearValue}
                    </option>
                ))}
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
                        {groupedForTable.length === 0 ? (
                             <div className="text-center py-20 text-gray-500">No schedules found matching your filters.</div>
                        ) : (
                            <>
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-[#0f172a]/60 px-4 py-3">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Table size={16} className="text-blue-400" />
                                    <span>Showing newest schedule batches first</span>
                                </div>
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    {groupedForTable.length} batches
                                </span>
                            </div>

                            {paginatedGroups.map((group) => {
                                const guardSummaries = getGuardSummaries(group);
                                return (
                                <div key={group.batchId} className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-md">
                                    {/* Group Header */}
                                    <div className="p-4 bg-slate-800/50 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${group.isStraightShift ? 'bg-violet-500' : group.shiftType === 'Night Shift' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{group.client}</h3>
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                                    <span className="text-gray-300">{group.deploymentLocation}</span>
                                                    <span>•</span>
                                                    <span className={group.isStraightShift ? 'text-violet-400' : group.shiftType === 'Night Shift' ? 'text-red-400' : 'text-yellow-400'}>{group.isStraightShift ? 'Straight Shift' : group.shiftType}</span>
                                                    <span>•</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                        group.isApproved === "Approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                        group.isApproved === "Declined" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                    }`}>
                                                        {group.isApproved}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-300">
                                                        {group.scopeLabel}
                                                    </span>
                                                    <span className="rounded-full border border-slate-600 bg-slate-900/60 px-2.5 py-1 text-slate-300">
                                                        {group.coveredMonths.length} month{group.coveredMonths.length === 1 ? "" : "s"}
                                                    </span>
                                                    <span className="rounded-full border border-slate-600 bg-slate-900/60 px-2.5 py-1 text-slate-300">
                                                        {group.schedules.length} shift{group.schedules.length === 1 ? "" : "s"}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        {group.coveredMonths.map(formatMonthValue).join(", ")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => openBatchDetails(group)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600/90 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                            >
                                                <Eye size={16} /> View Details
                                            </button>
                                        {group.isApproved === "Pending" && (
                                            <>
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
                                            </>
                                        )}
                                            </div>
                                    </div>

                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full table-fixed text-left text-sm">
                                            <colgroup>
                                                <col className="w-[28%]" />
                                                <col className="w-[42%]" />
                                                <col className="w-[30%]" />
                                            </colgroup>
                                            <thead className="bg-[#0f172a] text-gray-400 border-b border-gray-700">
                                                <tr>
                                                    <th className="py-3 px-6 font-medium">Guard Name</th>
                                                    <th className="py-3 px-6 font-medium">Assignment Summary</th>
                                                    <th className="py-3 px-6 font-medium">Schedule Overview</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700/50">
                                                {guardSummaries.map((summary) => (
                                                    <tr key={summary.guardKey} className="hover:bg-slate-800/30 transition align-top">
                                                        <td className="py-4 px-6 font-medium text-white">
                                                            <div className="flex items-start gap-2">
                                                                <User size={16} className="mt-0.5 shrink-0 text-gray-500"/>
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
                                                                {(() => {
                                                                  const isSSGuard = batchIsStraightShift(
                                                                    (group.schedules || []).filter(
                                                                      (s) => (s.guardId?._id || s.guardId) === summary.guardKey
                                                                    )
                                                                  );
                                                                  return (
                                                                    <span className={`mt-2 inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-medium ${
                                                                      isSSGuard
                                                                        ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                                                        : summary.shiftType === "Night Shift"
                                                                          ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                                                          : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                                                                    }`}>
                                                                      {isSSGuard ? "Straight Shift" : summary.shiftType}
                                                                    </span>
                                                                  );
                                                                })()}
                                                                <span className="mt-2 text-xs leading-5 text-slate-400">
                                                                    {formatTimeRange(summary.days[0]?.timeIn, summary.days[0]?.timeOut)}
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
                                                                    Open the detail panel to view the full calendar and exact scheduled dates for this deployment batch.
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
                                                        <Shield size={16} className="shrink-0 text-blue-500"/>
                                                        <span className="truncate">{getPersonName(summary.guard)}</span>
                                                    </div>
                                                    <span className="w-fit text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{summary.position}</span>
                                                </div>
                                                <div className="text-sm text-gray-400 flex items-start gap-2">
                                                    <MapPin size={16} className="mt-0.5 text-gray-600 shrink-0"/>
                                                    <span className="break-words">{summary.deploymentLocation}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                                                    {(() => {
                                                      const isSSGuardM = batchIsStraightShift(
                                                        (group.schedules || []).filter(
                                                          (s) => (s.guardId?._id || s.guardId) === summary.guardKey
                                                        )
                                                      );
                                                      return (
                                                        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                                          isSSGuardM
                                                            ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                                            : summary.shiftType === "Night Shift"
                                                              ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                                              : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                                                        }`}>
                                                          {isSSGuardM ? "Straight Shift" : summary.shiftType}
                                                        </span>
                                                      );
                                                    })()}
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
                                                        Tap View Details to inspect the full batch calendar and all scheduled dates.
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )})}

                            <TablePagination
                                page={currentPage}
                                limit={LIST_PAGE_SIZE}
                                totalItems={groupedForTable.length}
                                currentCount={paginatedGroups.length}
                                totalPages={totalBatchPages}
                                label="schedule batches"
                                onPageChange={setCurrentPage}
                            />
                            </>
                        )}
                    </div>
                )}
            </>
        )}
      </div>

      {/* ===== MODALS ===== */}

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
                    
                    {/* Header */}
                    <div className="sticky top-0 z-20 border-b border-slate-700/50 bg-[#0f172a]/90 backdrop-blur-md px-6 sm:px-8 py-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Dialog.Title className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                              <CalendarDays className="text-blue-400" size={28} />
                            </div>
                            {selectedBatchDetails?.client || "Deployment Details"}
                          </Dialog.Title>
                          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-300 font-medium">
                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> {selectedBatchDetails?.deploymentLocation}</span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {batchIsStraightShift(selectedBatchDetails?.schedules || []) ? "Straight Shift" : selectedBatchDetails?.shiftType}</span>
                            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                              {selectedBatchDetails?.scopeLabel}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                              selectedBatchDetails?.isApproved === "Approved"
                                ? "border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                : selectedBatchDetails?.isApproved === "Declined"
                                  ? "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                            }`}>
                              {selectedBatchDetails?.isApproved}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBatchDetails(null)}
                          className="rounded-full bg-slate-800/80 p-2.5 text-slate-400 hover:bg-red-500 hover:text-white transition-all duration-200 border border-slate-700/50"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                  <div className="p-6 sm:p-8 flex-1 space-y-8">
                    <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-[#1e293b]/50 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_28%)]" />
                      <div className="relative">
                        <div className="mb-8 flex flex-col gap-4 border-b border-slate-700/50 pb-6 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                               <LayoutGrid size={24} className="text-emerald-400" />
                               Deployment Info
                            </h3>
                            <p className="mt-2 text-sm text-slate-400">
                              Overview of this deployment batch and its scheduling coverage.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                             <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                               {selectedBatchDetails?.scopeLabel}
                             </span>
                             {batchIsStraightShift(selectedBatchDetails?.schedules || []) ? (
                               <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                                 ⚡ Straight Shift
                               </span>
                             ) : (
                               <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
                                 selectedBatchDetails?.shiftType === "Night Shift"
                                   ? "border-red-500/20 bg-red-500/10 text-red-300"
                                   : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                               }`}>
                                 {selectedBatchDetails?.shiftType}
                                 {getShiftTimeRange(selectedBatchDetails?.shiftType) && (
                                   <span className="ml-1.5 font-normal opacity-80">
                                     &middot; {getShiftTimeRange(selectedBatchDetails?.shiftType)}
                                   </span>
                                 )}
                               </span>
                             )}
                           </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
                          <div className="rounded-[28px] border border-slate-700/50 bg-[#0b1220]/85 p-6 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Primary Deployment
                                </div>
                                <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                  {selectedBatchDetails?.client || "No client"}
                                </div>
                              </div>
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                                <User size={18} className="text-emerald-300" />
                              </div>
                            </div>

                            <div className="mt-6 grid gap-4">
                              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  <MapPin size={14} className="text-slate-400" />
                                  Deployment Address
                                </div>
                                <div className="mt-3 text-sm leading-6 text-slate-200">
                                  {selectedBatchDetails?.deploymentLocation || "No deployment address"}
                                </div>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Batch Range
                                  </div>
                                  <div className="mt-3 text-base font-semibold text-blue-300">
                                    {selectedBatchDetails?.rangeLabel || "No dates"}
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Covered Months
                                  </div>
                                  <div className="mt-3 text-sm font-semibold leading-6 text-white">
                                    {selectedBatchDetails?.coveredMonths?.map(formatMonthValue).join(", ") || "No months"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-[26px] border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  Assigned Guards
                                </div>
                                <Shield size={16} className="text-emerald-300" />
                              </div>
                              <div className="mt-4 text-3xl font-black tracking-tight text-white">
                                {selectedBatchDetails?.guardSummaries?.length || 0}
                              </div>
                              <div className="mt-2 text-sm text-slate-400">
                                Personnel scheduled in this batch
                              </div>
                            </div>

                            <div className="rounded-[26px] border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  Total Shifts
                                </div>
                                <CalendarDays size={16} className="text-blue-300" />
                              </div>
                              <div className="mt-4 text-3xl font-black tracking-tight text-white">
                                {selectedBatchDetails?.schedules?.length || 0}
                              </div>
                              <div className="mt-2 text-sm text-slate-400">
                                Scheduled duty entries across all guards
                              </div>
                            </div>

                            <div className="rounded-[26px] border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] sm:col-span-2 xl:col-span-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  Scheduling Scope
                                </div>
                                <Clock size={16} className="text-amber-300" />
                              </div>
                              <div className="mt-4 text-lg font-bold text-white">
                                {selectedBatchDetails?.scopeLabel}
                              </div>
                              <div className="mt-2 text-sm leading-6 text-slate-400">
                                {selectedBatchDetails?.coveredMonths?.length || 0} month(s) covered for this deployment approval batch.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  <div className="grid gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                        
                        {/* Deployment Calendar */}
                        <div className="rounded-3xl border border-slate-700/50 bg-[#1e293b]/40 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                          
                          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                                <CalendarDays size={24} className="text-blue-400" />
                                Deployment Calendar
                              </h3>
                              <p className="text-sm text-slate-400 mt-2">Scheduled days in this batch</p>
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

                        {/* Guard Coverage */}
                        <div className="rounded-3xl border border-slate-700/50 bg-[#1e293b]/40 p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 relative z-10">
                            <Shield size={24} className="text-indigo-400" />
                            Guard Coverage
                          </h3>
                          <p className="mt-2 text-sm text-slate-400 mb-8 relative z-10">Assigned guards and their coverage window</p>
                          <div className="space-y-4 relative z-10">
                            {(selectedBatchDetails?.guardSummaries || []).map((summary) => (
                              <div key={summary.guardKey} className="group rounded-2xl border border-slate-700/50 bg-[#0f172a]/60 hover:bg-[#0f172a]/80 transition-all duration-300 p-5 shadow-md hover:shadow-xl hover:border-slate-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                <div className="flex items-center gap-5">
                                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:scale-105 transition-transform duration-300 shrink-0">
                                    {getPersonName(summary.guard).charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-lg font-bold text-white">{getPersonName(summary.guard)}</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-400">
                                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">{summary.position}</span>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-blue-400 font-semibold">{summary.days.length} shift(s)</span>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-300 bg-slate-800/50 px-2 py-0.5 rounded flex items-center gap-1.5">
                                        <CalendarDays size={12} className="text-slate-500"/>
                                        {summary.days.length > 0 
                                          ? `${formatShortDate(summary.days[0].timeIn)} - ${formatShortDate(summary.days[summary.days.length - 1].timeIn)}` 
                                          : "No dates"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {(() => {
                                  // Check if this guard has both Day & Night shifts in this batch
                                  const guardShiftTypes = new Set(
                                    (selectedBatchDetails?.schedules || [])
                                      .filter(s => (s.guardId?._id || s.guardId) === summary.guardKey)
                                      .map(s => s.shiftType)
                                  );
                                  const isStraightShiftGuard = guardShiftTypes.has("Day Shift") && guardShiftTypes.has("Night Shift");
                                  return isStraightShiftGuard ? (
                                    <span className="w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0 sm:self-center border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                      ⚡ Straight Shift
                                    </span>
                                  ) : (
                                    <span className={`w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0 sm:self-center ${
                                      summary.shiftType === "Night Shift"
                                        ? "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                        : "border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                                    }`}>
                                      {summary.shiftType}
                                      {getShiftTimeRange(summary.shiftType) && (
                                        <span className="ml-1 font-normal opacity-75 text-[10px]">
                                          &middot; {getShiftTimeRange(summary.shiftType)}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Footer if Pending */}
                    {selectedBatchDetails?.isApproved === "Pending" && (
                      <div className="sticky bottom-0 z-20 border-t border-slate-700/50 bg-[#0f172a]/90 backdrop-blur-lg px-6 py-5 mt-auto">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                           <div className="text-sm text-slate-400 hidden sm:flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Shield size={20} />
                             </div>
                             <div>
                               <p className="font-bold text-slate-300 text-base">Pending Action</p>
                               <p className="text-xs mt-0.5">Review the batch details before making a decision.</p>
                             </div>
                           </div>
                           <div className="flex gap-4 w-full sm:w-auto">
                              <button
                                onClick={() => {
                                  setSelectedBatchDetails(null);
                                  openDeclineBatchModal(selectedBatchDetails.schedules.map(s => s._id));
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 border border-slate-600 hover:border-red-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                              >
                                <ThumbsDown size={18} /> Decline
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBatchDetails(null);
                                  openApproveBatchModal(selectedBatchDetails.schedules.map(s => s._id));
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                              >
                                <ThumbsUp size={18} /> Approve Batch
                              </button>
                           </div>
                        </div>
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
