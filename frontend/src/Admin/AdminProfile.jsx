import { useEffect, useState } from "react";
import { Camera, RefreshCcw, Save, UserCircle2 } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);

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
  }, [user]);

  useEffect(() => {
    if (!form.photo) return undefined;

    const localPreview = URL.createObjectURL(form.photo);
    setPreviewUrl(localPreview);

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
      <div className="min-h-screen bg-[#0f172a] p-6 text-white">
        <div className="flex min-h-[60vh] items-center justify-center text-blue-400">
          <RefreshCcw className="mr-3 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 text-white md:p-6">
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Profile</h1>
        <p className="mt-2 text-sm text-slate-400">
          Update your basic account information and profile image.
        </p>
      </div>

      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-[#1e293b] p-6 shadow-xl md:p-8">
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="flex flex-col items-center rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
              <div className="mb-4 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-950">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-24 w-24 text-slate-600" strokeWidth={1.2} />
                )}
              </div>

              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500">
                <Camera size={16} />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, photo: event.target.files?.[0] || null }))
                  }
                />
              </label>
              <p className="mt-3 text-center text-xs text-slate-500">
                JPG, PNG, or GIF up to 10MB.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Position</label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Contact Number</label>
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
              Role: <span className="font-medium text-white">{user?.role}</span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {submitting ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
