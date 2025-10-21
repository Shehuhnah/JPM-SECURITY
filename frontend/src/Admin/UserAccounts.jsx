import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { UserPlus, Search, ShieldAlert, Trash2, Edit3, Users, User, RefreshCw   } from "lucide-react";
import Loader from "../components/Loading.jsx";
import DeleteUserModal from "../components/DeleteUserModal";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function UserAccounts() {
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // For modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: "",
    name: "",
    email: "",
    role: "",
    accessLevel: "",
    position: "",
    contactNumber: "",
  });


  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    accessLevel: "",
    position: "",
    contactNumber: "",
  });


  //  Fetch users
  useEffect(() => {
    document.title = "Users List | JPM Security Agency";
    fetch("http://localhost:5000/api/auth/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Fetch users error:", err));
      setLoading(false);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add new user
  const handleAddUser = async () => {
    setErrorMsg("");

    if (!form.name || !form.email || !form.password || !form.role || !form.accessLevel) {
      setErrorMsg("⚠️ Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save user");

      const newUser = await res.json();

      // ✅ Replace current users state with the newly added one
      // setUsers([newUser]);
      handleRefresh();

      setForm({
        name: "",
        email: "",
        password: "",
        role: "",
        accessLevel: "",
        position: "",
        contactNumber: "",
      });

      setIsOpen(false);

      toast.success("Staff Created Successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    } catch (err) {
      console.error("Add user error:", err);
      setErrorMsg("❌ Failed to save user. Check backend connection.");
    }
  };

  const handleEditClick = (user) => {
    setEditForm(user);
    setIsEditOpen(true);

  };

  const handleUpdateUser = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/update-user/${editForm._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update user");

      handleRefresh(); 
      setIsEditOpen(false);

      toast.success("Staff Updated Successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });

    } catch (err) {
      console.error("Update Staff error:", err);
      toast.error("Update Staff Error: ", err, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/delete-user/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((u) => u._id !== id));
      setSelectedUser(null); // close modal after delete
      console.log("✅ User deleted successfully");
    } catch (err) {
      console.error("❌ Delete user error:", err);
      alert("Failed to delete user");
    }
  };

  // ✅ Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "All" || (u.role && u.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Loading users..." />;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex flex-row justify-between mb-4 py-2">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-500" />
            <p>Staff Management</p>
          </h2>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row justify-end mb-6 gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition"
              title="Refresh List"
            >
              <RefreshCw className="size-4" />
            </button>
            <div className="flex gap-3">
              <select
                className="bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Sub-admin">Sub-admin</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="relative w-full sm:w-64 flex items-center gap-2">
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5"
            >
              <UserPlus size={18} />
              Add Staff
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto bg-[#1e293b]/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
          <table className="w-full text-left">
            <thead className="bg-[#234C6A] text-white">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold">Name</th>
                <th className="py-3 px-4 text-sm font-semibold">Position</th>
                <th className="py-3 px-4 text-sm font-semibold">Phone</th>
                <th className="py-3 px-4 text-sm font-semibold">Email</th>
                <th className="py-3 px-4 text-sm font-semibold">Role</th>
                <th className="py-3 px-4 text-sm font-semibold text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-6 text-gray-400 italic"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-gray-700 hover:bg-[#2a3a4f]/40 transition"
                  >
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.position || "N/A"}</td>
                    <td className="px-4 py-3">{u.contactNumber}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.role || "N/A"}</td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
                      >
                        <Edit3 size={14} /> Edit
                      </button>

                      <button
                        onClick={() => setSelectedUser(u)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      {/* Add Admin/Subadmin Modal */}
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
                    <ShieldAlert className="text-blue-400" />
                    Add New Admin / Subadmin
                  </Dialog.Title>

                  {errorMsg && (
                    <div className="bg-red-600/20 border border-red-500 text-red-400 text-sm rounded-md px-4 py-2 mb-4">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={handleChange}
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={handleChange}
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="position"
                      placeholder="Position (optional)"
                      value={form.position}
                      onChange={handleChange}
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="contactNumber"
                      placeholder="Contact Number"
                      value={form.contactNumber}
                      onChange={handleChange}
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Role</option>
                      <option value="Admin">Admin</option>
                      <option value="Subadmin">Subadmin</option>
                    </select>
                    <select
                      name="accessLevel"
                      value={form.accessLevel}
                      onChange={handleChange}
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Access Level</option>
                      <option value="2">Admin (1)</option>
                      <option value="1">Subadmin (2)</option>
                    </select>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddUser}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-6 py-2 rounded-lg shadow text-white font-medium"
                    >
                      Save User
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Staff Modal */}
      <Transition appear show={isEditOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditOpen(false)}>
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
                    <Edit3 className="text-blue-400" />
                    Update Staff Information
                  </Dialog.Title>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="position"
                      placeholder="Position"
                      value={editForm.position}
                      onChange={(e) =>
                        setEditForm({ ...editForm, position: e.target.value })
                      }
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="contactNumber"
                      placeholder="Contact Number"
                      value={editForm.contactNumber}
                      onChange={(e) =>
                        setEditForm({ ...editForm, contactNumber: e.target.value })
                      }
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="role"
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value })
                      }
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Subadmin">Subadmin</option>
                    </select>
                    <select
                      name="accessLevel"
                      value={editForm.accessLevel}
                      onChange={(e) =>
                        setEditForm({ ...editForm, accessLevel: e.target.value })
                      }
                      className="bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2">Admin (1)</option>
                      <option value="1">Subadmin (2)</option>
                    </select>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditOpen(false)}
                      className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateUser}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-6 py-2 rounded-lg shadow text-white font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ToastContainer />

        {/* Delete Modal */}
        {selectedUser && (
          <DeleteUserModal
            user={selectedUser}
            onConfirm={handleDelete}
            onCancel={() => setSelectedUser(null)}
          />
        )}
      </main>
    </div>
  );
}
