import { useEffect, useState } from "react";
import { Camera, RefreshCcw, Save, UserCircle2, User, Mail, Briefcase, Phone, ShieldCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";

const api = import.meta.env.VITE_API_URL;

export default function AdminProfile() {
  const { user, loading, refreshAuth } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    contactNumber: "",
    photo: null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Determine if form data differs from initial user data
  const isDirty = user && (
    form.name !== (user.name || "") ||
    form.email !== (user.email || "") ||
    form.position !== (user.position || "") ||
    form.contactNumber !== (user.contactNumber || "") ||
    form.photo !== null ||
    removePhoto === true
  );

  useEffect(() => {
    document.title = "My Profile | JPM Security Agency";
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
      position: user.position || "",
      contactNumber: user.contactNumber || "",
      photo: null,
    }));
    setPreviewUrl(user.photo || "");
    setRemovePhoto(false);
  }, [user]);

  useEffect(() => {
    if (!form.photo) return undefined;

    const localPreview = URL.createObjectURL(form.photo);
    setPreviewUrl(localPreview);
    setRemovePhoto(false);

    return () => URL.revokeObjectURL(localPreview);
  }, [form.photo]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("position", form.position);
      payload.append("contactNumber", form.contactNumber);
      payload.append("removePhoto", removePhoto);
      if (form.photo) {
        payload.append("photo", form.photo);
      }

      const res = await fetch(`${api}/api/auth/me`, {
        method: "PUT",
        credentials: "include",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      await refreshAuth();
      setForm((prev) => ({ ...prev, photo: null }));
      setRemovePhoto(false);
      setPreviewUrl(data.user?.photo || previewUrl);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-400">
          <RefreshCcw className="h-10 w-10 animate-spin" />
          <p className="text-slate-400 animate-pulse font-medium">Synchronizing profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#0f172a] text-gray-100 p-4 md:p-8 lg:p-12 font-sans flex flex-col"
    >
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-10 w-full">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-white tracking-tight">
          <UserCircle2 className="text-blue-500" size={36} />
          Profile Settings
        </h1>
        <p className="text-gray-400 text-sm mt-2 ml-12">
          Manage your account information and how you appear on the platform.
        </p>
      </div>

      <div className="w-full flex-grow">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#1e293b] rounded-3xl border border-gray-800 p-10 shadow-2xl flex flex-col items-center text-center h-full min-h-[500px] justify-center"
            >
              <div className="relative group mb-8">
                {previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setForm((prev) => ({ ...prev, photo: null }));
                      setPreviewUrl("");
                      setRemovePhoto(true);
                    }}
                    className="absolute -top-1 -right-1 z-10 p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-950/40 border border-red-400/20 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Remove profile image"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div className="h-48 w-48 rounded-full border-4 border-[#0f172a] overflow-hidden bg-slate-800 shadow-2xl ring-4 ring-blue-500/10 transition-all duration-300 group-hover:ring-blue-500/30">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                      <User size={80} className="text-slate-600" />
                    </div>
                  )}
                </div>
                
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full backdrop-blur-sm">
                  <div className="flex flex-col items-center text-white text-sm font-semibold">
                    <Camera size={32} className="mb-2" />
                    Update Photo
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, photo: event.target.files?.[0] || null }))
                    }
                  />
                </label>
              </div>

              <h2 className="text-2xl font-extrabold text-white mb-2">{user?.name || "User Name"}</h2>
              <p className="text-blue-400 text-base font-semibold mb-6">{user?.position || "Administrator"}</p>
              
              <div className="flex items-center gap-3 px-6 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-500/20 shadow-inner">
                <ShieldCheck size={16} />
                {user?.role || "Admin"}
              </div>

            </motion.div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="bg-[#1e293b] rounded-3xl border border-gray-800 p-10 shadow-2xl h-full flex flex-col">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-700/50">
                <div className="p-3 bg-blue-500/10 rounded-2xl shadow-inner">
                  <User className="text-blue-500" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Identity & Contact</h3>
                  <p className="text-gray-400 text-xs mt-1">Manage your professional credentials and contact details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-grow">
                <div className="space-y-8">
                  <InputGroup 
                    label="Full Name" 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    icon={<User size={20} />} 
                    required 
                  />
                  <InputGroup 
                    label="Email Address" 
                    name="email" 
                    type="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    icon={<Mail size={20} />} 
                    required 
                  />
                </div>
                <div className="space-y-8">
                  <InputGroup 
                    label="Official Position" 
                    name="position" 
                    value={form.position} 
                    onChange={handleChange} 
                    icon={<Briefcase size={20} />} 
                  />
                  <InputGroup 
                    label="Contact Number" 
                    name="contactNumber" 
                    value={form.contactNumber} 
                    onChange={handleChange} 
                    icon={<Phone size={20} />} 
                  />
                </div>
              </div>

              <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-[#0f172a] rounded-3xl border border-gray-700/50 shadow-inner">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-blue-500/10 rounded-lg">
                     <ShieldCheck className="text-blue-500" size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-200">Data Security Active</p>
                     <p className="text-xs text-gray-500">All profile changes are encrypted and logged for audit purposes.</p>
                   </div>
                </div>
                <button
                  type="submit"
                  disabled={!isDirty || submitting}
                  className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group"
                >
                  {submitting ? (
                    <RefreshCcw className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} className={`${isDirty ? "group-hover:rotate-12" : ""} transition-transform`} />
                  )}
                  {submitting ? "APPLYING CHANGES..." : "APPLY CHANGES"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// --- Helper Component ---
const InputGroup = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="w-full bg-[#0f172a] border border-gray-700/50 rounded-xl py-3 pl-12 pr-4 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
      />
    </div>
  </div>
);
