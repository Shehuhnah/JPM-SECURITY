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
import TablePagination from "../components/admin/TablePagination.jsx";

const api = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;

// --- Sub-Components ---

const AddUserModal = ({ isOpen, onClose, onSave }) => {
  const formatPHPhoneNumber = (value) => {
    if (!value) return "+63";

    let digits = value.replace(/\D/g, "");

    // Remove leading 63
    if (digits.startsWith("63")) {
        digits = digits.slice(2);
    }

    // Remove leading 0
    if (digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    // Limit to 10 digits
    digits = digits.slice(0, 10);

    return digits ? `+63${digits}` : "+63";
    };
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    accessLevel: "",
    sex: "",
    position: "",
    contactNumber: "+63",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Auto PH format
    if (name === "contactNumber") {
      value = formatPHPhoneNumber(value);
    }

    // Auto set Admin access
    if (name === "role") {
        setForm((prev) => ({
            ...prev,
            role: value,
            accessLevel: value === "Admin" ? "1" : "",
        }));
        return;
        }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  // Trim values
  const payload = {
    ...form,
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password.trim(),
    position: form.position.trim(),
    contactNumber: form.contactNumber.trim(),
    sex: form.sex.trim(),
  };

  // Validate all required fields
  if (
    !payload.name ||
    !payload.email ||
    !payload.password ||
    !payload.position ||
    !payload.sex ||
    !payload.role ||
    !payload.accessLevel
  ) {
    toast.error("Please fill in all required fields.", {
      theme: "dark",
      transition: Bounce,
    });
    return;
  }

  // Validate PH contact number
  const phoneRegex = /^\+639\d{9}$/;

  if (!phoneRegex.test(payload.contactNumber)) {
    toast.error("Please enter a valid contact number.", {
      theme: "dark",
      transition: Bounce,
    });
    return;
  }

  onSave(payload);

  setForm({
    name: "",
    email: "",
    password: "",
    role: "",
    accessLevel: "",
    sex: "",
    position: "",
    contactNumber: "+63",
  });
};

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

        <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
          <Dialog.Panel className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#0f172a] text-white shadow-2xl shadow-black/50">
            <div className="sticky top-0 z-10 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(15,23,42,0.98))] px-6 py-5 flex items-start justify-between gap-4">
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="text-blue-500" size={24} />
                Add New Staff
              </Dialog.Title>

              <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Account Preview</div>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3"><span className="text-slate-500">Name</span><span className="truncate text-right text-white font-medium">{form.name || "Required"}</span></div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3"><span className="text-slate-500">Role</span><span className="truncate text-right text-slate-300">{form.role || "Required"}</span></div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3"><span className="text-slate-500">Phone</span><span className="truncate text-right text-slate-300">{form.contactNumber || "Required"}</span></div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Helpful Notes</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Admin accounts receive elevated access automatically. Keep the email and phone number accurate for account recovery.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Full Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Email Address <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="juan@example.com"
                    className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Position <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="e.g. HR Manager"
                    className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Gender <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="sex"
                    value={form.sex}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Contact */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Contact Number <span className="text-red-500">*</span>
                  </label>

                  <input
                        name="contactNumber"
                        value={form.contactNumber}
                        onChange={handleChange}
                        placeholder="+639123456789"
                        inputMode="tel"
                        maxLength={13}
                        className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                        required
                    />
                </div>

                {/* Role */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Role <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Subadmin">Subadmin</option>
                  </select>
                </div>

                {/* Access Level */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Access Level <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="accessLevel"
                    value={form.accessLevel}
                    onChange={handleChange}
                    disabled={form.role === "Admin"}
                    className={`w-full rounded-xl px-4 py-3 text-sm text-white outline-none border transition focus:ring-2 focus:ring-blue-500/60 ${
                      form.role === "Admin"
                        ? "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-[#1e293b] border-gray-700"
                    }`}
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="1">
                      Admin (Full Access)
                    </option>
                    <option value="2">
                      Subadmin (Limited)
                    </option>
                  </select>
                </div>

                {/* Password */}
                <div className="md:col-span-2 relative">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Password <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-500/60"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                  <div className="rounded-xl border border-gray-700 bg-[#1e293b] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white"><UserPlus className="text-blue-400" size={16} /> Staff Account</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">This account can be used immediately after saving if the role and access level are valid.</p>
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-700 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">Cancel</button>
                    <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500">Create Account</button>
                  </div>
                </div>
              </div>
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

  const formatPHPhoneNumber = (value) => {
    if (!value) return "+63";

    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("63")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    digits = digits.slice(0, 10);

    return digits ? `+63${digits}` : "+63";
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "contactNumber") {
      value = formatPHPhoneNumber(value);
    }

    if (name === "role") {
      setForm((prev) => ({
        ...prev,
        role: value,
        accessLevel: value === "Admin" ? "1" : prev.accessLevel || "",
      }));
      return;
    }

    setForm({ ...form, [name]: value });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
          <Dialog.Panel className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/20 bg-[#0f172a] text-white shadow-2xl shadow-black/50">
            <div className="sticky top-0 z-10 border-b border-blue-500/10 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(15,23,42,0.98))] px-6 py-5 flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Edit Staff Account</div>
                    <h3 className="mt-1 text-xl font-semibold text-white">Edit Staff Details</h3>
                    <p className="mt-1 text-sm text-slate-400">Update the staff profile, access level, and contact information.</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">
                    <X size={18}/>
                </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); onUpdate(form); }} className="p-6">
                <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Account Preview</div>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3"><span className="text-slate-500">Name</span><span className="truncate text-right text-white font-medium">{form.name || "Required"}</span></div>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3"><span className="text-slate-500">Role</span><span className="truncate text-right text-slate-300">{form.role || "Required"}</span></div>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3"><span className="text-slate-500">Phone</span><span className="truncate text-right text-slate-300">{form.contactNumber || "Required"}</span></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Notes</div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">Changes apply to staff access immediately after saving.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input name="name" value={form.name || ""} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-amber-500/60" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input name="email" type="email" value={form.email || ""} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-amber-500/60" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Position <span className="text-red-500">*</span>
                        </label>
                        <input name="position" value={form.position || ""} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-amber-500/60" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select name="sex" value={form.sex || ""} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-amber-500/60" required>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input name="contactNumber" value={form.contactNumber || "+63"} onChange={handleChange} placeholder="+639123456789" inputMode="tel" maxLength={13} className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-amber-500/60" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select name="role" value={form.role || ""} onChange={handleChange} className="w-full rounded-xl border border-gray-700 bg-[#1e293b] px-4 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-amber-500/60" required>
                            <option value="">Select Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Subadmin">Subadmin</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Access Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="accessLevel"
                          value={form.accessLevel || ""}
                          onChange={handleChange}
                          disabled={form.role === "Admin"}
                          className={`w-full rounded-xl px-4 py-3 text-sm text-white outline-none border transition focus:ring-2 focus:ring-amber-500/60 ${
                            form.role === "Admin"
                              ? "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                              : "bg-[#1e293b] border-gray-700"
                          }`}
                          required
                        >
                            <option value="">Select Level</option>
                            <option value="1">Admin (Full Access)</option>
                            <option value="2">Subadmin (Limited)</option>
                        </select>
                    </div>
                </div>
                  <div className="rounded-xl border border-gray-700 bg-[#1e293b] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white"><Edit3 className="text-yellow-400" size={16} /> Staff Update</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Changes apply to the selected staff account after saving.</p>
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-700 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">Cancel</button>
                    <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-500">Save Changes</button>
                  </div>
                </div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!admin && !loading) navigate("/admin/login");
    document.title = "Users List | JPM Security Agency";
  }, [admin, loading, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    if (admin) {
      fetchUsers(currentPage);
    }
  }, [admin, currentPage, search, roleFilter]);

  const fetchUsers = async (page = currentPage) => {
    setLoadingPage(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (search.trim()) params.set("q", search.trim());
      if (roleFilter !== "All") params.set("role", roleFilter);

      const res = await fetch(`${api}/api/auth/users?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
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

    // Prevent deleting the last Subadmin
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

  const canEdit = admin?.role === "Admin";

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
        ) : users.length === 0 ? (
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
                                <th className="px-6 py-4 font-semibold">#</th>
                                <th className="px-6 py-4 font-semibold">User Profile</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Position</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                {canEdit && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {users.map((u, index) => (
                                <tr key={u._id} className="group hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                                    </td>
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
                                            <div className="flex items-center justify-end gap-2">
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
                    {users.map((u) => (
                        <UserCard 
                            key={u._id} 
                            user={u} 
                            isAdmin={canEdit}
                            onEdit={(user) => { setUserToEdit(user); setIsEditOpen(true); }}
                            onDelete={(user) => setUserToDelete(user)}
                        />
                    ))}
                </div>

                <div className="px-4 pb-4 md:px-6">
                    <TablePagination
                      page={currentPage}
                      limit={PAGE_SIZE}
                      totalItems={totalItems}
                      currentCount={users.length}
                      totalPages={totalPages}
                      label="staff accounts"
                      onPageChange={setCurrentPage}
                    />
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
