import { useState, useEffect, useCallback, useMemo } from "react";
import { Shield, Clock, Search, CalendarCheck2, Pencil, MapPin, Briefcase, User, Calendar as CalendarIcon, ChevronLeft, Trash2, X, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getPersonInitial, getPersonName } from "../utils/name";

const api = import.meta.env.VITE_API_URL;
const WEEKDAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];
const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Custom CSS to force Dark Mode on React Day Picker with Responsive Cell Sizes
const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #3b82f6;
    --rdp-background-color: #1e293b;
    margin: 0;
  }
  /* Smaller cells for mobile screens */
  @media (max-width: 640px) {
    .rdp {
      --rdp-cell-size: 34px; 
    }
  }
  .rdp-day_selected:not([disabled]) { 
    background-color: #3b82f6; 
    color: white;
    font-weight: bold;
  }
  .rdp-day:hover:not([disabled]) { 
    background-color: #334155; 
  }
  .rdp-caption_label, .rdp-head_cell, .rdp-day {
    color: #e2e8f0;
  }
  .rdp-button:hover:not([disabled]) {
    background-color: #334155;
  }
`;

export default function AdminAddSchedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State
  const [isEditMode, setIsEditMode] = useState(false);
  const [guards, setGuards] = useState([]);
  const [clients, setClients] = useState([]);
  const [leaveAvailability, setLeaveAvailability] = useState([]);
  const [selectedGuards, setSelectedGuards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [targetMonths, setTargetMonths] = useState([format(new Date(), "yyyy-MM")]);
  const [selectedWeekdays, setSelectedWeekdays] = useState([1, 2, 3, 4, 5]);
  const [loadingPage, setLoadingPage] = useState(false);
  
  const [form, setForm] = useState({
    deploymentLocation: "",
    client: "",
    position: "",
    shiftType: "",
    timeIn: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    timeOut: "",
  });

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guardsRes, clientsRes, leaveRes] = await Promise.all([
          fetch(`${api}/api/guards`, { credentials: "include" }),
          fetch(`${api}/api/clients/get-clients`, { credentials: "include" }),
          fetch(`${api}/api/leaves/deployment-availability`, { credentials: "include" }),
        ]);

        const [guardsData, clientsData, leaveData] = await Promise.all([
          guardsRes.json(),
          clientsRes.json(),
          leaveRes.json(),
        ]);

        if (!guardsRes.ok) throw new Error(guardsData.message || "Failed to fetch guards");
        if (!clientsRes.ok) throw new Error(clientsData.message || "Failed to fetch clients");
        if (!leaveRes.ok) throw new Error(leaveData.message || "Failed to fetch leave availability");

        setGuards(guardsData);
        setClients(clientsData);
        setLeaveAvailability(Array.isArray(leaveData) ? leaveData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load initial data");
      }
    };

    if (user) fetchData();
  }, [user]);

  // --- Fetch Edit Data ---
  useEffect(() => {
    if (id && guards.length > 0) {
      setIsEditMode(true);
      const fetchScheduleData = async () => {
        try {
          setLoadingPage(true);
          const res = await fetch(`${api}/api/schedules/get-by-batch/${id}`, { credentials: "include" });
          if (!res.ok) throw new Error("Failed to fetch schedule batch");
          
          const batchData = await res.json();

          if (batchData.length > 0) {
            const firstSched = batchData[0];
            setForm({
              deploymentLocation: firstSched.deploymentLocation,
              client: firstSched.client,
              position: firstSched.position,
              shiftType: firstSched.shiftType,
              timeIn: "",
              timeOut: "",
            });

            const batchGuardIds = [...new Set(
              batchData.map((s) => String(s.guardId?._id || s.guardId))
            )];
            setSelectedGuards(guards.filter((guard) => batchGuardIds.includes(guard._id)));

            const uniqueDays = [...new Set(batchData.map((s) => format(new Date(s.timeIn), "yyyy-MM-dd")))];
            const days = uniqueDays.map((day) => new Date(day));
            setSelectedDays(days);
            if (days.length > 0) {
              const uniqueMonths = [...new Set(days.map((day) => format(day, "yyyy-MM")))].sort();
              const persistedBatchMeta = firstSched.batchMeta || null;
              setSelectedMonth(persistedBatchMeta?.anchorMonth || uniqueMonths[0]);
              setTargetMonths(
                Array.isArray(persistedBatchMeta?.coveredMonths) && persistedBatchMeta.coveredMonths.length > 0
                  ? [...persistedBatchMeta.coveredMonths].sort()
                  : uniqueMonths
              );
            }
          }
        } catch (err) {
          toast.error(`Error: ${err.message}`);
        } finally {
          setLoadingPage(false);
        }
      };
      fetchScheduleData();
    }
  }, [id, guards]);

  // --- Handlers ---
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getMonthLabel = useCallback((monthValue) => {
    if (!monthValue) return "";

    const [year, month] = monthValue.split("-").map(Number);
    return format(new Date(year, month - 1, 1), "MMMM yyyy");
  }, []);

  const getTargetMonths = useCallback(() => {
    if (targetMonths.length > 0) {
      return [...targetMonths].sort();
    }

    return selectedMonth ? [selectedMonth] : [];
  }, [selectedMonth, targetMonths]);

  const buildBatchMeta = useCallback((days = selectedDays) => {
    const coveredMonths = [...new Set(days.map((day) => format(day, "yyyy-MM")))].sort();

    return {
      scopeType: coveredMonths.length > 1 ? "custom" : "single",
      anchorMonth: selectedMonth,
      monthCount: coveredMonths.length || 1,
      coveredMonths,
    };
  }, [selectedDays, selectedMonth]);

  const getMonthDaysByWeekdays = useCallback((monthValue, weekdayValues) => {
    if (!monthValue || weekdayValues.length === 0) return [];

    const [year, month] = monthValue.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);

    return eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((day) =>
      weekdayValues.includes(getDay(day))
    );
  }, []);

  const mergeSelectedDays = useCallback((days) => {
    const uniqueDays = [...new Map(days.map((day) => [format(day, "yyyy-MM-dd"), day])).values()];
    setSelectedDays(uniqueDays.sort((a, b) => a.getTime() - b.getTime()));
  }, []);

  const removeDaysFromMonths = useCallback((monthsToClear) => {
    if (monthsToClear.length === 0) return;

    setSelectedDays((prev) =>
      prev.filter((day) => !monthsToClear.includes(format(day, "yyyy-MM")))
    );
  }, []);

  const handleClientChange = (e) => {
    const selectedClientName = e.target.value;
    const clientData = clients.find((c) => c.clientName === selectedClientName);

    setForm((prev) => ({
      ...prev,
      client: selectedClientName,
      deploymentLocation: clientData ? clientData.clientAddress : "", 
    }));
  };

  const handleWeekdayToggle = (weekday) => {
    setSelectedWeekdays((prev) =>
      prev.includes(weekday)
        ? prev.filter((value) => value !== weekday)
        : [...prev, weekday].sort((a, b) => a - b)
    );
  };

  const applyMonthPreset = (type) => {
    const targetMonths = getTargetMonths();
    if (targetMonths.length === 0) {
      toast.error("Please choose at least one month first.");
      return;
    }

    let weekdayValues = selectedWeekdays;

    if (type === "all") {
      weekdayValues = WEEKDAY_OPTIONS.map((option) => option.value);
      setSelectedWeekdays(weekdayValues);
    } else if (type === "weekdays") {
      weekdayValues = [1, 2, 3, 4, 5];
      setSelectedWeekdays(weekdayValues);
    } else if (type === "weekends") {
      weekdayValues = [0, 6];
      setSelectedWeekdays(weekdayValues);
    }

    mergeSelectedDays(
      targetMonths.flatMap((monthValue) => getMonthDaysByWeekdays(monthValue, weekdayValues))
    );
  };

  const clearCurrentMonthSelection = () => {
    if (!selectedMonth) return;
    removeDaysFromMonths([selectedMonth]);
  };

  const clearTargetMonthSelection = () => {
    const targetMonths = getTargetMonths();
    if (targetMonths.length === 0) return;

    removeDaysFromMonths(targetMonths);
  };

  const addTargetMonth = (monthValue) => {
    if (!monthValue) return;

    setTargetMonths((prev) => {
      if (prev.includes(monthValue)) {
        toast.info(`${getMonthLabel(monthValue)} is already in target months.`);
        return prev;
      }

      return [...prev, monthValue].sort();
    });
  };

  const addFocusedMonthToTargetSelection = () => {
    if (!selectedMonth) return;
    addTargetMonth(selectedMonth);
  };

  const addNextTargetMonth = () => {
    const months = getTargetMonths();
    const baseMonth = months[months.length - 1] || selectedMonth;
    if (!baseMonth) return;

    const [year, month] = baseMonth.split("-").map(Number);
    const nextMonth = format(new Date(year, month, 1), "yyyy-MM");
    addTargetMonth(nextMonth);
  };

  const removeTargetMonth = (monthValue) => {
    setTargetMonths((prev) => prev.filter((value) => value !== monthValue));
    removeDaysFromMonths([monthValue]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedGuards.length === 0) return toast.error("Please select at least one guard first!");
    if (selectedDays.length === 0) return toast.error("Please select at least one date!");

    setLoadingPage(true);

    const shiftTimes = form.shiftType === "Night Shift"
      ? { timeIn: "19:00", timeOut: "07:00" }
      : { timeIn: "07:00", timeOut: "19:00" };

    const schedules = selectedGuards.flatMap((guard) =>
      selectedDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const timeInFull = `${dateStr}T${shiftTimes.timeIn}`;
        let timeOutFull = `${dateStr}T${shiftTimes.timeOut}`;

        if (form.shiftType === "Night Shift") {
          const nextDay = new Date(day);
          nextDay.setDate(nextDay.getDate() + 1);
          timeOutFull = `${format(nextDay, "yyyy-MM-dd")}T${shiftTimes.timeOut}`;
        }

        return {
          guardId: guard._id,
          deploymentLocation: form.deploymentLocation,
          client: form.client,
          position: form.position,
          shiftType: form.shiftType,
          timeIn: timeInFull,
          timeOut: timeOutFull,
        };
      })
    );
    const batchMeta = buildBatchMeta(selectedDays);

    try {
      let res;
      if (isEditMode) {
        res = await fetch(`${api}/api/schedules/batch/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedules, batchMeta }),
        });
      } else {
        res = await fetch(`${api}/api/schedules/create-schedule`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedules, batchMeta }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed");

      toast.success(isEditMode ? "Schedule updated successfully!" : "Schedule assigned successfully!");
      
      // Delay navigation slightly to let toast show
      setTimeout(() => navigate("/admin/deployment"), 1500);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingPage(false);
    }
  };

  const filteredGuards = guards.filter((g) =>
    getPersonName(g, "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDateStrings = useMemo(
    () => selectedDays.map((day) => format(day, "yyyy-MM-dd")),
    [selectedDays]
  );

  const browseMonthParts = useMemo(() => {
    const [year = format(new Date(), "yyyy"), month = format(new Date(), "MM")] = String(selectedMonth || "").split("-");
    return { year, month };
  }, [selectedMonth]);

  const browseYearOptions = useMemo(() => {
    const explicitYears = getTargetMonths()
      .map((monthValue) => String(monthValue).slice(0, 4))
      .filter(Boolean);
    const currentYear = new Date().getFullYear();
    const rangeYears = Array.from({ length: 9 }, (_, index) => String(currentYear - 2 + index));
    return [...new Set([...explicitYears, ...rangeYears])].sort((a, b) => Number(a) - Number(b));
  }, [getTargetMonths]);

  const handleBrowseMonthPartChange = (part, value) => {
    const nextYear = part === "year" ? value : browseMonthParts.year;
    const nextMonth = part === "month" ? value : browseMonthParts.month;
    setSelectedMonth(`${nextYear}-${nextMonth}`);
  };

  const getGuardLeaveConflict = useCallback((guardId) => {
    if (!guardId || selectedDateStrings.length === 0) return null;

    const conflict = leaveAvailability.find((leave) => {
      return leave.guardId === guardId && selectedDateStrings.some((date) => (leave.dates || []).includes(date));
    });

    if (!conflict) return null;

    const overlapDate = selectedDateStrings.find((date) => (conflict.dates || []).includes(date));
    return {
      ...conflict,
      overlapDate,
    };
  }, [leaveAvailability, selectedDateStrings]);

  useEffect(() => {
    setSelectedGuards((prev) => {
      const availableGuards = prev.filter((guard) => !getGuardLeaveConflict(guard._id));
      if (availableGuards.length === prev.length) {
        return prev;
      }

      if (availableGuards.length !== prev.length) {
        prev
          .filter((guard) => getGuardLeaveConflict(guard._id))
          .forEach((guard) => {
            const leaveConflict = getGuardLeaveConflict(guard._id);
            if (leaveConflict) {
              toast.warning(`${getPersonName(guard)} is on approved leave on ${leaveConflict.overlapDate}.`);
            }
          });
      }
      return availableGuards;
    });
  }, [selectedDays, leaveAvailability, getGuardLeaveConflict]);

  const isGuardSelected = (guardId) => selectedGuards.some((guard) => guard._id === guardId);

  const toggleGuardSelection = (guard) => {
    const leaveConflict = getGuardLeaveConflict(guard._id);
    const isStatusBlocked = !["Active", "On Leave"].includes(guard.status);

    if (isStatusBlocked) {
      toast.warning("Only active guards can be deployed.");
      return;
    }

    if (leaveConflict) {
      toast.warning(`${getPersonName(guard)} is on approved leave on ${leaveConflict.overlapDate}.`);
      return;
    }

    setSelectedGuards((prev) =>
      prev.some((item) => item._id === guard._id)
        ? prev.filter((item) => item._id !== guard._id)
        : [...prev, guard]
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-3 md:p-8 font-sans">
      <style>{datePickerStyles}</style>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full">
            <button onClick={() => navigate("/admin/deployment")} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
                <ChevronLeft size={20} className="text-gray-400"/>
            </button>
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-3 text-white">
                {isEditMode ? <Pencil className="text-yellow-400" size={24} /> : <CalendarCheck2 className="text-blue-400" size={24} />}
                {isEditMode ? "Edit Schedule" : "New Deployment"}
            </h1>
        </div>
      </div>

      {/* Main Layout - Stack on Mobile, Row on Desktop */}
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-140px)]">
        
        {/* --- LEFT SIDE: GUARD LIST --- */}
        {/* Mobile: Fixed height to allow scrolling but prevent taking up whole screen */}
        <div className="w-full lg:w-1/3 bg-[#1e293b] rounded-2xl border border-gray-700 shadow-xl flex flex-col h-72 lg:h-auto overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-700 bg-slate-800/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Shield className="text-blue-400" size={20} /> Select Guard
            </h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg pl-9 pr-4 py-3 text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredGuards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <User size={32} className="mb-2 opacity-50"/>
                  <p className="text-sm">No guards found.</p>
              </div>
            ) : (
              filteredGuards.map((guard) => (
                (() => {
                  const leaveConflict = getGuardLeaveConflict(guard._id);
                  const isStatusBlocked = !["Active", "On Leave"].includes(guard.status);
                  const isUnavailable = isStatusBlocked || Boolean(leaveConflict);

                  return (
                    <div
                      key={guard._id}
                      onClick={() => toggleGuardSelection(guard)}
                      className={`p-3 rounded-xl transition-all border ${
                        isUnavailable
                          ? "bg-slate-900/70 border-slate-800 cursor-not-allowed opacity-70"
                          : isGuardSelected(guard._id)
                            ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-900/20 cursor-pointer"
                            : "bg-[#0f172a]/50 hover:bg-[#0f172a] border-transparent hover:border-gray-600 cursor-pointer"
                      }`}
                    >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                        isGuardSelected(guard._id) ? "bg-blue-500 text-white" : "bg-slate-700 text-gray-300"
                    }`}>
                        {getPersonInitial(guard)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate text-base sm:text-sm">{getPersonName(guard)}</p>
                      <p className="text-xs text-gray-400 truncate">{guard.position}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                        leaveConflict
                          ? "bg-red-500/20 text-red-400"
                          : guard.status === "Active"
                            ? "bg-green-500/20 text-green-400"
                            : guard.status === "On Leave"
                              ? "bg-amber-500/20 text-amber-400"
                            : "bg-gray-600/30 text-gray-500"
                    }`}>
                        {leaveConflict ? "On Leave" : guard.status}
                    </span>
                  </div>
                  {leaveConflict ? (
                    <p className="mt-2 text-[11px] text-red-400">
                      Unavailable on {leaveConflict.overlapDate}
                    </p>
                  ) : null}
                    </div>
                  );
                })()
              ))
            )}
          </div>
        </div>

        {/* --- RIGHT SIDE: FORM --- */}
        <div className="w-full lg:w-2/3 bg-[#1e293b] rounded-2xl border border-gray-700 shadow-xl flex flex-col overflow-y-auto">
            <div className="p-4 md:p-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Briefcase className="text-blue-400" size={22} /> Deployment Details
                    </h2>
                    {selectedGuards.length > 0 && (
                        <div className="w-full sm:w-auto rounded-lg border border-blue-500/30 bg-blue-900/30 px-3 py-2">
                            <div className="mb-2 flex items-center gap-2 text-xs text-blue-300">
                                <Users size={14} />
                                <span>Assigning to {selectedGuards.length} guard(s)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedGuards.map((guard) => (
                                    <div key={guard._id} className="flex items-center gap-2 rounded-full bg-blue-800/50 px-3 py-1 text-sm text-white">
                                        <span className="max-w-40 truncate">{getPersonName(guard)}</span>
                                        <button
                                            onClick={() => setSelectedGuards((prev) => prev.filter((item) => item._id !== guard._id))}
                                            className="rounded-full bg-blue-700/70 p-0.5 text-blue-100 transition-colors hover:bg-blue-600"
                                            type="button"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col 2xl:flex-row gap-8">
                    
                    {/* INPUTS COLUMN */}
                    <div className="flex-1 space-y-5">
                        {/* Client & Position */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Client</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                                    <select
                                        name="client"
                                        value={form.client}
                                        onChange={handleClientChange}
                                        className="w-full bg-[#0f172a] border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map((client) => (
                                            <option key={client._id} value={client.clientName}>{client.clientName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Position</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                                    <input
                                        name="position"
                                        value={form.position}
                                        onChange={handleChange}
                                        placeholder="e.g. Head Guard"
                                        className="w-full bg-[#0f172a] border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Deployment Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                                <input
                                    name="deploymentLocation"
                                    value={form.deploymentLocation}
                                    onChange={handleChange}
                                    placeholder="Enter full address"
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Shift Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Shift Type</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                                <select
                                    name="shiftType"
                                    value={form.shiftType}
                                    onChange={handleChange}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Select Shift</option>
                                    <option value="Day Shift">Day Shift (7:00 AM - 7:00 PM)</option>
                                    <option value="Night Shift">Night Shift (7:00 PM - 7:00 AM)</option>
                                </select>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Guards must have at least 8 hours of rest between shifts. Back-to-back 24-hour duty is blocked.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-700 bg-slate-900/40 p-4">
                            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-300">
                                <CalendarIcon size={16} /> Monthly Schedule
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Browse Month</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={browseMonthParts.month}
                                            onChange={(e) => handleBrowseMonthPartChange("month", e.target.value)}
                                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-base sm:text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                        >
                                            {MONTH_OPTIONS.map((monthOption) => (
                                                <option key={monthOption.value} value={monthOption.value}>
                                                    {monthOption.label}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={browseMonthParts.year}
                                            onChange={(e) => handleBrowseMonthPartChange("year", e.target.value)}
                                            className="w-full bg-[#0f172a] border border-gray-600 rounded-xl px-4 py-3 text-base sm:text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                        >
                                            {browseYearOptions.map((yearValue) => (
                                                <option key={yearValue} value={yearValue}>
                                                    {yearValue}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Choose the exact month and year you want to browse in the calendar.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Add Target Months</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={addFocusedMonthToTargetSelection}
                                            className="rounded-xl border border-blue-500/30 bg-blue-600/20 px-3 py-3 text-xs font-medium text-white transition hover:bg-blue-600/30"
                                        >
                                            Add Selected Month
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addNextTargetMonth}
                                            className="rounded-xl border border-gray-600 bg-[#0f172a] px-3 py-3 text-xs font-medium text-gray-200 transition hover:border-blue-500 hover:text-white"
                                        >
                                            Add Next Month
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
                                    <div>
                                        <p className="text-sm font-medium text-white">Target Months</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Add only the months you want included in this schedule batch. You can remove any exact month below.
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-blue-500/20 bg-blue-900/20 px-4 py-3 text-sm text-blue-100">
                                        {getTargetMonths().length} month{getTargetMonths().length === 1 ? "" : "s"} selected
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {getTargetMonths().length > 0 ? getTargetMonths().map((monthValue) => (
                                    <div
                                      key={monthValue}
                                      className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-900/20 px-3 py-1.5 text-sm text-white"
                                    >
                                      <span>{getMonthLabel(monthValue)}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeTargetMonth(monthValue)}
                                        className="rounded-full bg-blue-800/70 p-1 text-blue-100 transition-colors hover:bg-red-600"
                                        title={`Remove ${getMonthLabel(monthValue)}`}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )) : (
                                    <p className="text-sm text-gray-400">No target months selected yet.</p>
                                  )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Quick Fill</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => applyMonthPreset("weekdays")}
                                        className="rounded-xl border border-gray-600 bg-[#0f172a] px-3 py-3 text-xs font-medium text-gray-200 transition hover:border-blue-500 hover:text-white"
                                    >
                                        Weekdays
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyMonthPreset("weekends")}
                                        className="rounded-xl border border-gray-600 bg-[#0f172a] px-3 py-3 text-xs font-medium text-gray-200 transition hover:border-blue-500 hover:text-white"
                                    >
                                        Weekends
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyMonthPreset("all")}
                                        className="rounded-xl border border-gray-600 bg-[#0f172a] px-3 py-3 text-xs font-medium text-gray-200 transition hover:border-blue-500 hover:text-white"
                                    >
                                        Full Month
                                    </button>
                                </div>
                            </div>

                            {/* <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Repeat On</label>
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                    {WEEKDAY_OPTIONS.map((option) => {
                                      const isActive = selectedWeekdays.includes(option.value);
                                      return (
                                        <button
                                          key={option.value}
                                          type="button"
                                          onClick={() => handleWeekdayToggle(option.value)}
                                          className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                            isActive
                                              ? "border-blue-500 bg-blue-600/20 text-white"
                                              : "border-gray-600 bg-[#0f172a] text-gray-300 hover:border-blue-500"
                                          }`}
                                        >
                                          {option.label}
                                        </button>
                                      );
                                    })}
                                </div>
                            </div> */}

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={clearTargetMonthSelection}
                                  className="rounded-xl border border-gray-600 bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-white"
                                >
                                  Clear Target Months
                                </button>
                                <button
                                  type="button"
                                  onClick={clearCurrentMonthSelection}
                                  className="rounded-xl border border-gray-600 bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-red-500 hover:text-white"
                                >
                                  Clear Browse Month Dates
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CALENDAR COLUMN */}
                    <div className="flex flex-col items-center justify-center bg-[#0f172a]/50 p-4 sm:p-6 rounded-2xl border border-gray-700 w-full xl:w-auto">
                        <label className="mb-4 text-sm font-semibold text-blue-400 flex items-center gap-2">
                            <CalendarIcon size={16}/> Select Duty Days
                        </label>
                        <DayPicker
                            mode="multiple"
                            selected={selectedDays}
                            onSelect={(days) => setSelectedDays(days || [])}
                            month={selectedMonth ? new Date(`${selectedMonth}-01T00:00:00`) : undefined}
                            onMonthChange={(month) => setSelectedMonth(format(month, "yyyy-MM"))}
                            className="text-sm"
                        />
                        <div className="mt-4 text-xs text-gray-400 bg-slate-800 px-3 py-2 rounded-lg w-full text-center">
                            {selectedDays.length} day(s) selected
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer Actions */}
            <div className="p-4 md:p-6 border-t border-gray-700 bg-slate-800/30 flex justify-end mt-auto">
                <button
                    onClick={handleSubmit}
                    disabled={loadingPage}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 flex items-center justify-center gap-2 text-base sm:text-sm"
                >
                    {loadingPage ? <Clock className="animate-spin" size={20}/> : <CalendarCheck2 size={20}/>}
                    {loadingPage ? "Processing..." : isEditMode ? "Update Schedule" : "Confirm Schedule"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
