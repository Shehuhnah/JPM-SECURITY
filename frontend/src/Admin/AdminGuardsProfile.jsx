import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { 
  Search, 
  Shield, 
  UserCheck, 
  Clock, 
  UserPlus, 
  Phone, 
  MapPin, 
  Mail, 
  RefreshCw, 
  Pencil, 
  Trash,
  Eye,
  X
} from "lucide-react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../components/Loading.jsx";
import DeleteUserModal from "../components/DeleteUserModal";
import { useAuth } from "../hooks/useAuth.js"
import { useNavigate } from "react-router-dom";
import TablePagination from "../components/admin/TablePagination.jsx";
import { getPersonName } from "../utils/name";

const api = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const REQUIRED_GUARD_FIELDS = [
  "firstName",
  "lastName",
  "sex",
  "email",
  "guardId",
  "address",
  "position",
  "phoneNumber",
  "EmergencyPerson",
  "EmergencyContact",
];

export default function GuardTable() {
  const { user: admin, loading } = useAuth();
  const navigate = useNavigate();
  const canManageGuards = admin?.role === "Admin";
  
  // --- States ---
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false); 
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editIsOpen, setEditIsOpen] = useState(false); 
  const [guards, setGuards] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});

  // Define initial state constant to reuse for resetting
  const initialFormState = {
    firstName: "",
    lastName: "",
    sex: "Male",
    email: "",
    guardId: "",
    address: "",
    position: "",
    phoneNumber: "",
    SSSID: "",
    PhilHealthID: "",
    PagibigID: "",
    EmergencyPerson: "",
    EmergencyContact: "",
    status: "Active" // Default status
  };
  
  const [form, setForm] = useState(initialFormState);

  // --- Fetch users ---
  useEffect(() => {
    document.title = "Guards Profile | JPM Security Agency";
    if (!admin && !loading) {
      navigate("/admin/login");
      return;
    }
  }, [admin, loading, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (admin) {
      handleRefresh(currentPage);
    }
  }, [admin, currentPage, search, filter]);

  // --- Handlers ---

  const handleRefresh = async (page = currentPage) => {
    try {
      setLoadingPage(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (search.trim()) params.set("q", search.trim());
      if (filter !== "All") params.set("position", filter);

      const res = await fetch(`${api}/api/guards?${params.toString()}`, {
         credentials: "include",
        });
      const data = await res.json();
      setGuards(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setForm(initialFormState); // Reset form on refresh
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const digitsOnly = value.replace(/\D/g, "");
    setForm((prev) => ({
      ...prev,
      [name]: digitsOnly,
    }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setFieldValue = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const getFieldClass = (name) =>
    `w-full bg-[#0f172a] rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600 ${
      fieldErrors[name] ? "border border-red-500 ring-1 ring-red-500/60" : "border border-gray-700"
    }`;

  const getPhoneWrapperClass = (name) =>
    `flex items-center rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${
      fieldErrors[name] ? "border border-red-500 ring-1 ring-red-500/60" : "border border-gray-700"
    }`;

  // Open Add Modal - FIX: Resets form correctly
  const openAddGuardModal = () => {
    setForm(initialFormState);
    setErrorMsg("");
    setFieldErrors({});
    setIsOpen(true);
  };

  // Submit New Guard
  const handleAddGuard = async () => {
    setErrorMsg("");
    const nextFieldErrors = REQUIRED_GUARD_FIELDS.reduce((acc, field) => {
      if (!String(form[field] || "").trim()) acc[field] = true;
      return acc;
    }, {});
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      const msg = "Please fill in all required fields.";
      setErrorMsg(msg);
      toast.error(msg, { theme: "dark", transition: Bounce });
      return;
    }

    console.log("🛠 Submitting new guard:", form);

    try {
      setLoadingPage(true);
      const res = await fetch(`${api}/api/guards`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to create guard");

      const newGuard = await res.json();
      setGuards((prev) => [...prev, newGuard]); 
      setIsOpen(false);
      setForm(initialFormState); // Reset form
      setFieldErrors({});

      toast.success("Guard added successfully!", {
        theme: "dark",
        transition: Bounce,
      });
      handleRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("❌ Failed to connect to server.");
      toast.error("❌ Failed to create guard", { theme: "dark", transition: Bounce });
    } finally {
      setLoadingPage(false);
    }
  };

  // Delete Guard
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${api}/api/guards/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete Guard");

      setGuards((prev) => prev.filter((u) => u._id !== id));
      setSelectedUser(null);
      
      toast.success("✅ Guard deleted successfully", {
        theme: "dark",
        transition: Bounce,
      });
    } catch (err) {
      console.error("❌ Delete Guard error:", err);
      toast.error("❌ Failed to delete Guard", { theme: "dark", transition: Bounce });
    }
  };

  // Edit Guard
  const handleEdit = (guard) => {
    setForm(guard);
    setErrorMsg("");
    setFieldErrors({});
    setEditIsOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setErrorMsg("");
      const nextFieldErrors = REQUIRED_GUARD_FIELDS.reduce((acc, field) => {
        if (!String(form[field] || "").trim()) acc[field] = true;
        return acc;
      }, {});
      setFieldErrors(nextFieldErrors);

      if (Object.keys(nextFieldErrors).length > 0) {
        const msg = "Complete the highlighted required fields before saving.";
        setErrorMsg(msg);
        toast.error(msg, { theme: "dark", transition: Bounce });
        return;
      }

      setLoadingPage(true);

      const originalGuard = guards.find((g) => g._id === form._id);
      if (!originalGuard) throw new Error("Selected guard not found");

      const updatedFields = {};
      Object.keys(form).forEach((key) => {
        if (form[key] !== originalGuard[key]) {
          updatedFields[key] = form[key];
        }
      });

      if (Object.keys(updatedFields).length === 0) {
        setEditIsOpen(false);
        toast.info("⚠️ No changes detected.", { theme: "dark" });
        return;
      }

      const res = await fetch(`${api}/api/guards/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedFields), 
      });

      if (!res.ok) throw new Error("Failed to update guard");

      const updatedGuard = await res.json();
      setGuards((prev) =>
        prev.map((g) => (g._id === updatedGuard._id ? updatedGuard : g))
      );

      setEditIsOpen(false);
      setErrorMsg("");
      setFieldErrors({});
      toast.success("✅ Guard updated successfully!", { theme: "dark" });
    } catch (err) {
      console.error("Update guard error:", err);
      toast.error("Failed to update guard details.", { theme: "dark" });
    } finally {
      setLoadingPage(false);
    }
  };

  const handleView = (guard) => {
    setSelectedGuard(guard);
    setIsViewOpen(true);
  };

  const ProfileItem = ({ label, value }) => (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-medium bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 mt-1">
        {value || "—"}
      </p>
    </div>
  );

  const getStatusBadge = (status) => {
    const styles = {
        Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        Inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        "On Duty": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        Suspended: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    const activeStyle = styles[status] || styles["Inactive"];

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${activeStyle}`}>
            {status}
        </span>
    );
  };

  if (loading) return <Loader text="Loading, Please wait a minute..." />;

  return (
    <>
      <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
        <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-900/50 min-h-screen">
          
          {/* --- Header Section --- */}
          <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                      <Shield className="text-blue-500" size={28}/> 
                  </div>
                  <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                          Guards Profile
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                          Manage security personnel and assignments.
                      </p>
                  </div>
              </div>

              {/* Controls Toolbar */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch gap-3 w-full xl:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0 sm:w-64 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition" />
                      <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search name, ID, email, or position..."
                          className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 
                          text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                  </div>

                  <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-[#1e293b] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 
                      focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-[#243046] transition"
                  >
                      <option value="All">All Positions</option>
                      <option value="Security Guard">Security Guard</option>
                      <option value="Officer in Charge">Officer in Charge</option>
                      <option value="Inspector">Inspector</option>
                  </select>

                  <button
                      onClick={handleRefresh}
                      className="px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 
                      hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
                      title="Refresh List"
                  >
                      <RefreshCw className="size-5" />
                  </button>

                  {/* Add Guard Button (Admin Only) */}
                  {canManageGuards && (
                      <button
                          onClick={openAddGuardModal}
                          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 
                          rounded-lg shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 font-medium text-sm"
                      >
                          <UserPlus size={18} />
                          <span>Add Guard</span>
                      </button>
                  )}
              </div>
          </header>

          {/* DESKTOP VIEW: Enhanced Table */}
          <div className="hidden md:block overflow-hidden bg-[#1e293b]/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-800/50 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                      <tr>
                          <th className="px-6 py-4 font-semibold">#</th>
                          <th className="px-6 py-4 font-semibold">Guard Profile</th>
                          <th className="px-6 py-4 font-semibold">Position</th>
                          <th className="px-6 py-4 font-semibold">Contact Info</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                      {guards.length > 0 ? (
                          guards.map((g, index) => (
                              <tr key={g._id} className="group hover:bg-slate-800/50 transition duration-150">
                                  <td className="px-6 py-4 text-sm text-gray-400">
                                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                              <UserCheck size={20} />
                                          </div>
                                          <div>
                                              <div className="font-medium text-white">{getPersonName(g)}</div>
                                              <div className="text-xs text-blue-400 font-mono">ID: {g.guardId}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-300">{g.position}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2 text-xs text-gray-400">
                                              <Phone size={12} /> {g.phoneNumber}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-gray-400">
                                              <Mail size={12} /> {g.email}
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">{getStatusBadge(g.status)}</td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => handleView(g)} className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-400 transition" title="View Profile">
                                              <Eye size={18} />
                                          </button>
                                          
                                          {canManageGuards && (
                                              <>
                                                  <button onClick={() => handleEdit(g)} className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-yellow-400 transition" title="Edit">
                                                      <Pencil size={18} />
                                                  </button>
                                                  <button onClick={() => setSelectedUser(g)} className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-red-400 transition" title="Delete">
                                                      <Trash size={18} />
                                                  </button>
                                              </>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr>
                              <td colSpan="6" className="text-center py-12 text-gray-500">
                                  <div className="flex flex-col items-center gap-2">
                                      <Shield size={32} className="text-gray-700" />
                                      <p>No guards found matching your search.</p>
                                  </div>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* MOBILE VIEW: Cards */}
          <div className="md:hidden grid gap-4">
              {guards.length > 0 ? guards.map((g, index) => (
                  <div key={g._id} className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                                  <UserCheck size={20} />
                              </div>
                              <div>
                                  <p className="text-xs font-medium text-gray-500">#{(currentPage - 1) * PAGE_SIZE + index + 1}</p>
                                  <h3 className="font-semibold text-white">{g.firstName} {g.lastName}</h3>
                                  <span className="text-xs text-gray-400">ID: {g.guardId}</span>
                              </div>
                          </div>
                          {getStatusBadge(g.status)}
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
                              <span className="text-gray-500">Position</span>
                              <span className="text-gray-200">{g.position}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                              <Phone size={14} className="text-blue-500" /> {g.phoneNumber}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                              <Mail size={14} className="text-blue-500" /> {g.email}
                          </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => handleView(g)} className="flex items-center justify-center py-2 bg-slate-800 rounded-lg text-gray-300 hover:text-white border border-gray-700">
                              <Eye size={18} />
                          </button>
                          {canManageGuards && (
                              <>
                                  <button onClick={() => handleEdit(g)} className="flex items-center justify-center py-2 bg-slate-800 rounded-lg text-gray-300 hover:text-yellow-400 border border-gray-700">
                                      <Pencil size={18} />
                                  </button>
                                  <button onClick={() => setSelectedUser(g)} className="flex items-center justify-center py-2 bg-slate-800 rounded-lg text-gray-300 hover:text-red-400 border border-gray-700">
                                      <Trash size={18} />
                                  </button>
                              </>
                          )}
                      </div>
                  </div>
              )) : (
                  <div className="text-center py-10 text-gray-500">No guards found.</div>
              )}
          </div>

          <TablePagination
            page={currentPage}
            limit={PAGE_SIZE}
            totalItems={totalItems}
            currentCount={guards.length}
            totalPages={totalPages}
            label="guards"
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* View Guard Modal */}
      <Transition appear show={isViewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsViewOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#0f172a] text-white shadow-2xl shadow-black/50">
                  <div className="sticky top-0 z-10 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(15,23,42,0.98))] px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10 bg-white/5">
                        <Shield className="text-blue-400" size={28} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Guard Profile</div>
                        <Dialog.Title className="mt-1 text-xl font-semibold text-white">Complete Guard Details</Dialog.Title>
                        <p className="mt-1 text-sm text-slate-400">Review the guard’s profile, contact details, and identification fields.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsViewOpen(false)}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Profile Snapshot</div>
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-[#0b1220] text-blue-400">
                              <Shield size={26} />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-base font-semibold text-white">{getPersonName(selectedGuard)}</div>
                              <div className="mt-1 text-sm text-slate-400">{selectedGuard?.position || "No position"}</div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3">
                              <span className="text-slate-500">Guard ID</span>
                              <span className="truncate text-right font-medium text-white">{selectedGuard?.guardId || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3">
                              <span className="text-slate-500">Status</span>
                              <span className="truncate text-right text-slate-300">{selectedGuard?.status || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3">
                              <span className="text-slate-500">Sex</span>
                              <span className="truncate text-right text-slate-300">{selectedGuard?.sex || "—"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Notes</div>
                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            This panel is read-only. Use edit mode to update profile, IDs, and contact details.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="grid gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 md:grid-cols-2">
                          <ProfileItem label="First Name" value={selectedGuard?.firstName} />
                          <ProfileItem label="Last Name" value={selectedGuard?.lastName} />
                          <ProfileItem label="Email" value={selectedGuard?.email} />
                          <ProfileItem label="Phone Number" value={selectedGuard?.phoneNumber} />
                          <ProfileItem label="Position" value={selectedGuard?.position} />
                          <ProfileItem label="Address" value={selectedGuard?.address} />
                        </div>

                        <div className="grid gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 md:grid-cols-2">
                          <ProfileItem label="SSS ID" value={selectedGuard?.SSSID} />
                          <ProfileItem label="PhilHealth ID" value={selectedGuard?.PhilHealthID} />
                          <ProfileItem label="Pag-IBIG ID" value={selectedGuard?.PagibigID} />
                          <ProfileItem label="Emergency Contact Person" value={selectedGuard?.EmergencyPerson} />
                          <ProfileItem label="Emergency Contact" value={selectedGuard?.EmergencyContact} />
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => setIsViewOpen(false)}
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-600 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-500"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Guard Modal - FIX: Now uses clean form state */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/50" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#0f172a] text-white shadow-2xl shadow-black/50">
                  <div className="sticky top-0 z-10 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(15,23,42,0.98))] px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10 bg-white/5">
                        <Shield className="text-blue-400 w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Add Guard</div>
                        <Dialog.Title className="mt-1 text-xl sm:text-2xl font-semibold text-white">Create Guard Profile</Dialog.Title>
                        <p className="mt-1 text-sm text-slate-400">Fill in the personnel record, then save the account.</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-6">
                  {errorMsg && (<div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">{errorMsg}</div>)}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div><label className="text-gray-300 text-sm mb-1 block">First Name <span className="text-red-400">*</span></label><input type="text" name="firstName" required placeholder="e.g. Juan" value={form.firstName} onChange={handleChange} className={getFieldClass("firstName")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Last Name <span className="text-red-400">*</span></label><input type="text" name="lastName" required placeholder="e.g. Dela Cruz" value={form.lastName} onChange={handleChange} className={getFieldClass("lastName")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Sex <span className="text-red-400">*</span></label><select name="sex" required value={form.sex} onChange={handleChange} className={getFieldClass("sex")}><option value="Male">Male</option><option value="Female">Female</option></select></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Guard ID <span className="text-red-400">*</span></label><input type="text" name="guardId" required placeholder="e.g. G-2025-001" value={form.guardId} onChange={handleChange} className={getFieldClass("guardId")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Email <span className="text-red-400">*</span></label><input type="email" name="email" required placeholder="jpm@example.com" value={form.email} onChange={handleChange} className={getFieldClass("email")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Position <span className="text-red-400">*</span></label><input type="text" name="position" required placeholder="e.g. Security Guard" value={form.position} onChange={handleChange} className={getFieldClass("position")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Home Address <span className="text-red-400">*</span></label><input type="text" name="address" required placeholder="e.g. Brgy. 1, Tanza, Cavite" value={form.address} onChange={handleChange} className={getFieldClass("address")} /></div>
                      {/* FIX: Status Dropdown was missing value from state */}
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Status</label>
                        <select name="status" value={form.status} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500">
                          <option value="Active">Active</option>
                          <option value="Leave">Leave</option>
                          <option value="Retired">Retired</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Phone Number <span className="text-red-400">*</span></label>
                        <div className={getPhoneWrapperClass("phoneNumber")}>
                          <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none text-sm sm:text-base">+63</span>
                          {/* FIX: Phone handler uses setForm with callback to ensure latest state */}
                          <input type="tel" name="phoneNumber" required placeholder="9123456789" value={form.phoneNumber.replace(/^\+63/, "")} onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 10) value = value.slice(0, 10);
                            setFieldValue("phoneNumber", "+63" + value);
                          }} className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-600 focus:outline-none text-sm sm:text-base" />
                        </div>
                      </div>
                       <div><label className="text-gray-300 text-sm mb-1 block">SSS ID</label><span className="text-xs text-gray-500 italic float-right">(Optional)</span><input type="text" inputMode="numeric" pattern="[0-9]*" name="SSSID" placeholder="Enter SSS ID" value={form.SSSID} onChange={handleNumericChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600" /></div>
                       <div><label className="text-gray-300 text-sm mb-1 block">PhilHealth ID</label><span className="text-xs text-gray-500 italic float-right">(Optional)</span><input type="text" inputMode="numeric" pattern="[0-9]*" name="PhilHealthID" placeholder="Enter PhilHealth ID" value={form.PhilHealthID} onChange={handleNumericChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600" /></div>
                       <div><label className="text-gray-300 text-sm mb-1 block">Pag-IBIG ID</label><span className="text-xs text-gray-500 italic float-right">(Optional)</span><input type="text" inputMode="numeric" pattern="[0-9]*" name="PagibigID" placeholder="Enter Pag-IBIG ID" value={form.PagibigID} onChange={handleNumericChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600" /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Emergency Contact Person <span className="text-red-400">*</span></label><input type="text" name="EmergencyPerson" required placeholder="e.g. Maria Dela Cruz" value={form.EmergencyPerson} onChange={handleChange} className={getFieldClass("EmergencyPerson")} /></div>
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Number <span className="text-red-400">*</span></label>
                        <div className={getPhoneWrapperClass("EmergencyContact")}>
                          <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none text-sm sm:text-base">+63</span>
                          <input type="tel" name="EmergencyContact" required placeholder="9123456789" value={form.EmergencyContact.replace(/^\+63/, "")} onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 10) value = value.slice(0, 10);
                            setFieldValue("EmergencyContact", "+63" + value);
                          }} className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-600 focus:outline-none text-sm sm:text-base" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                    <button onClick={() => setIsOpen(false)} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gray-600 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-500 sm:w-auto">Cancel</button>
                    <button onClick={handleAddGuard} disabled={loading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 sm:w-auto">
                      {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></> : "Save Guard"}
                    </button>
                  </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Guard Modal */}
      <Transition appear show={editIsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setEditIsOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/50" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#0f172a] text-white shadow-2xl shadow-black/50">
                  <div className="sticky top-0 z-10 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(15,23,42,0.98))] px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10 bg-white/5">
                        <Pencil className="text-amber-400 w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Edit Guard</div>
                        <Dialog.Title className="mt-1 text-xl sm:text-2xl font-semibold text-white">Update Guard Profile</Dialog.Title>
                        <p className="mt-1 text-sm text-slate-400">Edit the guard’s information below.</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setEditIsOpen(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-6">
                  {errorMsg && (<div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">{errorMsg}</div>)}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div><label className="text-gray-300 text-sm mb-1 block">First Name <span className="text-red-400">*</span></label><input type="text" name="firstName" value={form.firstName} onChange={handleChange} className={getFieldClass("firstName")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Last Name <span className="text-red-400">*</span></label><input type="text" name="lastName" value={form.lastName} onChange={handleChange} className={getFieldClass("lastName")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Sex <span className="text-red-400">*</span></label><select name="sex" value={form.sex} onChange={handleChange} className={getFieldClass("sex")}><option value="Male">Male</option><option value="Female">Female</option></select></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Guard ID <span className="text-red-400">*</span></label><input type="text" name="guardId" value={form.guardId} onChange={handleChange} className={getFieldClass("guardId")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Email <span className="text-red-400">*</span></label><input type="email" name="email" value={form.email} onChange={handleChange} className={getFieldClass("email")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Position <span className="text-red-400">*</span></label><input type="text" name="position" value={form.position} onChange={handleChange} className={getFieldClass("position")} /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Home Address <span className="text-red-400">*</span></label><input type="text" name="address" value={form.address} onChange={handleChange} className={getFieldClass("address")} /></div>
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Status</label>
                        <select name="status" value={form.status} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500">
                          <option value="Active">Active</option>
                          <option value="Leave">Leave</option>
                          <option value="Retired">Retired</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Phone Number <span className="text-red-400">*</span></label>
                        <div className={getPhoneWrapperClass("phoneNumber")}>
                          <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none">+63</span>
                          {/* FIX: Phone handler uses setForm with callback to ensure latest state */}
                          <input type="tel" name="phoneNumber" value={form.phoneNumber.replace(/^\+63/, "")} onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 10) value = value.slice(0, 10);
                            setFieldValue("phoneNumber", "+63" + value);
                          }} className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none" />
                        </div>
                      </div>
                      <div><label className="text-gray-300 text-sm mb-1 block">SSS ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" name="SSSID" value={form.SSSID} onChange={handleNumericChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">PhilHealth ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" name="PhilHealthID" value={form.PhilHealthID} onChange={handleNumericChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Pag-IBIG ID</label><input type="text" inputMode="numeric" pattern="[0-9]*" name="PagibigID" value={form.PagibigID} onChange={handleNumericChange} className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="text-gray-300 text-sm mb-1 block">Emergency Contact Person <span className="text-red-400">*</span></label><input type="text" name="EmergencyPerson" value={form.EmergencyPerson} onChange={handleChange} className={getFieldClass("EmergencyPerson")} /></div>
                      <div>
                        <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Number <span className="text-red-400">*</span></label>
                        <div className={getPhoneWrapperClass("EmergencyContact")}>
                          <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none">+63</span>
                          {/* FIX: Phone handler uses setForm with callback to ensure latest state */}
                          <input type="tel" name="EmergencyContact" value={form.EmergencyContact.replace(/^\+63/, "")} onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 10) value = value.slice(0, 10);
                            setFieldValue("EmergencyContact", "+63" + value);
                          }} className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                    <button onClick={() => setEditIsOpen(false)} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gray-600 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-500 sm:w-auto">Cancel</button>
                    <button onClick={handleSaveEdit} disabled={loading} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 sm:w-auto">{loading ? "Updating..." : "Save Changes"}</button>
                  </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ToastContainer />
      {selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onConfirm={handleDelete}
          onCancel={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
