import React, { useState, useEffect, Fragment, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, X, User, Shield, CalendarDays, Clock, MapPin, 
  FileDown, FileImage, RefreshCcw, ChevronRight, IdCard
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";
import { Dialog, Transition } from "@headlessui/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, getDaysInMonth } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";
import TablePagination from "../components/admin/TablePagination.jsx";

const api = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const DETAIL_PAGE_SIZE = 10;
const isSameMonthRange = (from, to) =>
  Boolean(
    from &&
      to &&
      from.getFullYear() === to.getFullYear() &&
      from.getMonth() === to.getMonth()
  );
const datePickerStyles = `
  .rdp {
    --rdp-cell-size: 36px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #111827;
    margin: 0;
  }
  .rdp-caption_label {
    color: #f8fafc;
    font-weight: 700;
  }
  .rdp-weekday {
    color: #ffffff;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
  .rdp-day {
    color: #f8fafc;
  }
  .rdp-day_button {
    color: #f8fafc;
  }
  .rdp-button_previous,
  .rdp-button_next,
  .rdp-nav_button {
    color: #e2e8f0;
  }
  .rdp-day:hover:not([disabled]) {
    background-color: #1e293b;
    border-radius: 8px;
  }
  .rdp-selected .rdp-day_button,
  .rdp-range_start .rdp-day_button,
  .rdp-range_end .rdp-day_button {
    background-color: #2563eb;
    color: #ffffff;
    border-radius: 8px;
    font-weight: 700;
  }
  .rdp-range_middle .rdp-day_button {
    background-color: rgba(59, 130, 246, 0.35);
    color: #ffffff;
    border-radius: 0;
    font-weight: 600;
  }
  .rdp-range_start .rdp-day_button,
  .rdp-range_end .rdp-day_button {
    background-color: #2563eb;
    color: #ffffff;
  }
  .rdp-day_button:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }
`;

export default function GuardAttendancePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [_loadingPage, setLoadingPage] = useState(false);
  const [_error, setError] = useState(null);
  
  // Guard Details Modal State
  const [selectedGuardId, setSelectedGuardId] = useState(null);
  const [selectedGuardAttendance, setSelectedGuardAttendance] = useState([]);
  const [detailPage, setDetailPage] = useState(1);
  const [detailTotalItems, setDetailTotalItems] = useState(0);
  const [detailTotalPages, setDetailTotalPages] = useState(1);
  
  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);
  const [previewImageType, setPreviewImageType] = useState("timeIn");
  
  // Download Report Modal State
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [clientForReport, setClientForReport] = useState(null);
  const [reportMode, setReportMode] = useState("cutoff");
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(() =>
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [reportCutoff, setReportCutoff] = useState("first-half");
  const [reportDateRange, setReportDateRange] = useState({ from: null, to: null });
  const [submitting, setSubmitting] = useState(false);

  // Main Data State
  const [allAttendance, setAllAttendance] = useState([]);
  const [selectedClient, setSelectedClient] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Top Filter State
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({ from: null, to: null });
  
  const navigate = useNavigate();
  const { user: admin, loading } = useAuth();

  // ... [Authentication and Fetch useEffects remain exactly the same as before] ...
  
  useEffect(() => {
    if (!admin && !loading) { navigate("/admin/Login"); return; }
  }, [admin, loading, navigate]);

  const fetchAllAttendance = useCallback(async () => {
    try {
      setLoadingPage(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });

      if (search.trim()) params.set("q", search.trim());
      if (selectedClient) params.set("client", selectedClient);
      if (filter !== "All") params.set("status", filter);
      if (selectedDateRange.from) params.set("from", format(selectedDateRange.from, "yyyy-MM-dd"));
      if (selectedDateRange.to) params.set("to", format(selectedDateRange.to, "yyyy-MM-dd"));

      const res = await fetch(`${api}/api/attendance?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch attendance");
      setAllAttendance(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to fetch attendance");
    } finally {
      setLoadingPage(false);
    }
  }, [currentPage, search, selectedClient, filter, selectedDateRange.from, selectedDateRange.to]);

  useEffect(() => {
    if (!admin && !loading) { navigate("/admin/Login"); return; }
    document.title = "Attendance | JPM Security Agency"
  }, [admin, loading, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedClient, filter, selectedDateRange.from, selectedDateRange.to]);

  useEffect(() => {
    if (admin) {
      fetchAllAttendance();
    }
  }, [admin, fetchAllAttendance]);

  useEffect(() => {
    if (selectedGuardId) {
      setDetailPage(1);
    }
  }, [selectedGuardId]);

  useEffect(() => {
    if (!selectedGuardId) return;
    const fetchGuardAttendance = async () => {
      try {
        setLoadingPage(true);
        const params = new URLSearchParams({
          page: String(detailPage),
          limit: String(DETAIL_PAGE_SIZE),
        });
        const res = await fetch(`${api}/api/attendance/${selectedGuardId}?${params.toString()}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to fetch guard attendance");
        setSelectedGuardAttendance(data.items || []);
        setDetailTotalItems(data.total || 0);
        setDetailTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPage(false);
      }
    };
    fetchGuardAttendance();
  }, [selectedGuardId, detailPage]);

  // Derive unique client names
  const clientList = [...new Set(allAttendance.map(a => a.scheduleId?.client).filter(Boolean))];

  // Open the download modal
  const openDownloadModal = (clientName) => {
    setClientForReport(clientName);
    setReportMode("cutoff");
    setReportYear(new Date().getFullYear());
    setReportMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
    setReportCutoff("first-half");
    setReportDateRange({ from: null, to: null });
    setDownloadModalOpen(true);
  };

  const handleReportRangeSelect = (range) => {
    if (!range) {
      setReportDateRange({ from: null, to: null });
      return;
    }

    if (range.from && range.to && !isSameMonthRange(range.from, range.to)) {
      toast.warn("Pick dates must stay within one month only.", {
        position: "top-center",
        theme: "dark",
      });
      setReportDateRange({ from: range.from, to: range.from });
      return;
    }

    setReportDateRange(range);
  };
  
  const handleConfirmDownload = async () => {
    let fromDate;
    let toDate;

    if (reportMode === "cutoff") {
      if (!reportYear || !reportMonth) {
        toast.warn("Please select a year and month.", { position: "top-center", theme: "dark" });
        return;
      }

      const year = Number(reportYear);
      const month = Number(reportMonth);
      const monthDate = new Date(year, month - 1, 1);
      const lastDay = getDaysInMonth(monthDate);
      const startDay =
        reportCutoff === "second-half" ? 16 : 1;
      const endDay =
        reportCutoff === "first-half" ? 15 : lastDay;

      fromDate = new Date(year, month - 1, startDay);
      toDate = new Date(year, month - 1, endDay);
    } else {
      if (!reportDateRange?.from || !reportDateRange?.to) {
        toast.warn("Please select a start and end date.", { position: "top-center", theme: "dark" });
        return;
      }
      if (!isSameMonthRange(reportDateRange.from, reportDateRange.to)) {
        toast.warn("Pick dates must stay within one month only.", { position: "top-center", theme: "dark" });
        return;
      }

      fromDate = reportDateRange.from;
      toDate = reportDateRange.to;
    }

    setSubmitting(true);
    try {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');

      const res = await fetch(
        `${api}/api/attendance/download-working-hours/client/${encodeURIComponent(clientForReport)}?from=${fromStr}&to=${toStr}`, 
        { credentials: 'include' }
      );

      if (!res.ok) {
        // Catch 404 specifically to show a friendlier message
        if (res.status === 404) {
            throw new Error("No data found for the selected dates. Please select the correct date period.");
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

  // Add the '?' before ._id
  const selectedGuardInfo = allAttendance.find(a => a.guard?._id === selectedGuardId)?.guard;
  const rowNumberMap = new Map(
    allAttendance.map((record, index) => [record._id, (currentPage - 1) * PAGE_SIZE + index + 1])
  );
  const groupedAttendance = allAttendance.reduce((acc, rec) => {
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
      return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles["Off Duty"]}`}>{status}</span>;
  };

  const openEvidencePreview = (record, preferredType = "timeIn") => {
    const hasTimeInPhoto = Boolean(record?.photo);
    const hasTimeOutPhoto = Boolean(record?.timeOutPhoto);
    const resolvedType =
      preferredType === "timeOut"
        ? (hasTimeOutPhoto ? "timeOut" : hasTimeInPhoto ? "timeIn" : "timeOut")
        : (hasTimeInPhoto ? "timeIn" : hasTimeOutPhoto ? "timeOut" : "timeIn");

    setPreviewImage(record || null);
    setPreviewImageType(resolvedType);
  };

  const closeEvidencePreview = () => {
    setPreviewImage(null);
    setPreviewImageType("timeIn");
  };

  const activePreviewSrc = previewImageType === "timeOut" ? previewImage?.timeOutPhoto : previewImage?.photo;
  const reportCoverage = useMemo(() => {
    if (reportMode === "pick-dates") {
      if (!reportDateRange?.from || !reportDateRange?.to) return null;
      return {
        start: format(reportDateRange.from, "MMM dd, yyyy"),
        end: format(reportDateRange.to, "MMM dd, yyyy"),
      };
    }

    if (!reportYear || !reportMonth) return null;
    const year = Number(reportYear);
    const month = Number(reportMonth);
    const monthDate = new Date(year, month - 1, 1);
    const lastDay = getDaysInMonth(monthDate);
    const startDay = reportCutoff === "second-half" ? 16 : 1;
    const endDay = reportCutoff === "first-half" ? 15 : lastDay;
    return {
      start: format(new Date(year, month - 1, startDay), "MMM dd, yyyy"),
      end: format(new Date(year, month - 1, endDay), "MMM dd, yyyy"),
    };
  }, [reportCutoff, reportDateRange, reportMode, reportMonth, reportYear]);

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
        <style>{datePickerStyles}</style>
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
                          <span>Showing <span className="text-white font-semibold">{totalItems}</span> records</span>
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
                                          <th className="px-6 py-4 font-medium">#</th>
                                          <th className="px-6 py-4 font-medium">Guard Name</th>
                                          <th className="px-6 py-4 font-medium">Duty Station</th>
                                          <th className="px-6 py-4 font-medium">Shift Info</th>
                                              <th className="px-6 py-4 font-medium">Status</th>
                                              <th className="px-6 py-4 font-medium">Remarks</th>
                                              <th className="px-6 py-4 font-medium text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700/50">
                                      {records.map((rec) => (
                                          <tr key={rec._id} className="hover:bg-white/5 transition">
                                              <td className="px-6 py-4 text-sm text-gray-400">{rowNumberMap.get(rec._id)}</td>
                                              <td className="px-6 py-4"><div className="font-medium text-white flex items-center gap-2"><User size={16} className="text-gray-500" />{getPersonName(rec.guard, "Unknown Guard")}</div></td>
                                              <td className="px-6 py-4 text-gray-300">{rec.scheduleId?.deploymentLocation || "—"}</td>
                                              <td className="px-6 py-4"><div className="text-gray-300">{rec.scheduleId?.position}</div><div className="text-xs text-gray-500">{rec.scheduleId?.shiftType}</div></td>
                                              <td className="px-6 py-4">{getStatusBadge(rec.status)}</td>
                                              <td className="px-6 py-4 text-sm text-gray-300">
                                                {rec.remarks ? (
                                                  <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                                                    {rec.remarks}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-500">No remarks</span>
                                                )}
                                              </td>
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
                                                  <div className="text-xs font-medium text-gray-500">#{rowNumberMap.get(rec._id)}</div>
                                                  <div className="font-medium text-white">{getPersonName(rec.guard)}</div>
                                                  <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{rec.scheduleId?.deploymentLocation}</div>
                                              </div>
                                          </div>
                                          {getStatusBadge(rec.status)}
                                      </div>
                                      <div className="flex items-center justify-between text-sm pl-12 pr-1">
                                          <div className="text-gray-400"><span className="text-gray-500 text-xs block">Shift</span>{rec.scheduleId?.shiftType} ({rec.scheduleId?.position})</div>
                                          <button onClick={() => setSelectedGuardId(rec.guard._id)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-gray-300 transition"><ChevronRight size={18} /></button>
                                      </div>
                                      {rec.remarks ? (
                                        <div className="ml-12 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                                          {rec.remarks}
                                        </div>
                                      ) : null}
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))
              ) : <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-gray-800 border-dashed"><Clock size={48} className="mb-4 opacity-20" /><p>No attendance records found matching your filters.</p></div>}
          </div>

          <TablePagination
            page={currentPage}
            limit={PAGE_SIZE}
            totalItems={totalItems}
            currentCount={allAttendance.length}
            totalPages={totalPages}
            label="attendance records"
            onPageChange={setCurrentPage}
          />
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
                      Select date period for <strong className="text-white">{clientForReport}</strong>
                    </p>
                  </div>

                  {/* Period Picker */}
                  <div className="px-4 sm:px-6 py-2 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4 rounded-xl border border-gray-700 bg-[#0f172a] p-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Download Mode
                        </label>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReportMode("pick-dates")}
                            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                              reportMode === "pick-dates"
                                ? "border-blue-500/50 bg-blue-500/10 text-white"
                                : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            Pick dates
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportMode("cutoff")}
                            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                              reportMode === "cutoff"
                                ? "border-blue-500/50 bg-blue-500/10 text-white"
                                : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            Cut-off
                          </button>
                        </div>
                      </div>
                      {reportMode === "cutoff" ? (
                        <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Select Year
                            </label>
                            <select
                              value={reportYear}
                              onChange={(e) => setReportYear(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                            >
                              {Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 5 + index).map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Select Month
                            </label>
                            <select
                              value={reportMonth}
                              onChange={(e) => setReportMonth(e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-[#111827] px-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                            >
                              {Array.from({ length: 12 }, (_, index) => {
                                const monthValue = String(index + 1).padStart(2, "0");
                                const monthLabel = format(new Date(2026, index, 1), "MMMM");
                                return (
                                  <option key={monthValue} value={monthValue}>
                                    {monthLabel}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Cut-off Period
                        </label>
                        <div className="grid gap-3">
                          <button
                            type="button"
                            onClick={() => setReportCutoff("first-half")}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                              reportCutoff === "first-half"
                                ? "border-blue-500/50 bg-blue-500/10 text-white"
                                : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <div className="text-sm font-semibold">1st to 15th day</div>
                            <div className="mt-1 text-xs text-slate-400">First cut-off of the selected month</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportCutoff("second-half")}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                              reportCutoff === "second-half"
                                ? "border-blue-500/50 bg-blue-500/10 text-white"
                                : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <div className="text-sm font-semibold">16th to last day of month</div>
                            <div className="mt-1 text-xs text-slate-400">Last cut-off of the selected month</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportCutoff("whole-month")}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                              reportCutoff === "whole-month"
                                ? "border-blue-500/50 bg-blue-500/10 text-white"
                                : "border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <div className="text-sm font-semibold">Whole month</div>
                            <div className="mt-1 text-xs text-slate-400">First and last cut-off combined for the selected month</div>
                          </button>
                        </div>
                      </div>
                        </>
                      ) : (
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Pick Date Range
                          </label>
                          <div className="rounded-xl border border-slate-700 bg-[#111827] p-3">
                            <DayPicker
                              mode="range"
                              selected={reportDateRange}
                              onSelect={handleReportRangeSelect}
                              className="text-sm"
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Manual date range must stay within one month only.
                          </p>
                        </div>
                      )}

                       {reportCoverage ? (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                              <>
                                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Selected Coverage</span>
                                <span className="mt-1 block font-medium">{reportCoverage.start} to {reportCoverage.end}</span>
                              </>
                        </div>
                      ) : null}
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
                        <p className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">{getPersonName(selectedGuardInfo)}</p>
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
                                <th className="px-3 py-3 rounded-l-lg">#</th>
                                <th className="px-3 py-3 rounded-l-lg">Date</th>
                                <th className="px-3 py-3">Site</th>
                                <th className="px-3 py-3">Time In</th>
                                <th className="px-3 py-3">Time Out</th>
                                <th className="px-3 py-3">Duration</th>
                                <th className="px-3 py-3">Remarks</th>
                                <th className="px-3 py-3 rounded-r-lg">Evidence</th>
                              </tr>
                            </thead>
                            <tbody className="space-y-2">
                              {selectedGuardAttendance.map((rec, index) => {
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
                                    <td className="px-3 py-3 text-sm">{(detailPage - 1) * DETAIL_PAGE_SIZE + index + 1}</td>
                                    <td className="px-3 py-3 text-sm">{new Date(rec.timeIn).toLocaleDateString()}</td>
                                    <td className="px-3 py-3 text-sm"><div className="flex flex-col items-center gap-1"><span className="block max-w-[200px] truncate text-gray-300">{rec.location?.address || "No location"}</span>{rec.location?.latitude && (<a href={`https://maps.google.com/?q=${rec.location.latitude},${rec.location.longitude}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"><MapPin size={12} /> Map</a>)}</div></td>
                                    <td className="px-3 py-3 text-sm font-mono text-emerald-400">{new Date(rec.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="px-3 py-3 text-sm font-mono text-orange-400">{rec.timeOut ? new Date(rec.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}</td>
                                    <td className="px-3 py-3 text-sm font-medium">{working}</td>
                                    <td className="px-3 py-3 text-sm text-amber-300">{rec.remarks || "—"}</td>
                                    <td className="px-4 py-3"><button onClick={() => openEvidencePreview(rec)} className="bg-slate-700 hover:bg-blue-600 text-white p-2 rounded-lg transition" title="View Image"><FileImage size={18} /></button></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="md:hidden space-y-4">
                          {selectedGuardAttendance.map((rec, index) => {
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
                                  <div>
                                    <div className="text-xs font-medium text-gray-500">#{(detailPage - 1) * DETAIL_PAGE_SIZE + index + 1}</div>
                                    <div className="flex items-center gap-2 text-white font-medium"><CalendarDays size={16} className="text-blue-400"/>{new Date(rec.timeIn).toLocaleDateString()}</div>
                                  </div>
                                  <div className="text-xs bg-slate-700 px-2 py-1 rounded text-gray-300">Duration: <span className="text-white font-bold">{working}</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-emerald-900/20 border border-emerald-500/20 rounded p-2 text-center"><span className="text-xs text-emerald-500 block uppercase">Time In</span><span className="text-white font-mono">{new Date(rec.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                  <div className="bg-orange-900/20 border border-orange-500/20 rounded p-2 text-center"><span className="text-xs text-orange-500 block uppercase">Time Out</span><span className="text-white font-mono">{rec.timeOut ? new Date(rec.timeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}</span></div>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-gray-400"><MapPin size={16} className="shrink-0 mt-0.5 text-gray-500" /><div><p className="line-clamp-2 leading-tight">{rec.location?.address || "No location recorded"}</p>{rec.location?.latitude && (<a href={`https://maps.google.com/?q=${rec.location.latitude},${rec.location.longitude}`} target="_blank" rel="noreferrer" className="text-blue-400 text-xs mt-1 inline-block hover:underline">View on Google Maps</a>)}</div></div>
                                {rec.remarks ? (
                                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                                    {rec.remarks}
                                  </div>
                                ) : null}
                                <button onClick={() => openEvidencePreview(rec)} className="w-full mt-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition active:scale-[0.98]"><FileImage size={16} /> View Evidence Photo</button>
                              </div>
                             );
                          })}
                        </div>
                      </>
                    ) : <div className="flex flex-col items-center justify-center h-40 sm:h-64 text-gray-400"><Clock size={48} className="mb-3 opacity-20" /><p>No attendance records found.</p></div>}
                  </div>
                  <div className="px-4 sm:px-6">
                    <TablePagination
                      page={detailPage}
                      limit={DETAIL_PAGE_SIZE}
                      totalItems={detailTotalItems}
                      currentCount={selectedGuardAttendance.length}
                      totalPages={detailTotalPages}
                      label="attendance entries"
                      onPageChange={setDetailPage}
                    />
                  </div>
                  {/* Footer */}
                  <div className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-gray-400 border-t border-gray-700 bg-[#1e293b] shrink-0 text-center sm:text-left">
                    Total Records: <span className="text-white font-semibold">{detailTotalItems}</span>
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
          <Dialog as="div" className="relative z-50" onClose={closeEvidencePreview}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            </Transition.Child>
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-4xl bg-[#0f172a]/95 border border-gray-700 rounded-2xl p-4 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <Dialog.Title className="text-lg text-white font-semibold">Attendance Evidence</Dialog.Title>
                      <p className="text-sm text-slate-400">
                        {getPersonName(selectedGuardInfo || previewImage?.guard, "Guard Record")} • {previewImage?.timeIn ? new Date(previewImage.timeIn).toLocaleDateString() : "No date"}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-white" onClick={closeEvidencePreview}><X size={20} /></button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewImageType("timeIn")}
                      disabled={!previewImage?.photo}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        previewImageType === "timeIn"
                          ? "bg-blue-600 text-white"
                          : "border border-gray-700 bg-[#1e293b] text-gray-300 hover:border-blue-500"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Time In Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewImageType("timeOut")}
                      disabled={!previewImage?.timeOutPhoto}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        previewImageType === "timeOut"
                          ? "bg-blue-600 text-white"
                          : "border border-gray-700 bg-[#1e293b] text-gray-300 hover:border-blue-500"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Time Out Image
                    </button>
                  </div>

                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-700 bg-[#111827] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Time In</div>
                      <div className="mt-1 text-sm font-medium text-emerald-300">
                        {previewImage?.timeIn ? new Date(previewImage.timeIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-700 bg-[#111827] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Time Out</div>
                      <div className="mt-1 text-sm font-medium text-orange-300">
                        {previewImage?.timeOut ? new Date(previewImage.timeOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center min-h-[320px]">
                    {activePreviewSrc ? (
                      <img
                        src={activePreviewSrc}
                        alt={previewImageType === "timeOut" ? "Attendance Time Out Evidence" : "Attendance Time In Evidence"}
                        className="max-h-[70vh] w-auto rounded-xl border border-gray-700 shadow-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-700 bg-[#111827] px-8 text-gray-400 min-h-[320px] w-full">
                        No {previewImageType === "timeOut" ? "time out" : "time in"} image available
                      </div>
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
