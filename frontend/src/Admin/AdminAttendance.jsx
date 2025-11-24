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
  RefreshCcw, } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Dialog, Transition } from "@headlessui/react";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

      const res = await fetch("http://localhost:5000/api/attendance", {
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
          `http://localhost:5000/api/attendance/${selectedGuardId}`,
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
    .filter(a => selectedClient === "" || (a.scheduleId?.client || "").toLowerCase() === selectedClient.toLowerCase())
    .filter(a => filter === "All" ? true : (a.status || "").toLowerCase() === filter.toLowerCase())
    .filter(a => (a.guard?.fullName || "").toLowerCase().includes(search.toLowerCase()));

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

  const handleDownloadWorkHoursByClient = async (clientName) => {
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/attendance/download-working-hours/client/${encodeURIComponent(clientName)}`, {
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
            <button
              onClick={() => fetchAllAttendance()}
              className="px-4 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition"
              title="Refresh List"
            >
              <RefreshCcw className="size-4" />
            </button>
            {/* client Filter Dropdown */}
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="border border-gray-700 bg-[#1e293b] text-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Client</option>
              {clientList.map((clientName) => (
                <option key={clientName} value={clientName}>
                  {clientName}
                </option>
              ))}
            </select>
            {/* status Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-700 bg-[#1e293b] text-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
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
        <div className="overflow-x-auto bg-[#1e293b]/60 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg p-3">
          {Object.entries(
            filteredAttendance.reduce((acc, rec) => {
              const client = rec.scheduleId?.client || "No Client";
              if (!acc[client]) acc[client] = [];
              acc[client].push(rec);
              return acc;
            }, {})
          ).map(([clientName, clientAttendance]) => (
            <div key={clientName} className="mb-8">
              {/* Client Header */}
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-white mb-3 border-l-4 border-teal-500 pl-3">
                  {clientName}
                </h2>
                <div className="">
                  <button
                      onClick={() => handleDownloadWorkHoursByClient(clientName)}
                      className="bg-[#0F172A] hover:bg-[#182544] text-white text-sm px-3 py-2 rounded-lg font-medium transition flex gap-2">
                      <FileDown className="text-green-400 w-5 h-5"/>Download Working Hours
                    </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg shadow-lg">
                <table className="min-w-full text-sm text-gray-300 border border-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-[#0f172a] text-gray-400">
                    <tr>
                      <th className="py-3 px-4 text-left">Guard Name</th>
                      <th className="py-3 px-4 text-left">Duty Station</th>
                      <th className="py-3 px-4 text-left">Position</th>
                      <th className="py-3 px-4 text-left">Shift</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientAttendance.length > 0 ? (
                      clientAttendance.map((rec, i) => (
                        <tr key={rec._id} className={`${i % 2 === 0 ? "bg-[#1e293b]" : "bg-[#162033]"} hover:bg-[#2a3954]`}>
                          <td className="py-3 px-4">{rec.guard?.fullName || "-"}</td>
                          <td className="py-3 px-4">{rec.scheduleId?.deploymentLocation || "-"}</td>
                          <td className="py-3 px-4">{rec.scheduleId?.position || "-"}</td>
                          <td className="py-3 px-4">{rec.scheduleId?.shiftType || "-"}</td>
                          <td className="py-3 px-4">{rec.status}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setSelectedGuardId(rec.guard._id)}
                              className=" bg-blue-500/20 px-3 py-2 rounded-lg hover:bg-blue-500/30 my-1"
                            >
                              View Attendance
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-gray-400 py-6 text-center italic">No attendance found for this client</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
         </div>
          <p>Total Records: {allAttendance.length}</p>
          <p>
            Showing <span className="text-blue-400">{filteredAttendance.length}</span> of{" "}
            <span className="text-blue-400">{allAttendance.length}</span> entries
          </p>
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
                    <button
                      onClick={() => handleDownloadWorkHours(selectedGuardInfo._id)}
                      className="bg-[#3d5986] text-white px-3 py-2 rounded-lg font-medium transition flex gap-2">
                      <FileDown className="text-green-400"/>Download Working Hours
                    </button>
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
