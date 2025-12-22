import { useState, useEffect } from "react";
import { Shield, Clock, Search, CalendarCheck2, Pencil, MapPin, Briefcase, User, Calendar as CalendarIcon, ChevronLeft, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const api = import.meta.env.VITE_API_URL;

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State
  const [isEditMode, setIsEditMode] = useState(false);
  const [guards, setGuards] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
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
        const [guardsRes, clientsRes] = await Promise.all([
          fetch(`${api}/api/guards`, { credentials: "include" }),
          fetch(`${api}/api/clients/get-clients`, { credentials: "include" }),
        ]);

        if (!guardsRes.ok || !clientsRes.ok) throw new Error("Failed to fetch data");

        const [guardsData, clientsData] = await Promise.all([
          guardsRes.json(),
          clientsRes.json(),
        ]);

        setGuards(guardsData);
        setClients(clientsData);
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

            // Handle Guard Selection logic
            const uniqueGuardIds = new Set(batchData.map(s => s.guardId.toString()));
            if (uniqueGuardIds.size === 1) {
                const guard = guards.find((g) => g._id === firstSched.guardId.toString());
                setSelectedGuard(guard);
            } else {
                toast.error("Batch contains multiple guards. Cannot edit here.");
            }

            const days = batchData.map((s) => new Date(s.timeIn));
            setSelectedDays(days);
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

  const handleClientChange = (e) => {
    const selectedClientName = e.target.value;
    const clientData = clients.find((c) => c.clientName === selectedClientName);

    setForm((prev) => ({
      ...prev,
      client: selectedClientName,
      deploymentLocation: clientData ? clientData.clientAddress : "", 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGuard) return toast.error("Please select a guard first!");
    if (selectedDays.length === 0) return toast.error("Please select at least one date!");

    setLoadingPage(true);

    const shiftTimes = form.shiftType === "Night Shift"
      ? { timeIn: "19:00", timeOut: "07:00" }
      : { timeIn: "07:00", timeOut: "19:00" };

    const schedules = selectedDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const timeInFull = `${dateStr}T${shiftTimes.timeIn}`;
      let timeOutFull = `${dateStr}T${shiftTimes.timeOut}`;

      if (form.shiftType === "Night Shift") {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        timeOutFull = `${format(nextDay, "yyyy-MM-dd")}T${shiftTimes.timeOut}`;
      }

      return {
        guardId: selectedGuard._id,
        deploymentLocation: form.deploymentLocation,
        client: form.client,
        position: form.position,
        shiftType: form.shiftType,
        timeIn: timeInFull,
        timeOut: timeOutFull,
      };
    });

    try {
      let res;
      if (isEditMode) {
        res = await fetch(`${api}/api/schedules/batch/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedules }),
        });
      } else {
        res = await fetch(`${api}/api/schedules/create-schedule`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedules }),
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
    g.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <div
                  key={guard._id}
                  onClick={() => {
                    if (guard.status === "Active") setSelectedGuard(guard);
                    else toast.warning("Only active guards can be deployed.");
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedGuard?._id === guard._id
                      ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-900/20"
                      : "bg-[#0f172a]/50 hover:bg-[#0f172a] border-transparent hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedGuard?._id === guard._id ? "bg-blue-500 text-white" : "bg-slate-700 text-gray-300"
                    }`}>
                        {guard.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate text-base sm:text-sm">{guard.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{guard.position}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                        guard.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-gray-600/30 text-gray-500"
                    }`}>
                        {guard.status}
                    </span>
                  </div>
                </div>
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
                    {selectedGuard && (
                        <div className="bg-blue-900/30 pl-3 pr-2 py-2 rounded-lg border border-blue-500/30 flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-xs text-blue-300 whitespace-nowrap">Assigning to:</span>
                                <span className="text-sm font-bold text-white truncate">{selectedGuard.fullName}</span>
                            </div>
                            <button 
                                onClick={() => setSelectedGuard(null)}
                                className="bg-blue-800/50 hover:bg-blue-700 text-blue-200 p-1 rounded-full transition-colors"
                                type="button"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row gap-8">
                    
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
                            onSelect={setSelectedDays}
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