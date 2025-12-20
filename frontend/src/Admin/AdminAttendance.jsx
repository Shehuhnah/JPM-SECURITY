import React, { useState, useEffect, Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, X, User, Shield, CalendarDays, Clock, MapPin, 
  FileDown, FileImage, RefreshCcw, ChevronRight, IdCard
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Dialog, Transition } from "@headlessui/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, isSameDay } from 'date-fns'; // Added isSameDay
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";

const api = import.meta.env.VITE_API_URL;

export default function GuardAttendancePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState(null);
  
  // Guard Details Modal State
  const [selectedGuardId, setSelectedGuardId] = useState(null);
  const [selectedGuardAttendance, setSelectedGuardAttendance] = useState([]);
  
  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);
  
  // Download Report Modal State
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [clientForReport, setClientForReport] = useState(null);
  const [reportDateRange, setReportDateRange] = useState({ from: null, to: null });
  const [submitting, setSubmitting] = useState(false);

  // Main Data State
  const [allAttendance, setAllAttendance] = useState([]);
  const [selectedClient, setSelectedClient] = useState(""); 
  
  // Top Filter State
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({ from: null, to: null });
  
  const navigate = useNavigate();
  const { user: admin, loading } = useAuth();

  // ... [Authentication and Fetch useEffects remain exactly the same as before] ...
  
  useEffect(() => {
    if (!admin && !loading) { navigate("/admin/Login"); return; }
  }, [admin, loading, navigate]);

  const fetchAllAttendance = async () => {
    try {
      setLoadingPage(true);
      setError(null);
      const res = await fetch(`${api}/api/attendance`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch attendance");
      setAllAttendance(data);
    } catch (err) {
      setError(err.message || "Failed to fetch attendance");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (!admin && !loading) { navigate("/admin/Login"); return; }
    document.title = "Attendance | JPM Security Agency"
    fetchAllAttendance();
  }, [admin, loading, navigate]);

  useEffect(() => {
    if (!selectedGuardId) return;
    const fetchGuardAttendance = async () => {
      try {
        setLoadingPage(true);
        const res = await fetch(`${api}/api/attendance/${selectedGuardId}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to fetch guard attendance");
        setSelectedGuardAttendance(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPage(false);
      }
    };
    fetchGuardAttendance();
  }, [selectedGuardId]);

  // --- NEW LOGIC: Extract dates where guards actually worked for the selected client ---
  const daysWithData = useMemo(() => {
    if (!clientForReport || allAttendance.length === 0) return [];
    
    // 1. Filter records for this client
    // 2. Map to Date objects
    const dates = allAttendance
        .filter(rec => rec.scheduleId?.client === clientForReport && rec.timeIn)
        .map(rec => new Date(rec.timeIn));
    
    return dates;
  }, [allAttendance, clientForReport]);


  // Derive unique client names
  const clientList = [...new Set(allAttendance.map(a => a.scheduleId?.client).filter(Boolean))];

  // Filter Logic (Top Filters) - [Remains the same as previous code]
  const filteredAttendance = allAttendance
    .filter(a => {
      if (!selectedDateRange.from) return true;
      if (!a.timeIn) return false;
      let recordDate;
      try { recordDate = new Date(a.timeIn); if (isNaN(recordDate.getTime())) return false; } catch (e) { return false; }
      recordDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(selectedDateRange.from); fromDate.setHours(0, 0, 0, 0);
      if (selectedDateRange.to) {
        const toDate = new Date(selectedDateRange.to); toDate.setHours(0, 0, 0, 0);
        return recordDate >= fromDate && recordDate <= toDate;
      }
      return recordDate.getTime() === fromDate.getTime();
    })
    .filter(a => selectedClient === "" || (a.scheduleId?.client || "").toLowerCase() === selectedClient.toLowerCase())
    .filter(a => filter === "All" ? true : (a.status || "").toLowerCase() === filter.toLowerCase())
    .filter(a => (a.guard?.fullName || "").toLowerCase().includes(search.toLowerCase()));

  // Open the download modal
  const openDownloadModal = (clientName) => {
      setClientForReport(clientName);
      setReportDateRange({ from: null, to: null });
      setDownloadModalOpen(true);
  };

  const handleConfirmDownload = async () => {
    if (!reportDateRange.from) {
        toast.warn("Please select a Start Date.", { position: "top-center", theme: "dark" });
        return;
    }
    setSubmitting(true);
    try {
      // Use format from date-fns to ensure we send YYYY-MM-DD string cleanly
      const fromStr = format(reportDateRange.from, 'yyyy-MM-dd');
      // If 'to' is missing (single day selected), default it to 'from'
      const toStr = reportDateRange.to ? format(reportDateRange.to, 'yyyy-MM-dd') : fromStr;

      const res = await fetch(
        `${api}/api/attendance/download-working-hours/client/${encodeURIComponent(clientForReport)}?from=${fromStr}&to=${toStr}`, 
        { credentials: 'include' }
      );

      if (!res.ok) {
        // Catch 404 specifically to show a friendlier message
        if (res.status === 404) {
            throw new Error("No data found for the selected dates. Please check the 'Green' highlighted days.");
        }
        const errorData = await res.json().catch(() => ({ message: 'Download failed.' }));
        throw new Error(errorData.message);
      }

      // ... existing download blob logic ...
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const disposition = res.headers.get('content-disposition');
      let filename = `Report_${clientForReport}.pdf`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { filename = matches[1].replace(/['"]/g, ''); }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Report downloaded successfully!`, { theme: "dark" });
      setDownloadModalOpen(false);
    } catch (error) {
      toast.error(error.message, { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGuardInfo = allAttendance.find(a => a.guard._id === selectedGuardId)?.guard;
  const sortedAttendance = [...filteredAttendance].sort((a, b) => new Date(b.timeIn) - new Date(a.timeIn));
  const groupedAttendance = sortedAttendance.reduce((acc, rec) => {
    const client = rec.scheduleId?.client || "Unassigned Client";
    if (!acc[client]) acc[client] = [];
    const isGuardExists = acc[client].some((existingRec) => existingRec.guard?._id === rec.guard?._id);
    if (!isGuardExists) { acc[client].push(rec); }
    return acc;
  }, {});

  const getStatusBadge = (status) => {
      const styles = {
          "On Duty": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          "Off Duty": "bg-slate-500/10 text-slate-400 border-slate-500/20",
          "Late": "bg-amber-500/10 text-amber-400 border-amber-500/20",
          "Absent": "bg-red-500/10 text-red-400 border-red-500/20",
      };
      return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles["Off Duty"]}`}>{status}</span>;
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
        <ToastContainer />
        <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-900/50 min-h-screen">
          {/* Header & Controls (Same as before) */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                      <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-white">Guards Attendance</h2>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <span>Showing <span className="text-white font-semibold">{filteredAttendance.length}</span> records</span>
                          <span>•</span>
                          <span>{format(new Date(), "MMM dd, yyyy")}</span>
                      </div>
                  </div>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap gap-3 w-full xl:w-auto items-stretch">
                  <div className="relative flex-grow sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input type="text" placeholder="Search guard..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                  {/* Top Date Picker Button */}
                  <div className="relative">
                      <button onClick={() => setIsDateFilterOpen(!isDateFilterOpen)} className={`h-full w-full sm:w-auto bg-[#1e293b] border rounded-lg px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition ${!selectedDateRange.from ? "border-gray-700 text-gray-400" : "border-blue-500/50 text-white bg-blue-500/10"}`}>
                          <div className="flex items-center gap-2"><CalendarDays className={selectedDateRange.from ? "text-blue-400" : "text-gray-500"} size={18} /><span>{selectedDateRange.from ? (selectedDateRange.to ? `${format(selectedDateRange.from, "MMM d")} - ${format(selectedDateRange.to, "MMM d")}` : format(selectedDateRange.from, "MMM d, yyyy")) : "Filter Date"}</span></div>
                      </button>
                      {isDateFilterOpen && (
                          <div className="absolute right-0 sm:left-auto top-full mt-2 bg-slate-800 border border-slate-700/70 rounded-xl p-4 shadow-2xl shadow-blue-900/40 z-50 w-80 max-h-[80vh] overflow-y-auto">
                              <DayPicker mode="range" selected={selectedDateRange} onSelect={setSelectedDateRange} className="text-sm w-full" />
                              <div className="flex justify-end gap-2 pt-4 border-t border-slate-700 mt-2">
                                  <button onClick={() => { setSelectedDateRange({ from: null, to: null }); setIsDateFilterOpen(false); }} className="text-xs text-gray-400 hover:text-white px-2 py-1 transition rounded hover:bg-slate-700">Clear</button>
                                  <button onClick={() => setIsDateFilterOpen(false)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition">Apply</button>
                              </div>
                          </div>
                      )}
                  </div>
                  <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"><option value="">All Clients</option>{clientList.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"><option value="All">All Status</option><option value="On Duty">On Duty</option><option value="Off Duty">Off Duty</option></select>
                  <button onClick={fetchAllAttendance} className="px-3 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"><RefreshCcw className="size-5" /></button>
              </div>
          </div>

          {loading && <div className="p-4 mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-sm flex items-center gap-2 animate-pulse"><RefreshCcw className="animate-spin size-4"/> Updating records...</div>}
          
          {/* Grouped Lists */}
          <div className="space-y-8">
              {Object.entries(groupedAttendance).length > 0 ? (
                  Object.entries(groupedAttendance).map(([clientName, records]) => (
                      <div key={clientName} className="bg-[#1e293b]/40 border border-gray-800 rounded-2xl overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-[#1e293b] border-b border-gray-700">
                              <div className="flex items-center gap-3">
                                  <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                                  <h3 className="text-lg font-semibold text-white">{clientName}</h3>
                                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{records.length} guards active</span>
                              </div>
                              <button onClick={() => openDownloadModal(clientName)} className="mt-3 sm:mt-0 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300">
                                  <FileDown size={16} /> Download Report
                              </button>
                          </div>
                          {/* Desktop Table (Hidden on Mobile) */}
                          <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-[#0f172a]/50 text-gray-400 border-b border-gray-700/50">
                                      <tr>
                                          <th className="px-6 py-4 font-medium">Guard Name</th>
                                          <th className="px-6 py-4 font-medium">Duty Station</th>
                                          <th className="px-6 py-4 font-medium">Shift Info</th>
                                          <th className="px-6 py-4 font-medium">Status</th>
                                          <th className="px-6 py-4 font-medium text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700/50">
                                      {records.map((rec) => (
                                          <tr key={rec._id} className="hover:bg-white/5 transition">
                                              <td className="px-6 py-4"><div className="font-medium text-white flex items-center gap-2"><User size={16} className="text-gray-500" />{rec.guard?.fullName || "Unknown Guard"}</div></td>
                                              <td className="px-6 py-4 text-gray-300">{rec.scheduleId?.deploymentLocation || "—"}</td>
                                              <td className="px-6 py-4"><div className="text-gray-300">{rec.scheduleId?.position}</div><div className="text-xs text-gray-500">{rec.scheduleId?.shiftType}</div></td>
                                              <td className="px-6 py-4">{getStatusBadge(rec.status)}</td>
                                              <td className="px-6 py-4 text-right"><button onClick={() => setSelectedGuardId(rec.guard._id)} className="text-blue-400 hover:text-blue-300 text-xs font-medium hover:underline">View Details</button></td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                          {/* Mobile Cards */}
                          <div className="md:hidden divide-y divide-gray-700/50">
                              {records.map((rec) => (
                                  <div key={rec._id} className="p-4 flex flex-col gap-3">
                                      <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400"><User size={20} /></div>
                                              <div>
                                                  <div className="font-medium text-white">{rec.guard?.fullName}</div>
                                                  <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{rec.scheduleId?.deploymentLocation}</div>
                                              </div>
                                          </div>
                                          {getStatusBadge(rec.status)}
                                      </div>
                                      <div className="flex items-center justify-between text-sm pl-12 pr-1">
                                          <div className="text-gray-400"><span className="text-gray-500 text-xs block">Shift</span>{rec.scheduleId?.shiftType} ({rec.scheduleId?.position})</div>
                                          <button onClick={() => setSelectedGuardId(rec.guard._id)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-gray-300 transition"><ChevronRight size={18} /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))
              ) : <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-gray-800 border-dashed"><Clock size={48} className="mb-4 opacity-20" /><p>No attendance records found matching your filters.</p></div>}
          </div>
      </main>

      {/* --- DOWNLOAD REPORT MODAL --- */}
      <Transition appear show={downloadModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDownloadModalOpen(false)}>
          
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] border border-gray-700 shadow-2xl transition-all flex flex-col max-h-[90vh]">
                  
                  {/* Header */}
                  <div className="p-6 pb-2 text-center shrink-0">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                        <FileDown className="text-blue-400" size={28} />
                    </div>
                    <Dialog.Title as="h3" className="text-xl font-bold text-white">
                      Download Report
                    </Dialog.Title>
                    <p className="text-sm text-gray-400 mt-2 px-4">
                      Select range for <strong className="text-white">{clientForReport}</strong>
                    </p>
                  </div>

                  {/* Date Picker */}
                  <div className="px-4 sm:px-6 py-2 overflow-y-auto custom-scrollbar">
                    <div className="bg-[#0f172a] rounded-xl p-3 sm:p-4 border border-gray-700 flex justify-center">
                      <style>{`
                        .rdp { --rdp-cell-size: 40px; margin: 0; }
                        .rdp-caption_label { color: #f8fafc; font-weight: 700; font-size: 1rem; }
                        
                        /* Navigation Arrows */
                        .rdp-nav_button { color: #94a3b8; }
                        .rdp-nav_button:hover { color: #fff; background-color: #334155; }
                        
                        /* === FIX: WEEKDAY HEADERS TO WHITE === */
                        .rdp-head_cell { 
                            color: #ffffff !important; 
                            font-weight: 700; 
                            font-size: 0.85rem; 
                            text-transform: uppercase; 
                            padding-bottom: 10px;
                        }
                        
                        /* Days */
                        .rdp-day { color: #cbd5e1; font-size: 0.9rem; border-radius: 9999px; }
                        .rdp-day:hover:not([disabled]) { background-color: #334155; }
                        .rdp-day_outside { opacity: 0.3; }

                        /* WORKED DAYS (Green Ring) */
                        .rdp-day_worked { 
                            background-color: rgba(16, 185, 129, 0.1); 
                            color: #fff; 
                            font-weight: 700;
                            border: 2px solid #10b981;
                        }

                        /* SELECTED RANGE (Solid Blue) */
                        .rdp-day_selected { 
                            background-color: #2563eb !important; 
                            color: white !important; 
                            font-weight: bold; 
                            border: none; 
                        }
                        .rdp-day_range_middle { 
                            background-color: rgba(37, 99, 235, 0.2) !important; 
                            color: #60a5fa !important; 
                            border-radius: 0 !important; 
                        }
                        
                        /* Range Corners */
                        .rdp-day_range_start { border-top-left-radius: 50% !important; border-bottom-left-radius: 50% !important; border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; }
                        .rdp-day_range_end { border-top-right-radius: 50% !important; border-bottom-right-radius: 50% !important; border-top-left-radius: 0 !important; border-bottom-left-radius: 0 !important; }
                        .rdp-day_range_start.rdp-day_range_end { border-radius: 50% !important; }
                      `}</style>
                      
                      <DayPicker 
                          mode="range" 
                          selected={reportDateRange} 
                          onSelect={setReportDateRange} 
                          className="text-sm"
                          defaultMonth={new Date()}
                          showOutsideDays={false}
                          modifiers={{ worked: daysWithData }} 
                          modifiersClassNames={{ worked: "rdp-day_worked" }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400"></div>
                          <span>With Data</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          <span>Selected</span>
                        </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 pt-4 flex gap-3 bg-[#1e293b] shrink-0 border-t border-gray-700/50 mt-2">
                    <button
                      onClick={() => setDownloadModalOpen(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-sm font-medium transition active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDownload}
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {submitting ? (
                        <>
                          <RefreshCcw className="animate-spin size-4" /> Generating...
                        </>
                      ) : (
                        "Confirm Download"
                      )}
                    </button>
                  </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* --- Detail Modal (Responsive) --- */}
      <Transition appear show={selectedGuardId !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedGuardId(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-[#1e293b] border-t sm:border border-gray-700 shadow-xl transition-all h-[90vh] sm:h-auto flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-700 shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white"><User className="text-blue-400" size={20} /> <span className="truncate">Attendance History</span></h3>
                    <button onClick={() => setSelectedGuardId(null)} className="bg-gray-800/50 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition"><X size={20} /></button>
                  </div>
                  {/* Guard Info */}
                  {selectedGuardInfo && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-6 py-4 border-b border-gray-700 bg-[#192233] gap-4 shrink-0">
                      <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20"><Shield className="text-blue-400" size={32} /></div>
                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <p className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">{selectedGuardInfo.fullName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 w-fit px-2 py-1 rounded"><IdCard size={16} className="text-blue-300" /> <span>ID: {selectedGuardInfo.guardId}</span></div>
                      </div>
                    </div>
                  )}
                  {/* Content */}
                  <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {selectedGuardAttendance.length > 0 ? (
                      <>
                        <div className="hidden md:block">
                          <table className="w-full border-collapse text-gray-100">
                            <thead>
                              <tr className="uppercase text-xs bg-[#234C6A] text-gray-100">
                                <th className="px-3 py-3 rounded-l-lg">Date</th>
                                <th className="px-3 py-3">Site</th>
                                <th className="px-3 py-3">Time In</th>
                                <th className="px-3 py-3">Time Out</th>
                                <th className="px-3 py-3">Duration</th>
                                <th className="px-3 py-3 rounded-r-lg">Evidence</th>
                              </tr>
                            </thead>
                            <tbody className="space-y-2">
                              {selectedGuardAttendance.map((rec) => {
                                let working = "-";
                                if (rec.timeIn && rec.timeOut) {
                                  const t1 = new Date(rec.timeIn);
                                  const t2 = new Date(rec.timeOut);
                                  let diffMs = t2 - t1;
                                  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                                  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                  const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                  working = `${diffHrs}h ${diffMin}m`;
                                }
                                return (
                                  <tr key={rec._id} className="text-center border-b border-gray-800 hover:bg-[#2a3650] transition group">
                                    <td className="px-3 py-3 text-sm">{new Date(rec.timeIn).toLocaleDateString()}</td>
                                    <td className="px-3 py-3 text-sm"><div className="flex flex-col items-center gap-1"><span className="block max-w-[200px] truncate text-gray-300">{rec.location?.address || "No location"}</span>{rec.location?.latitude && (<a href={`https://maps.google.com/?q=${rec.location.latitude},${rec.location.longitude}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"><MapPin size={12} /> Map</a>)}</div></td>
                                    <td className="px-3 py-3 text-sm font-mono text-emerald-400">{new Date(rec.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="px-3 py-3 text-sm font-mono text-orange-400">{rec.timeOut ? new Date(rec.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}</td>
                                    <td className="px-3 py-3 text-sm font-medium">{working}</td>
                                    <td className="px-4 py-3"><button onClick={() => setPreviewImage(rec.photo)} className="bg-slate-700 hover:bg-blue-600 text-white p-2 rounded-lg transition" title="View Image"><FileImage size={18} /></button></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="md:hidden space-y-4">
                          {selectedGuardAttendance.map((rec) => {
                             let working = "-";
                             if (rec.timeIn && rec.timeOut) {
                               const t1 = new Date(rec.timeIn);
                               const t2 = new Date(rec.timeOut);
                               let diffMs = t2 - t1;
                               if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                               const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                               const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                               working = `${diffHrs}h ${diffMin}m`;
                             }
                             return (
                              <div key={rec._id} className="bg-slate-800/50 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start border-b border-gray-700 pb-2">
                                  <div className="flex items-center gap-2 text-white font-medium"><CalendarDays size={16} className="text-blue-400"/>{new Date(rec.timeIn).toLocaleDateString()}</div>
                                  <div className="text-xs bg-slate-700 px-2 py-1 rounded text-gray-300">Duration: <span className="text-white font-bold">{working}</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-emerald-900/20 border border-emerald-500/20 rounded p-2 text-center"><span className="text-xs text-emerald-500 block uppercase">Time In</span><span className="text-white font-mono">{new Date(rec.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                  <div className="bg-orange-900/20 border border-orange-500/20 rounded p-2 text-center"><span className="text-xs text-orange-500 block uppercase">Time Out</span><span className="text-white font-mono">{rec.timeOut ? new Date(rec.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}</span></div>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-gray-400"><MapPin size={16} className="shrink-0 mt-0.5 text-gray-500" /><div><p className="line-clamp-2 leading-tight">{rec.location?.address || "No location recorded"}</p>{rec.location?.latitude && (<a href={`https://maps.google.com/?q=${rec.location.latitude},${rec.location.longitude}`} target="_blank" rel="noreferrer" className="text-blue-400 text-xs mt-1 inline-block hover:underline">View on Google Maps</a>)}</div></div>
                                <button onClick={() => setPreviewImage(rec.photo)} className="w-full mt-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition active:scale-[0.98]"><FileImage size={16} /> View Evidence Photo</button>
                              </div>
                             );
                          })}
                        </div>
                      </>
                    ) : <div className="flex flex-col items-center justify-center h-40 sm:h-64 text-gray-400"><Clock size={48} className="mb-3 opacity-20" /><p>No attendance records found.</p></div>}
                  </div>
                  {/* Footer */}
                  <div className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-400 border-t border-gray-700 bg-[#1e293b] shrink-0 text-center sm:text-left">
                    Total Records: <span className="text-white font-semibold">{selectedGuardAttendance.length}</span>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* --- Image Preview Modal (Existing) --- */}
      {previewImage && (
        <Transition appear show={Boolean(previewImage)} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setPreviewImage(null)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            </Transition.Child>
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-3xl bg-[#0f172a]/95 border border-gray-700 rounded-2xl p-4 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title className="text-lg text-white font-semibold">Attendance Image</Dialog.Title>
                    <button className="text-gray-400 hover:text-white" onClick={() => setPreviewImage(null)}><X size={20} /></button>
                  </div>
                  <div className="flex justify-center">
                    {previewImage ? <img src={previewImage} alt="Attendance Evidence" className="max-h-[70vh] w-auto rounded-xl border border-gray-700 shadow-lg" /> : <p className="text-gray-400">No image available</p>}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      )}
    </div>
  );
}