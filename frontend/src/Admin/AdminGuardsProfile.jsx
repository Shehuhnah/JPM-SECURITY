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

export default function GuardTable() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false); // For Add Guard Modal
  const [editIsOpen, setEditIsOpen] = useState(false); // For Edit Guard Modal
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // For modal
  
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    guardId: "",
    password: "",
    address: "",
    dutyStation: "",
    shift: "",
    phoneNumber: "",
    position: "Security Guard",
  });

  //  Fetch users
  useEffect(() => {
    document.title = "Guards Profile | JPM Security Agency";

    const fetchGuards = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/guards");
        if (!res.ok) throw new Error("Failed to fetch guards");

        const data = await res.json();
        setGuards(data);
      } catch (err) {
        console.error("Fetch guards error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuards();
  }, []);

  // Refresh users
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/guards");
      const data = await res.json();
      setGuards(data);
      setForm(
        {
          FullName: "",
          email: "",
          guardId: "",
          password: "",
          address: "",
          dutyStation: "",
          shift: "",
          phoneNumber: "",
          position: "Security Guard",
        }
      )
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  // handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    console.log(form);
  };

  // submit new guard
  const handleAddGuard = async () => {
    setErrorMsg("");

    if (!form.fullName || !form.email || !form.password || !form.guardId || !form.dutyStation || !form.shift) {
      setErrorMsg("⚠️ Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/guards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        password: "",
        address: "",
        dutyStation: "",
        shift: "",
        phoneNumber: "",
        position: "Security Guard",
      });

      handleRefresh();
      toast.success("Guard added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        pauseOnHover: true,
        theme: "dark",
        transition: Bounce,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg("❌ Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // delete guard
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/guards/${id}`, {
        method: "DELETE",
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
    if (!form.fullName || !form.email || !form.dutyStation || !form.shift) {
      setErrorMsg("⚠️ Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/guards/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update guard");

      const updatedGuard = await res.json();
      setGuards((prev) =>
        prev.map((g) => (g._id === updatedGuard._id ? updatedGuard : g))
      );

      setEditIsOpen(false);
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
      setLoading(false);
    }
  };

  // filter logic
  const filteredData = guards.filter(
    (g) =>
      (filter === "All" || g.position === filter) &&
      (g.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        g.email?.toLowerCase().includes(search.toLowerCase()) ||
        g.guardId?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Loader text="Loading users..." />;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="py-3">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <Shield className="text-blue-500" /> Guards Profile
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

            <button
              onClick={() => setIsOpen(true)}
              className="mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5"
            >
              <UserPlus size={18} />
              Add Guard
            </button>
          </div>
        </header>

        {/* Table */}
        <div className="overflow-x-auto bg-[#1e293b]/70 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-[#10263a] text-gray-100 uppercase tracking-wide text-xs md:text-sm">
              <tr className="text-center">
                <th className="p-3">Full Name</th>
                <th className="p-3">Guard ID</th>
                <th className="p-3">Position</th>
                <th className="p-3">Duty Station</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Email</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((g, i) => (
                  <tr key={i} className="border-t border-gray-700 hover:bg-blue-900/20 transition text-center">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      {g.fullName}
                    </td>
                    <td className="p-3">{g.guardId}</td>
                    <td className="p-3 text-blue-400">{g.position}</td>
                    <td className="p-3">{g.dutyStation}</td>
                    <td className="p-3">{g.phoneNumber}</td>
                    <td className="p-3 text-gray-300">{g.email}</td>
                    <td className="p-3 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {g.shift}
                    </td>
                    <td className="p-3 space-x-5">
                      <button onClick={() => handleEdit(g)}>
                        <Pencil className="w-5 h-5 text-gray-300 hover:text-blue-400" />
                      </button>
                      <button
                        onClick={() => setSelectedUser(g)}
                      >
                        <Trash className="w-5 h-5 text-gray-300 hover:text-red-500 ml-3" />
                      </button>
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
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl border border-gray-700">
                    <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="text-blue-400" />
                      Add New Guard
                    </Dialog.Title>

                    {errorMsg && (
                      <div className="bg-red-600/20 border border-red-500 text-red-400 text-sm rounded-md px-4 py-2 mb-4">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={form.fullName}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="guardId"
                        placeholder="Guard ID"
                        value={form.guardId}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="dutyStation"
                        placeholder="Duty Station"
                        value={form.dutyStation}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={form.address}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="phoneNumber"
                        placeholder="Phone Number"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        name="shift"
                        value={form.shift}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Shift</option>
                        <option value="Day Shift">Day Shift</option>
                        <option value="Night Shift">Night Shift</option>
                      </select>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddGuard}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-6 py-2 rounded-lg shadow text-white font-medium disabled:opacity-50"
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
        {/* ✅ Edit Guard Modal */}
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
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl border border-gray-700">
                    <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Pencil className="text-blue-400" />
                      Edit Guard
                    </Dialog.Title>

                    {errorMsg && (
                      <div className="bg-red-600/20 border border-red-500 text-red-400 text-sm rounded-md px-4 py-2 mb-4">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="">
                        
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Full Name"
                          value={form.fullName}
                          onChange={handleChange}
                          className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        type="text"
                        name="guardId"
                        placeholder="Guard ID"
                        value={form.guardId}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="dutyStation"
                        placeholder="Duty Station"
                        value={form.dutyStation}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={form.address}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="phoneNumber"
                        placeholder="Phone Number"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        name="shift"
                        value={form.shift}
                        onChange={handleChange}
                        className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Shift</option>
                        <option value="Day Shift">Day Shift</option>
                        <option value="Night Shift">Night Shift</option>
                      </select>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setEditIsOpen(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-6 py-2 rounded-lg shadow text-white font-medium disabled:opacity-50"
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
