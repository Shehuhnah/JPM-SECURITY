import React, { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Eye, 
  X,
  User,
  Shield,
  CalendarDays,
  Clock,
  MapPin,
  Mail,
  Phone,
  FileText,
  Hash,
  Image as ImageIcon,
  EyeIcon,
  IdCard,
  FileDown,
  FileImage,
  RefreshCcw,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Dialog, Transition } from "@headlessui/react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";
const api = import.meta.env.VITE_API_URL;

export default function GuardAttendancePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGuardId, setSelectedGuardId] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [allAttendance, setAllAttendance] = useState([]);
  const [selectedGuardAttendance, setSelectedGuardAttendance] = useState([]);
  const [selectedClient, setSelectedClient] = useState(""); // New state for client filter
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({ from: null, to: null });
  const navigate = useNavigate();

  const { user: admin, loading } = useAuth();

  useEffect(() => {
    if (!admin && !loading) {
      navigate("/admin/Login");
      return;
    }
  }, [admin, loading, navigate]);

  const fetchAllAttendance = async () => {
    try {
      setLoadingPage(true);
      setError(null);

      const res = await fetch(`${api}/api/attendance`, {
        credentials: "include",
      });
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
    if (!admin && !loading) {
      navigate("/admin/Login");
      return;
    }

    document.title = "Attendance | JPM Security Agency"

    fetchAllAttendance();
  }, [admin, loading, navigate]);

  useEffect(() => {
    if (!selectedGuardId) return;

    const fetchGuardAttendance = async () => {
      try {
        setLoadingPage(true);
        const res = await fetch(
          `${api}/api/attendance/${selectedGuardId}`,
          { credentials: "include" }
        );
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
  console.log("attendance:", allAttendance)

  // Derive unique client names for the filter dropdown
  const clientList = [...new Set(allAttendance.map(a => a.scheduleId?.client).filter(Boolean))];

  // Filter and search
  const filteredAttendance = allAttendance
    .filter(a => {
      if (!selectedDateRange.from) return true;
      if (!a.timeIn) return false;

      let recordDate;
      try {
        recordDate = new Date(a.timeIn);
        if (isNaN(recordDate.getTime())) return false; // Invalid date
      } catch (e) {
        return false;
      }
      
      // Normalize dates to midnight to compare just the date part
      recordDate.setHours(0, 0, 0, 0);

      const fromDate = new Date(selectedDateRange.from);
      fromDate.setHours(0, 0, 0, 0);

      if (selectedDateRange.to) {
        const toDate = new Date(selectedDateRange.to);
        toDate.setHours(0, 0, 0, 0);
        return recordDate >= fromDate && recordDate <= toDate;
      }
      
      // If only one day is selected, 'to' will be null, so check for equality
      return recordDate.getTime() === fromDate.getTime();
    })
    .filter(a => selectedClient === "" || (a.scheduleId?.client || "").toLowerCase() === selectedClient.toLowerCase())
    .filter(a => filter === "All" ? true : (a.status || "").toLowerCase() === filter.toLowerCase())
    .filter(a => (a.guard?.fullName || "").toLowerCase().includes(search.toLowerCase()));

  const handleDownloadWorkHours = async (id) => {
    console.log(id)
    setSubmitting(true);
    try {
      const res = await fetch(`${api}/api/attendance/download-working-hours/${id}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to download PDF. The record may not exist or another error occurred.' }));
        throw new Error(errorData.message);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const disposition = res.headers.get('content-disposition');
      let filename = `working-hours-${id}.pdf`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { 
              filename = matches[1].replace(/['"]/g, '');
          }
      }
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully!");

    } catch (error) {
      toast.error(error.message || "An error occurred while downloading the PDF.");
      console.error('Error downloading work hours:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadWorkHoursByClient = async (clientName) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${api}/api/attendance/download-working-hours/client/${encodeURIComponent(clientName)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to download PDF. No records may exist for this client in the current period.' }));
        throw new Error(errorData.message);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const disposition = res.headers.get('content-disposition');
      let filename = `working-hours-${clientName}.pdf`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { 
              filename = matches[1].replace(/['"]/g, '');
          }
      }
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Client PDF downloaded successfully!");

    } catch (error) {
      toast.error(error.message || "An error occurred while downloading the PDF.");
      console.error('Error downloading work hours by client:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGuardInfo = allAttendance.find(a => a.guard._id === selectedGuardId)?.guard;
  console.log("selected guard attendance: ", selectedGuardInfo)

  const groupedAttendance = filteredAttendance.reduce((acc, rec) => {
      const client = rec.scheduleId?.client || "Unassigned Client";
      if (!acc[client]) acc[client] = [];
      acc[client].push(rec);
      return acc;
  }, {});

  const getStatusBadge = (status) => {
      const styles = {
          "On Duty": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          "Off Duty": "bg-slate-500/10 text-slate-400 border-slate-500/20",
          "Late": "bg-amber-500/10 text-amber-400 border-amber-500/20",
          "Absent": "bg-red-500/10 text-red-400 border-red-500/20",
      };
      return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles["Off Duty"]}`}>
              {status}
          </span>
      );
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-900/50 min-h-screen">
          {/* --- Header & Stats --- */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                      <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-white">
                          Guards Attendance
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <span>Showing <span className="text-white font-semibold">{filteredAttendance.length}</span> records</span>
                          <span>•</span>
                          <span>{format(new Date(), "MMM dd, yyyy")}</span>
                      </div>
                  </div>
              </div>

              {/* --- Controls Toolbar --- */}
              <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap gap-3 w-full xl:w-auto items-stretch">
                  
                  {/* Search */}
                  <div className="relative flex-grow sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                          type="text"
                          placeholder="Search guard..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full h-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 
                          text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                  </div>

                  {/* Date Range Picker (Styled Wrapper) */}
                  <div className="relative">
                      <button
                          onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                          className="h-full w-full sm:w-auto bg-[#1e293b] border border-gray-700 rounded-lg px-4 py-2.5 
                          text-sm text-gray-200 hover:bg-[#243046] focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-3 transition"
                      >
                          <div className="flex items-center gap-2">
                              <CalendarDays className="text-blue-400" size={18} />
                              <span>
                                  {selectedDateRange.from ? 
                                      (selectedDateRange.to ? `${format(selectedDateRange.from, "MMM d")} - ${format(selectedDateRange.to, "MMM d")}` : format(selectedDateRange.from, "MMM d, yyyy")) 
                                      : "Filter Date"}
                              </span>
                          </div>
                      </button>
                      {/* Popover */}
                      {isDateFilterOpen && (
                          <div className="absolute right-0 sm:left-auto top-full mt-2 bg-slate-800 border border-slate-700/70 rounded-xl p-4 shadow-2xl shadow-blue-900/40 z-50 w-80 max-h-[80vh] overflow-y-auto"
                          >
                              <DayPicker 
                                  mode="range" 
                                  selected={selectedDateRange} 
                                  onSelect={setSelectedDateRange} 
                                  className="text-sm w-full"
                              />
                              <div className="flex justify-end gap-2 pt-4 border-t border-slate-700 mt-2">
                                  <button 
                                      onClick={() => { setSelectedDateRange({ from: null, to: null }); setIsDateFilterOpen(false); }} 
                                      className="text-xs text-gray-400 hover:text-white px-2 py-1 transition rounded hover:bg-slate-700"
                                  >
                                      Clear
                                  </button>
                                  <button 
                                      onClick={() => setIsDateFilterOpen(false)} 
                                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition"
                                  >
                                      Apply
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Filters */}
                  <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                      <option value="">All Clients</option>
                      {clientList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                      <option value="All">All Status</option>
                      <option value="On Duty">On Duty</option>
                      <option value="Off Duty">Off Duty</option>
                  </select>

                  <button
                      onClick={fetchAllAttendance}
                      className="px-3 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
                  >
                      <RefreshCcw className="size-5" />
                  </button>
              </div>
          </div>

          {/* Status Messages */}
          {loading && <div className="p-4 mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-sm flex items-center gap-2 animate-pulse"><RefreshCcw className="animate-spin size-4"/> Updating records...</div>}
          {error && <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

          {/* --- Content: Grouped by Client --- */}
          <div className="space-y-8">
              {Object.entries(groupedAttendance).length > 0 ? (
                  Object.entries(groupedAttendance).map(([clientName, records]) => (
                      <div key={clientName} className="bg-[#1e293b]/40 border border-gray-800 rounded-2xl overflow-hidden">
                          
                          {/* Client Group Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-[#1e293b] border-b border-gray-700">
                              <div className="flex items-center gap-3">
                                  <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                                  <h3 className="text-lg font-semibold text-white">{clientName}</h3>
                                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{records.length} guards</span>
                              </div>
                              <button
                                  onClick={() => handleDownloadWorkHoursByClient(clientName)}
                                  className="mt-3 sm:mt-0 flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg transition"
                              >
                                  <FileDown size={16} />
                                  Download Report
                              </button>
                          </div>

                          {/* DESKTOP TABLE */}
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
                                              <td className="px-6 py-4">
                                                  <div className="font-medium text-white flex items-center gap-2">
                                                      <User size={16} className="text-gray-500" />
                                                      {rec.guard?.fullName || "Unknown Guard"}
                                                  </div>
                                              </td>
                                              <td className="px-6 py-4 text-gray-300">
                                                  {rec.scheduleId?.deploymentLocation || "—"}
                                              </td>
                                              <td className="px-6 py-4">
                                                  <div className="text-gray-300">{rec.scheduleId?.position}</div>
                                                  <div className="text-xs text-gray-500">{rec.scheduleId?.shiftType}</div>
                                              </td>
                                              <td className="px-6 py-4">
                                                  {getStatusBadge(rec.status)}
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                  <button
                                                      onClick={() => setSelectedGuardId(rec.guard._id)}
                                                      className="text-blue-400 hover:text-blue-300 text-xs font-medium hover:underline"
                                                  >
                                                      View Details
                                                  </button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>

                          {/* MOBILE CARDS */}
                          <div className="md:hidden divide-y divide-gray-700/50">
                              {records.map((rec) => (
                                  <div key={rec._id} className="p-4 flex flex-col gap-3">
                                      <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400">
                                                  <User size={20} />
                                              </div>
                                              <div>
                                                  <div className="font-medium text-white">{rec.guard?.fullName}</div>
                                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                                      <MapPin size={10} />
                                                      {rec.scheduleId?.deploymentLocation}
                                                  </div>
                                              </div>
                                          </div>
                                          {getStatusBadge(rec.status)}
                                      </div>
                                      
                                      <div className="flex items-center justify-between text-sm pl-12 pr-1">
                                          <div className="text-gray-400">
                                              <span className="text-gray-500 text-xs block">Shift</span>
                                              {rec.scheduleId?.shiftType} ({rec.scheduleId?.position})
                                          </div>
                                          <button 
                                              onClick={() => setSelectedGuardId(rec.guard._id)}
                                              className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-gray-300 transition"
                                          >
                                              <ChevronRight size={18} />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-gray-800 border-dashed">
                      <Clock size={48} className="mb-4 opacity-20" />
                      <p>No attendance records found matching your filters.</p>
                  </div>
              )}
          </div>
      </main>

      <Transition appear show={selectedGuardId !== null} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setSelectedGuardId(null)}
        >
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-[#1e293b] border border-gray-700 shadow-xl transition-all">

                  {/* ===== Header ===== */}
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                      <User className="text-blue-400" size={20} />
                      Guard Attendance History
                    </h3>
                    <button
                      onClick={() => setSelectedGuardId(null)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  {/* ===== Guard Details ===== */}
                  {selectedGuardInfo && (
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-[#192233] gap-4">
                      <div className="flex justify-between items-center gap-4">
                        <Shield className="text-blue-400" size={50} />
                        <div className="flex-1 flex flex-col gap-1">
                          <p className="text-xl font-semibold text-white flex items-center gap-2">
                            <User className="text-blue-400" size={20}/>
                            {selectedGuardInfo.fullName}
                          </p>
                          <p className="text-gray-300 flex items-center gap-2">
                            <IdCard size={20} className="text-blue-300" />
                            {selectedGuardInfo.guardId}
                          </p>
                        </div>
                      </div>
                      {/* <button
                        onClick={() => handleDownloadWorkHours(selectedGuardInfo._id)}
                        className="bg-[#3d5986] text-white px-3 py-2 rounded-lg font-medium transition flex gap-2">
                        <FileDown className="text-green-400"/>Download Working Hours
                      </button> */}
                    </div>
                  )}

                  {/* ===== Attendance Table ===== */}
                  <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {selectedGuardAttendance.length > 0 ? (
                      <table className="w-full border-collapse text-gray-100">
                        <thead>
                          <tr className="uppercase text-xs bg-[#234C6A] text-gray-100">
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Site</th>
                            <th className="px-3 py-2">Time In</th>
                            <th className="px-3 py-2">Time Out</th>
                            <th className="px-3 py-2">Working Hrs</th>
                            <th className="px-3 py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGuardAttendance.map((rec) => {
                            // compute working hours
                            let working = "-";
                            if (rec.timeIn && rec.timeOut) {
                              const t1 = new Date(rec.timeIn);
                              const t2 = new Date(rec.timeOut);
                              let diffMs = t2 - t1;
                              if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // overnight
                              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              working = `${diffHrs}h ${diffMin}m`;
                            }

                            return (
                              <tr
                                key={rec._id}
                                className="text-center border-t border-gray-700 hover:bg-[#2a3650] transition"
                              >
                                <td className="px-3 py-2">
                                  {new Date(rec.timeIn).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 flex flex-col items-center gap-1">
                                  <span className="block max-w-[500px] whitespace-nowrap overflow-hidden text-ellipsis">
                                    {rec.location?.address || "No location recorded"}
                                  </span>
                                  {rec.location?.latitude && rec.location?.longitude && (
                                    <a
                                      href={`https://www.google.com/maps?q=${rec.location.latitude},${rec.location.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-1"
                                    >
                                      <MapPin size={14} /> View on Google Maps
                                    </a>
                                  )}
                                </td>
                                <td className="px-3 py-2">{new Date(rec.timeIn).toLocaleTimeString()}</td>
                                <td className="px-3 py-2">{new Date(rec.timeOut).toLocaleTimeString()}</td>
                                <td className="px-3 py-2">{working}</td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() => setPreviewImage(rec.photo)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition flex gap-2"
                                  >
                                    <FileImage className="text-white" /> Image
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-400 text-center py-6 italic">
                        No attendance records found.
                      </p>
                    )}
                  </div>

                  {/* ===== Footer ===== */}
                  <div className="px-6 py-3 text-sm text-gray-400 border-t border-gray-700">
                    Showing {selectedGuardAttendance.length} record(s)
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {previewImage && (
        <Transition appear show={Boolean(previewImage)} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setPreviewImage(null)}
          >
            {/* Backdrop */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            </Transition.Child>

            {/* Modal Panel */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl bg-[#0f172a]/95 border border-gray-700 rounded-2xl p-4 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title className="text-lg text-white font-semibold">
                      Attendance Image
                    </Dialog.Title>
                    <button
                      className="text-gray-400 hover:text-white"
                      onClick={() => setPreviewImage(null)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Attendance Evidence"
                        className="max-h-[70vh] w-auto rounded-xl border border-gray-700 shadow-lg"
                      />
                    ) : (
                      <p className="text-gray-400">No image available</p>
                    )}
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
