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
  Trash  
} from "lucide-react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../components/Loading.jsx";
import DeleteUserModal from "../components/DeleteUserModal";
import { useAuth } from "../hooks/useAuth.js"
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
const api = import.meta.env.VITE_API_URL;

export default function GuardTable() {
  const { user: admin, loading } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false); 
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editIsOpen, setEditIsOpen] = useState(false); 
  const [guards, setGuards] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState(null)
  
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    guardId: "",
    address: "",
    position: "",
    phoneNumber: "",
    SSSID: "",
    PhilHealthID: "",
    PagibigID: "",
    EmergencyPerson: "",
    EmergencyContact: ""
  });

  const generateGuardPassword = () => {
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const randomNumber = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `JPM${randomLetter}${randomNumber}`;
  };

  //  Fetch users
  useEffect(() => {
    document.title = "Guards Profile | JPM Security Agency";
    if (!admin && !loading) {
      navigate("/admin/login");
      return;
    }
    const fetchGuards = async () => {
      try {
        const res = await fetch(`${api}/api/guards`, {
         credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch guards");

        const data = await res.json();
        setGuards(data);
      } catch (err) {
        console.error("Fetch guards error:", err);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchGuards();
  }, [admin, loading, navigate]);

  // Refresh users
  const handleRefresh = async () => {
    try {
      setLoadingPage(true);
      const res = await fetch(`${api}/api/guards`, {
         credentials: "include",
        });
      const data = await res.json();
      setGuards(data);
      setForm(
        {
          fullName: "",
          email: "",
          guardId: "",
          password: "",
          address: "",
          position: "",
          dutyStation: "",
          shift: "",
          phoneNumber: "",
          SSSID: "",
          PhilHealthID: "",
          PagibigID: "",
          EmergencyPerson: "",
          EmergencyContact: ""
        }
      )
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
  };

  // submit new guard
  const handleAddGuard = async () => {
    setErrorMsg("");

    if (!form.fullName || !form.email || !form.guardId ||!form.address  || !form.position || !form.phoneNumber || !form.SSSID || !form.PhilHealthID || !form.PagibigID || !form.EmergencyPerson || !form.EmergencyContact) {
      setErrorMsg("⚠️ Please fill in all required fields.");
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

      setForm({
          fullName: "",
          email: "",
          guardId: "",
          address: "",
          position: "",
          phoneNumber: "",
          SSSID: "",
          PhilHealthID: "",
          PagibigID: "",
          EmergencyPerson: "",
          EmergencyContact: ""
      });

      toast.success("Guard added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        pauseOnHover: true,
        theme: "dark",
        transition: Bounce,
      });
      handleRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("❌ Failed to connect to server.");
    } finally {
      setLoadingPage(false);
    }
  };

  const openAddGuardModal = () => {
    setForm((prev) => ({
      ...prev,
      password: generateGuardPassword(),
    }));
    setIsOpen(true);
  };

  // delete guard
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${api}/api/guards/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete Guard");

      setGuards((prev) => prev.filter((u) => u._id !== id));
      setSelectedUser(null);
      handleRefresh();
      console.log("✅ Guard deleted successfully");
    } catch (err) {
      console.error("❌ Delete Guard error:", err);
      alert("Failed to delete Guard");
    }
  };

  // edit guard
  const handleEdit = (guard) => {
    setForm(guard);
    setEditIsOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
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
        toast.info("⚠️ No changes detected.", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
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
      setErrorMsg("")
      handleRefresh();
      toast.success("✅ Guard updated successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (err) {
      console.error("Update guard error:", err);
      toast.error("❌ Failed to update guard.", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
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

  // filter logic
  const filteredData = guards.filter(
    (g) =>
      (filter === "All" || g.position === filter) &&
      (g.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        g.email?.toLowerCase().includes(search.toLowerCase()) ||
        g.guardId?.toLowerCase().includes(search.toLowerCase()) ||
        g.SSSID?.toLowerCase().includes(search.toLowerCase()) ||
        g.PhilHealthID?.toLowerCase().includes(search.toLowerCase()) ||
        g.PagibigID?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Loader text="Loading, Please wait a minute..." />;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="py-3">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <Shield className="text-blue-500" size={32}/> Guards Profile
            </h2>
          </div>

          {/* Filter + Search + Button */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="px-4 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition"
              title="Refresh List"
            >
              <RefreshCw className="size-4" />
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-700 px-3 py-2 rounded-md bg-[#1e293b] text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Positions</option>
              <option value="Security Guard">Security Guard</option>
              <option value="Officer in Charge">Officer in Charge</option>
              <option value="Inspector">Inspector</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guard..."
                className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-md bg-[#1e293b] border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {admin.role === "Admin" && admin.accessLevel === 1 && (
              <button
                onClick={openAddGuardModal}
                className="mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5"
              >
                <UserPlus size={18} />
                Add Guard
              </button>
            )}
          </div>
        </header>

        {/* Table */}
        <div className="overflow-x-auto bg-[#1e293b]/70 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-[#10263a] text-gray-100 uppercase tracking-wide text-xs md:text-sm">
              <tr className="text-center">
                <th className="p-3">Guard ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Position</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                {admin.role === "Admin" && admin.accessLevel === 1 && (
                  <th className="p-3">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((g, i) => (
                  <tr key={i} className="border-t border-gray-700 hover:bg-blue-900/20 transition text-center">
                    <td className="p-3">{g.guardId}</td>
                    <td className="p-3 font-medium flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      {g.fullName}
                    </td>
                    <td className="p-3">{g.position}</td>
                    <td className="p-3">{g.phoneNumber}</td>
                    <td className="p-3 text-gray-300">{g.email}</td>
                    <td className="p-3 flex items-center">{g.status}</td>
                      <td className="p-4 space-x-5">
                         <button 
                          onClick={() => handleView(g)} 
                          title="See Full Profile">
                          <Eye className="w-5 h-5 text-gray-300 hover:text-blue-400" />
                        </button>
                        {admin.role === "Admin" && admin.accessLevel === 1 && (
                          <>
                            <button 
                              onClick={() => handleEdit(g)} 
                              title="Edit Guard Profile">
                              <Pencil className="w-5 h-5 text-gray-300 hover:text-blue-400" />
                            </button>
                            <button
                              onClick={() => setSelectedUser(g)}
                              title="Delete Profile Guard"
                            >
                              <Trash className="w-5 h-5 text-gray-300 hover:text-red-500 ml-3" />
                            </button>
                          </>
                        )}
                      </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500 italic">
                    No guards found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* View Guard Modal */}
        <Transition appear show={isViewOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setIsViewOpen(false)}
          >
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
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl border border-gray-700">

                    {/* HEADER */}
                    <div className="flex gap-x-4 mb-6">
                      {/* Avatar Placeholder */}
                      <div className="w-20 h-20 bg-[#0f172a] rounded-full flex items-center justify-center border-2 border-gray-600">
                        <Shield className="text-blue-400 w-8 h-8" />
                      </div>

                      <div className="mt-2">
                        <Dialog.Title className="text-2xl font-bold text-white">
                          Guard Profile
                        </Dialog.Title>
                        <p className="text-gray-400 text-sm">
                          Complete information of the selected guard.
                        </p>
                      </div>
                    </div>

                    {/* PROFILE GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* LEFT SIDE */}
                      <div className="space-y-3 text-gray-200">
                        <ProfileItem label="Full Name" value={selectedGuard?.fullName} />
                        <ProfileItem label="Guard ID" value={selectedGuard?.guardId} />
                        <ProfileItem label="Email" value={selectedGuard?.email} />
                        <ProfileItem label="Phone Number" value={selectedGuard?.phoneNumber} />
                        <ProfileItem label="Position" value={selectedGuard?.position} />
                        <ProfileItem label="Address" value={selectedGuard?.address} />
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="space-y-3 text-gray-200">
                        <ProfileItem label="SSS ID" value={selectedGuard?.SSSID} />
                        <ProfileItem label="PhilHealth ID" value={selectedGuard?.PhilHealthID} />
                        <ProfileItem label="Pag-IBIG ID" value={selectedGuard?.PagibigID} />
                        <ProfileItem label="Emergency Contact Person" value={selectedGuard?.EmergencyPerson} />
                        <ProfileItem label="Emergency Contact" value={selectedGuard?.EmergencyContact} />
                        <ProfileItem label="Status" value={selectedGuard?.status} />
                      </div>
                    </div>

                    {/* EXTRA META */}
                    <div className="mt-8 text-gray-400 text-sm space-y-1">
                      <p>Created At: {new Date(selectedGuard?.createdAt).toLocaleString()}</p>
                      <p>Last Login: {new Date(selectedGuard?.lastLogin).toLocaleString()}</p>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => setIsViewOpen(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-white w-1/4"
                      >
                        Close
                      </button>
                    </div>

                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Add Guard Modal */}
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
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
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl border border-gray-700">
                    
                    {/* Header */}
                    <div className="flex gap-x-3">
                      <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-[#0f172a] rounded-full flex items-center justify-center border-2 border-gray-600">
                          <Shield className="text-blue-400 w-8 h-8" />
                        </div>
                      </div>

                      <div className="mt-3">
                        <Dialog.Title className="text-2xl font-bold text-white">
                          Add New Guard
                        </Dialog.Title>
                        <p className="text-gray-400 text-sm mb-6">
                          Fill out the guard’s information below.
                        </p>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-600/20 border border-red-500 text-red-400 text-sm rounded-md px-4 py-2 mb-6 text-center">
                        {errorMsg}
                      </div>
                    )}

                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Full Name</label>
                          <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Guard ID</label>
                          <input
                            type="text"
                            name="guardId"
                            value={form.guardId}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Password</label>
                          <div className="relative w-full">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={form.password}
                              onChange={handleChange}
                              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Position</label>
                          <input
                            type="text"
                            name="position"
                            value={form.position}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Phone Number</label>
                          <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none">+63</span>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={form.phoneNumber.replace(/^\+63/, "")}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length > 10) value = value.slice(0, 10);
                                setForm({ ...form, phoneNumber: "+63" + value });
                              }}
                              className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">SSS ID</label>
                          <input
                            type="text"
                            name="SSSID"
                            value={form.SSSID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">PhilHealth ID</label>
                          <input
                            type="text"
                            name="PhilHealthID"
                            value={form.PhilHealthID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Pag-IBIG ID</label>
                          <input
                            type="text"
                            name="PagibigID"
                            value={form.PagibigID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Person</label>
                          <input
                            type="text"
                            name="EmergencyPerson"
                            value={form.EmergencyPerson}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Number</label>
                          <input
                            type="tel"
                            name="EmergencyContact"
                            value={form.EmergencyContact}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-end gap-4">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-white w-1/4"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddGuard}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-8 py-2 rounded-lg shadow text-white font-medium w-1/4 disabled:opacity-50"
                      >
                        {loading ? "Saving..." : "Save Guard"}
                      </button>
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
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl border border-gray-700">
                    
                    {/* Header */}
                    <div className="flex gap-x-3 mb-4">
                      <Pencil className="text-blue-400 w-10 h-10" />
                      <div>
                        <Dialog.Title className="text-2xl font-bold text-white">Edit Guard</Dialog.Title>
                        <p className="text-gray-300 text-sm">Edit the guard’s information below.</p>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-600/20 border border-red-500 text-red-400 text-sm rounded-md px-4 py-2 mb-4">
                        {errorMsg}
                      </div>
                    )}

                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Left Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Full Name</label>
                          <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Guard ID</label>
                          <input
                            type="text"
                            name="guardId"
                            value={form.guardId}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Position</label>
                          <input
                            type="text"
                            name="position"
                            value={form.position}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Status</label>
                          <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Active">Active</option>
                            <option value="Leave">Leave</option>
                            <option value="Retired">Retired</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Phone Number</label>
                          <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none">+63</span>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={form.phoneNumber.replace(/^\+63/, "")}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length > 10) value = value.slice(0, 10);
                                setForm({ ...form, phoneNumber: "+63" + value });
                              }}
                              className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">SSS ID</label>
                          <input
                            type="text"
                            name="SSSID"
                            value={form.SSSID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">PhilHealth ID</label>
                          <input
                            type="text"
                            name="PhilHealthID"
                            value={form.PhilHealthID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Pag-IBIG ID</label>
                          <input
                            type="text"
                            name="PagibigID"
                            value={form.PagibigID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Person</label>
                          <input
                            type="text"
                            name="EmergencyPerson"
                            value={form.EmergencyPerson}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Number</label>
                          <input
                            type="tel"
                            name="EmergencyContact"
                            value={form.EmergencyContact}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex justify-end gap-4">
                      <button
                        onClick={() => setEditIsOpen(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-8 py-2 rounded-lg shadow text-white font-medium disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Save Changes"}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Toast Container */}
        <ToastContainer />

        {/* Delete Modal */}
        {selectedUser && (
          <DeleteUserModal
            user={selectedUser}
            onConfirm={handleDelete}
            onCancel={() => setSelectedUser(null)}
          />
        )}
      </div>
    </div>
  );
}
