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
  FileImage, } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Dialog, Transition } from "@headlessui/react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function GuardAttendancePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [guards, setGuards] = useState(null)
  const [selectedguardid, setSelectedGuardId] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate();

  const { user: admin, loading } = useAuth();

  useEffect(() => {
    if (!admin && !loading) {
      navigate("/admin/Login");
      return;
    }
  }, [admin, loading, navigate]);

  useEffect(() => {
    const fetchGuards = async () => {
      try {
        setLoadingPage(true);
        setError(null);

        const res = await fetch("http://localhost:5000/api/guards", {
          credentials: "include",
        });

        const data = await res.json().catch(() => []);

        if (!res.ok) throw new Error(data?.message || "Failed to fetch guards");

        setGuards(Array.isArray(data) ? data : []);
        console.log(guards)

      } catch (err) {
        setError(err.message || "Failed to fetch guards");
      } finally {
        setLoadingPage(false);
      }
    };

    fetchGuards();
  }, [admin]);

  const fetchAttendanceForGuard = async (guardId) => {

    try {
      setLoadingPage(true);
      setError(null);

      const res = await fetch(
        `http://localhost:5000/api/attendance/${guardId}`,
        { credentials: "include" }
      );

      let data = await res.json().catch(() => []);
      console.log(data)

      if (!res.ok) throw new Error(data?.message || "Failed to fetch attendance");

      data = data.map((record) => ({
        ...record,
        dateFormatted: record.date
          ? new Date(record.date).toLocaleDateString([], {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-",

        timeInFormatted: record.timeIn
          ? new Date(record.timeIn).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "-",

        timeOutFormatted: record.timeOut
          ? new Date(record.timeOut).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "-",
      }));
      console.log(data)

      setAttendance(data);
      setSelectedGuardId(guardId);

    } catch (err) {
      setError(err.message || "Failed to fetch guard attendance");
    } finally {
      setLoadingPage(false);
    }
  };

  // Filter and search
  const filtered = attendance
    .filter((a) => (filter === "All" ? true : (a.status || "").toLowerCase() === filter.toLowerCase()))
    .filter((a) => {
      const name = (a.guardName || a.guard?.fullName || "").toLowerCase();
      return name.includes(search.toLowerCase());
    });

  function parseTime12toDate(timeStr) {
    if (!timeStr) return null;

    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes, seconds] = time.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date;
  }

  const handleDownloadWorkHours = async (id) => {
    console.log(id)
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/attendance/download-working-hours/${id}`, {
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
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 flex flex-col p-4 md:p-6">
        {/* ===== Header ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
          <h2 className="text-3xl font-bold tracking-wide text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            Guards Attendance
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-700 bg-[#1e293b] text-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All</option>
              <option value="On Duty">On Duty</option>
              <option value="Off Duty">Off Duty</option>
            </select>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search guard..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1e293b] border border-gray-700 rounded-md pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status messages */}
        {loading && <div className="mb-4 text-sm text-blue-300">Loading attendance...</div>}
        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        {/* ===== Table ===== */}
       <div className="overflow-x-auto bg-[#1e293b]/60 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-[#234C6A] text-gray-100 text-sm uppercase tracking-wider">
              <tr className="text-center">
                <th className="px-4 py-3">Guard Name</th>
                <th className="px-4 py-3">Duty Station</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {guards?.length > 0 ? (
                guards.map((g) => {
                  const name = g.fullName || g.name || "Unnamed";
                  const station = g.dutyStation || "-";
                  const shift = g.shift || "-";
                  const phone = g.phoneNumber || "-";

                  return (
                    <tr
                      key={g._id}
                      className="border-t border-gray-700 hover:bg-[#243046] transition-colors text-sm text-center"
                    >
                      <td className="px-4 py-3 font-medium text-white">{name}</td>
                      <td className="px-4 py-3 text-gray-300">{station}</td>
                      <td className="px-4 py-3">{shift}</td>
                      <td className="px-4 py-3">{g.statusToday}</td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => fetchAttendanceForGuard(g._id)}
                          className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-4 py-2 rounded-lg transition font-medium"
                        >
                          View Attendance
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-400 italic">
                    No guards found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {/* ===== Footer Summary ===== */}
        <div className="flex justify-between items-center mt-6 text-gray-400 text-sm">
          <p>Total Records: {attendance.length}</p>
          <p>
            Showing <span className="text-blue-400">{filtered.length}</span> of{" "}
            <span className="text-blue-400">{attendance.length}</span> entries
          </p>
        </div>
      </main>

      <Transition appear show={selectedguardid !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedGuardId(null)}>
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
                  
                  {/* ========== HEADER ========== */}
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

                  {/* ========== GUARD DETAILS ========== */}
                  {attendance[0] && (
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-[#192233] gap-4">
                      {/* Left: Guard Info */}
                          <Shield className="text-blue-400" size={50} />

                      <div className="flex-1 flex flex-col gap-1">
                        <p className="text-xl font-semibold text-white flex items-center gap-2">
                          <User className="text-blue-400" size={20}/>
                          {attendance[0].guardName}
                        </p>

                        <p className="text-gray-300 flex items-center gap-2">
                          <Phone size={20} className="text-blue-300" />
                          {attendance[0].phoneNumber}
                        </p>

                        <p className="text-gray-300 flex items-center gap-2">
                          <IdCard size={20} className="text-blue-300" />
                          {attendance[0].guardId}
                        </p>
                      </div>

                      {/* Right: Download Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleDownloadWorkHours(attendance[0].guard)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition flex gap-2"
                        >
                          <FileDown/> Download Working Hours
                        </button>
                      </div>
                    </div>
                  )}


                  {/* ========== TABLE ========== */}
                  <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {attendance.length > 0 ? (
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
                          {attendance.map((rec) => {
                            // compute working hours
                            let working = "-";
                            if (rec.timeIn && rec.timeOut) {
                              let t1 = parseTime12toDate(rec.timeIn);
                              let t2 = parseTime12toDate(rec.timeOut);

                              // If timeOut is before timeIn, assume overnight shift
                              if (t2 <= t1) {
                                t2.setDate(t2.getDate() + 1);
                              }

                              const diffMs = t2 - t1;
                              if (diffMs > 0) {
                                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                working = `${diffHrs}h ${diffMin}m`;
                              }
                            }
                            return (
                              <tr
                                key={rec._id}
                                className="text-center border-t border-gray-700 hover:bg-[#2a3650] transition"
                              >
                                <td className="px-3 py-2">{rec.date}</td>
                                <td className="px-3 py-2 flex flex-col items-center">
                                  <span className="block max-w-[500px] whitespace-nowrap overflow-hidden text-ellipsis">
                                    {attendance[0].location?.address || "No location recorded"}
                                  </span>

                                  {attendance[0].location?.latitude &&
                                    attendance[0].location?.longitude && (
                                      <a
                                        href={`https://www.google.com/maps?q=${attendance[0].location.latitude},${attendance[0].location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-1"
                                      >
                                        <MapPin size={14} />
                                        View on Google Maps
                                      </a>
                                    )}
                                </td>
                                <td className="px-3 py-2">{rec.timeIn}</td>
                                <td className="px-3 py-2">{rec.timeOut}</td>
                                
                                <td className="px-3 py-2">{working ?? "-"}</td>
                                <td className="px-4 py-2 ">
                                  <button 
                                    onClick={() => setPreviewImage(attendance[0]?.photo)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition flex gap-2">
                                      <FileImage className="text-white" />
                                      Image
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-[#234C6A] text-gray-100 text-sm uppercase tracking-wider">
                          <tr className="text-center">
                            <td className="px-4 py-3" colSpan={2}></td> {/* Empty cells to align */}
                            <td className="px-4 py-3 font-medium text-white">Totals Days:</td>
                            <td className="px-4 py-3 font-medium">
                              {/* Present days */}
                              No. {attendance.filter((rec) => rec.timeIn).length}
                            </td>
                            <td className="px-4 py-3 font-medium text-white">Totals Hours:</td>
                            <td className="px-4 py-3 font-medium" colSpan={2}>
                              {(() => {
                                let totalMinutes = attendance.reduce((sum, rec) => {
                                  if (rec.timeIn && rec.timeOut) {
                                    const inParts = rec.timeIn.replace(" AM", "").replace(" PM", "").split(":").map(Number);
                                    const outParts = rec.timeOut.replace(" AM", "").replace(" PM", "").split(":").map(Number);

                                    let [h1, m1, s1] = inParts;
                                    let [h2, m2, s2] = outParts;

                                    // Convert 12-hour to 24-hour
                                    if (rec.timeIn.includes("PM") && h1 < 12) h1 += 12;
                                    if (rec.timeIn.includes("AM") && h1 === 12) h1 = 0;
                                    if (rec.timeOut.includes("PM") && h2 < 12) h2 += 12;
                                    if (rec.timeOut.includes("AM") && h2 === 12) h2 = 0;

                                    let start = new Date(0, 0, 0, h1, m1, s1);
                                    let end = new Date(0, 0, 0, h2, m2, s2);

                                    // Handle overnight
                                    if (end < start) end.setDate(end.getDate() + 1);

                                    const diffMinutes = (end - start) / (1000 * 60);
                                    return sum + diffMinutes;
                                  }
                                  return sum;
                                }, 0);

                                const hours = Math.floor(totalMinutes / 60);
                                const minutes = Math.round(totalMinutes % 60);

                                return `${hours}h ${minutes}m`;
                              })()}
                            </td>

                            <td className="px-4 py-3"></td> {/* Empty for action column */}
                          </tr>
                        </tfoot>

                      </table>
                    ) : (
                      <p className="text-gray-400 text-center py-6 italic">
                        No attendance records found.
                      </p>
                    )}
                  </div>

                  {/* ========== FOOTER ========== */}
                  <div className="px-6 py-3 text-sm text-gray-400 border-t border-gray-700">
                    Showing {attendance.length} record(s)
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
