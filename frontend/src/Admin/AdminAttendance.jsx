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
  Image as ImageIcon, } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Dialog, Transition } from "@headlessui/react";

export default function GuardAttendancePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const { user:admin, loading } = useAuth();

  useEffect(() => {
    if (!admin && !loading) {
      navigate("/admin/Login");
      return;
    }
  }, [admin, loading, navigate]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoadingPage(true);
        setError(null);

        const res = await fetch("http://localhost:5000/api/attendance", {
          credentials: "include",
        });

        let data = await res.json().catch(() => []);

        if (!res.ok) throw new Error(data?.message || "Failed to fetch attendance");

        // Format each record's date and times
        if (Array.isArray(data)) {
          data = data.map((record) => ({
            ...record,
            dateFormatted: record.date ? new Date(record.date).toLocaleDateString([], {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }) : "-",
            timeInFormatted: record.timeIn ? new Date(record.timeIn).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }) : "-",
            timeOutFormatted: record.timeOut ? new Date(record.timeOut).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }) : "-",
          }));
        }

        setAttendance(data);

      } catch (err) {
        setError(err.message || "Failed to fetch attendance");
      } finally {
        setLoadingPage(false);
      }
    };

    fetchAttendance();
  }, [admin]);

  // Filter and search
  const filtered = attendance
    .filter((a) => (filter === "All" ? true : (a.status || "").toLowerCase() === filter.toLowerCase()))
    .filter((a) => {
      const name = (a.guardName || a.guard?.fullName || "").toLowerCase();
      return name.includes(search.toLowerCase());
    });

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
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-[#234C6A] text-gray-100 text-sm uppercase tracking-wider">
              <tr className="text-center">
                <th className="px-4 py-3">Guard Name</th>
                <th className="px-4 py-3">Duty Station</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time In</th>
                <th className="px-4 py-3">Time Out</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Working Hour</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((a) => {
                  const name = a.guardName || a.guard?.fullName || "Unknown";
                  const station = a.dutyStation || a.siteAddress || "-";
                  const date = a.date
                    ? new Date(a.date).toLocaleDateString()
                    : new Date(a.createdAt).toLocaleDateString();

                  const timeIn = a.timeIn
                    ? new Date(a.timeIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "-";

                  const timeOut = a.timeOut
                    ? new Date(a.timeOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "-";

                  // Compute working hours if both in/out exist
                  let workingHour = "-";
                  if (a.timeIn && a.timeOut) {
                    const t1 = new Date(a.timeIn);
                    const t2 = new Date(a.timeOut);
                    const diff = (t2 - t1) / (1000 * 60 * 60); // hours
                    workingHour = diff > 0 ? `${diff.toFixed(2)} hrs` : "-";
                  }

                  const status = a.status || "Inactive";

                  return (
                    <tr
                      key={a._id}
                      className="border-t border-gray-700 hover:bg-[#243046] transition-colors text-sm text-center"
                    >
                      <td className="px-4 py-3 font-medium text-white">{name}</td>
                      <td className="px-4 py-3">{station}</td>
                      <td className="px-4 py-3 text-gray-300">{date}</td>
                      <td className="px-4 py-3">{timeIn}</td>
                      <td className="px-4 py-3">{timeOut}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            status === "On Duty"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{workingHour}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="text-blue-400 hover:text-blue-300 transition"
                          title="View Details"
                          onClick={() => setSelected(a)}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-gray-400 italic">
                    No attendance records found
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

      <Transition appear show={Boolean(selected)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelected(null)}>
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

          {/* Modal */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-7xl overflow-hidden rounded-2xl bg-[#0f172a]/95 border border-gray-700 shadow-2xl backdrop-blur-md">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#121c2b]">
                    <Dialog.Title className="text-xl font-semibold text-white flex items-center gap-2">
                      <FileText size={20} className="text-blue-400" />
                      Attendance Details
                    </Dialog.Title>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-800">
                    {/* Left Panel */}
                    <div className="w-1/2 p-6 space-y-6 bg-gradient-to-b from-[#111a2b] to-[#0b1220] overflow-y-auto max-h-[80vh]">
                      {selected && (
                        <>
                          <div className="flex gap-x-4 justify-between w-full">
                            {/* Guard Info */}
                            <div className="w-full">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-400 mb-3">
                                Guard Information
                              </h3>
                              <div className="space-y-2 text-sm ">
                                <DetailRow icon={<User size={16} />} label="Name" value={selected.guardName || selected.guard?.fullName} />
                                <DetailRow icon={<Hash size={16} />} label="Guard ID" value={selected.guardId} />
                                <DetailRow icon={<Shield size={16} />} label="Position" value={selected.position} />
                                <DetailRow icon={<Clock size={16} />} label="Shift" value={selected.shift} />
                                <DetailRow icon={<MapPin size={16} />} label="Duty Station" value={selected.dutyStation} />
                              </div>
                            </div>
                            {/* Contact Info */}
                            <div className="w-full">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-400 mb-3">
                                Contact
                              </h3>
                              <div className="space-y-2 text-sm">
                                <DetailRow icon={<Mail size={16} />} label="Email" value={selected.email || selected.guard?.email} />
                                <DetailRow icon={<Phone size={16} />} label="Phone" value={selected.phoneNumber} />
                              </div>
                            </div>
                          </div>

                          {/* Attendance Info */}
                          <div className="w-full">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-400 mb-3">
                              Attendance Record
                            </h3>
                            <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="w-full">
                                <DetailRow icon={<CalendarDays size={16} />} label="Date" value={selected.dateFormatted || selected.date} />
                                <DetailRow icon={<Clock size={16} />} label="Time In" value={selected.timeInFormatted || selected.timeIn} />
                                <DetailRow icon={<Clock size={16} />} label="Time Out" value={selected.timeOutFormatted || selected.timeOut} />
                                <DetailRow icon={<Shield size={16} />} label="Status" value={selected.status} />
                                <DetailRow icon={<MapPin size={16} />} label="Site Address" value={selected.siteAddress} />
                              </div>
                              <div className="w-full">
                                <DetailRow
                                  icon={<MapPin size={16} />}
                                  label="Coordinates"
                                  value={
                                    selected.location
                                      ? `${selected.location.latitude?.toFixed?.(5)}, ${selected.location.longitude?.toFixed?.(5)}`
                                      : "-"
                                  }
                                />
                                <DetailRow
                                  icon={<CalendarDays size={16} />}
                                  label="Submitted At"
                                  value={
                                    selected.submittedAt
                                      ? new Date(selected.submittedAt).toLocaleString([], {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                        })
                                      : "-"
                                  }
                                />
                                <DetailRow
                                  icon={<CalendarDays size={16} />}
                                  label="Created"
                                  value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "-"}
                                />
                                <DetailRow icon={<Hash size={16} />} label="Record ID" value={selected._id} />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Panel (Photo) */}
                    <div className="w-full md:w-1/2 bg-[#0b1320] flex flex-col items-center justify-center p-6">
                      {selected?.photo ? (
                        <div className="relative group">
                          <img
                            src={selected.photo}
                            alt="Attendance evidence"
                            className="max-h-[75vh] w-auto rounded-xl border border-gray-700 shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition">
                            <ImageIcon size={12} className="inline mr-1" /> Evidence Photo
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 text-sm">
                          <ImageIcon className="mb-2" size={36} />
                          No image available
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
    </div>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <div className="py-2 border-b border-gray-800/40">
    <div className="flex gap-1 items-start">
      <div className="flex items-center gap-2 text-gray-400">
        <span className="text-blue-400">{icon}</span>
        <span className="font-medium">{label}:</span>
      </div>
      <div className="text-gray-200 break-words whitespace-pre-wrap ">
        {value || "-"}
      </div>
    </div>
  </div>
);

// Helper: Convert 12-hour time (e.g., "10:23:14 PM") to 24-hour "HH:mm:ss"
function convertTo24(timeStr) {
  if (!timeStr.includes("M")) return timeStr; // already 24hr
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes, seconds] = time.split(":");
  hours = parseInt(hours, 10);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
}
