import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  UserPlus,
  Search,
  Trash2,
  Edit3,
  Users,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Phone,
  Mail,
  Briefcase,
  X,
  Lock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

const api = import.meta.env.VITE_API_URL;

// --- Sub-Components ---

const AddUserModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    accessLevel: "",
    position: "",
    contactNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    setForm({ name: "", email: "", password: "", role: "", accessLevel: "", position: "", contactNumber: "" });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-[#1e293b] rounded-2xl border border-gray-700 shadow-2xl p-6 text-white">
            <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                    <UserPlus className="text-blue-500" size={24} /> Add New Staff
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Juan Dela Cruz" className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@example.com" className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Position</label>
                    <input name="position" value={form.position} onChange={handleChange} placeholder="e.g. HR Manager" className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Contact Number</label>
                    <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="09xxxxxxxxx" className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                    <select name="role" value={form.role} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required>
                        <option value="">Select Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Subadmin">Subadmin</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Access Level</label>
                    <select name="accessLevel" value={form.accessLevel} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required>
                        <option value="">Select Level</option>
                        <option value="1">Level 1 (Full Access)</option>
                        <option value="2">Level 2 (Limited)</option>
                    </select>
                </div>
                <div className="md:col-span-2 relative">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 outline-none" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition shadow-lg shadow-blue-900/20">Create Account</button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

const EditUserModal = ({ isOpen, onClose, onUpdate, user }) => {
  const [form, setForm] = useState(user || {});

  useEffect(() => { setForm(user || {}); }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg bg-[#1e293b] rounded-2xl border border-gray-700 shadow-2xl p-6 text-white">
            <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                    <Edit3 className="text-yellow-500" size={24} /> Edit Staff Details
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); onUpdate(form); }} className="space-y-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                        <input name="name" value={form.name || ""} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                        <input name="email" value={form.email || ""} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Position</label>
                            <input name="position" value={form.position || ""} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Contact</label>
                            <input name="contactNumber" value={form.contactNumber || ""} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                            <select name="role" value={form.role || ""} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none">
                                <option value="Admin">Admin</option>
                                <option value="Subadmin">Subadmin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Access Level</label>
                            <select name="accessLevel" value={form.accessLevel || ""} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-yellow-500 outline-none">
                                <option value="1">Level 1</option>
                                <option value="2">Level 2</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition shadow-lg shadow-yellow-900/20">Save Changes</button>
                </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

const DeleteUserModal = ({ user, onConfirm, onCancel }) => (
    <Transition appear show={!!user} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onCancel}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-sm bg-[#1e293b] rounded-2xl border border-gray-700 shadow-2xl p-6 text-center text-white">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="text-red-500" size={24} />
                    </div>
                    <Dialog.Title className="text-lg font-bold mb-2">Delete Account?</Dialog.Title>
                    <p className="text-gray-400 text-sm mb-6">
                        Are you sure you want to delete <span className="text-white font-semibold">{user?.name}</span>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition">Cancel</button>
                        <button onClick={() => onConfirm(user._id)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl transition shadow-lg shadow-red-900/20">Delete</button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    </Transition>
);

const UserCard = ({ user, onEdit, onDelete, isAdmin }) => (
    <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm hover:border-blue-500/50 transition duration-300">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-lg border border-slate-600">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <p className="text-xs text-blue-400">{user.role} • Lvl {user.accessLevel}</p>
                </div>
            </div>
            {isAdmin && (
                <div className="flex gap-1">
                    <button onClick={() => onEdit(user)} className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition"><Edit3 size={16}/></button>
                    <button onClick={() => onDelete(user)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"><Trash2 size={16}/></button>
                </div>
            )}
        </div>
        <div className="space-y-2 text-sm border-t border-gray-700 pt-3">
            <div className="flex items-center gap-2 text-gray-400">
                <Briefcase size={14} className="text-slate-500"/>
                <span className="text-gray-300">{user.position || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
                <Mail size={14} className="text-slate-500"/>
                <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
                <Phone size={14} className="text-slate-500"/>
                <span>{user.contactNumber || "N/A"}</span>
            </div>
        </div>
    </div>
);

// --- Main Page Component ---

export default function UserAccounts() {
  const { user: admin, loading } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  useEffect(() => {
    if (!admin && !loading) navigate("/admin/login");
    document.title = "Users List | JPM Security Agency";
    fetchUsers();
  }, [admin, loading, navigate]);

  const fetchUsers = async () => {
    setLoadingPage(true);
    try {
      const res = await fetch(`${api}/api/auth/users`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleAddUser = async (formData) => {
    try {
      const res = await fetch(`${api}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      
      await fetchUsers();
      setIsAddOpen(false);
      toast.success("Staff Created Successfully", { theme: "dark", transition: Bounce });
    } catch (err) {
      toast.error(err.message, { theme: "dark", transition: Bounce });
    }
  };

  const handleUpdateUser = async (formData) => {
    try {
      const res = await fetch(`${api}/api/auth/update-user/${formData._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed update");
      
      await fetchUsers();
      setIsEditOpen(false);
      toast.success("Staff Updated Successfully", { theme: "dark", transition: Bounce });
    } catch (err) {
      toast.error(err.message, { theme: "dark", transition: Bounce });
    }
  };

  const handleDeleteUser = async (id) => {
    const target = users.find((u) => u._id === id);

    // Prevent deleting the last Admin
    if (target?.role === "Admin" && users.filter((u) => u.role === "Admin").length <= 1) {
      toast.error("Cannot delete the last Admin!", { theme: "dark", transition: Bounce });
      setUserToDelete(null);
      return;
    }

    // Prevent deleting the last Subadmin (New Logic)
    if (target?.role === "Subadmin" && users.filter((u) => u.role === "Subadmin").length <= 1) {
        toast.error("Cannot delete the last Subadmin!", { theme: "dark", transition: Bounce });
        setUserToDelete(null);
        return;
    }
    
    try {
      const res = await fetch(`${api}/api/auth/delete-user/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed delete");
      
      await fetchUsers();
      setUserToDelete(null);
      toast.success("Staff Deleted Successfully", { theme: "dark", transition: Bounce });
    } catch (err) {
      toast.error("Error deleting staff", { theme: "dark", transition: Bounce });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.position?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const canEdit = admin?.role === "Admin" && admin.accessLevel === 1;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 md:p-8 font-sans">
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <Users className="text-blue-500" size={28} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Staff Management</h1>
                <p className="text-slate-400 text-sm mt-1">Manage admin and sub-admin accounts.</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search staff..."
                    className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
            </div>

            {/* Filter */}
            <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 text-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Subadmin">Subadmin</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={fetchUsers}
                    className="px-3 py-2 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition flex items-center justify-center"
                    title="Refresh List"
                >
                    <RefreshCw size={20} />
                </button>
                {canEdit && (
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shadow-lg shadow-blue-900/20"
                    >
                        <UserPlus size={18} /> Add Staff
                    </button>
                )}
            </div>
        </div>
      </header>

      {/* Content */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-1 shadow-xl min-h-[600px]">
        {loadingPage ? (
             <div className="flex flex-col items-center justify-center h-[600px] text-blue-400 animate-pulse">
                <Users size={48} className="mb-4 opacity-50" />
                <p>Loading staff...</p>
             </div>
        ) : filteredUsers.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
                <Users size={48} className="mb-4 opacity-20" />
                <p>No users found matching criteria.</p>
             </div>
        ) : (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden bg-[#1e293b] rounded-xl border border-gray-700">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0f172a] text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User Profile</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Position</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                {canEdit && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredUsers.map((u) => (
                                <tr key={u._id} className="group hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs border border-slate-600">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{u.name}</div>
                                                <div className="text-xs text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            u.role === 'Admin' 
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                            {u.role === 'Admin' ? <Shield size={10}/> : <Users size={10}/>}
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {u.position || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                                        {u.contactNumber || "N/A"}
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setUserToEdit(u); setIsEditOpen(true); }} 
                                                    className="p-2 hover:bg-yellow-500/10 text-gray-400 hover:text-yellow-400 rounded-lg transition"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => setUserToDelete(u)} 
                                                    className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden grid gap-4 p-4">
                    {filteredUsers.map((u) => (
                        <UserCard 
                            key={u._id} 
                            user={u} 
                            isAdmin={canEdit}
                            onEdit={(user) => { setUserToEdit(user); setIsEditOpen(true); }}
                            onDelete={(user) => setUserToDelete(user)}
                        />
                    ))}
                </div>
            </>
        )}
      </div>

      <AddUserModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={handleAddUser} />
      <EditUserModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onUpdate={handleUpdateUser} user={userToEdit} />
      <DeleteUserModal user={userToDelete} onCancel={() => setUserToDelete(null)} onConfirm={handleDeleteUser} />
    </div>
  );
}