import { useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const api = import.meta.env.VITE_API_URL;

export default function AdminGalleryManager() {
  const [items, setItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${api}/api/gallery/admin`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load gallery.");
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch gallery error:", error);
      toast.error(error.message || "Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Gallery Manager | JPM Security Agency";
    fetchGallery();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (files.length === 0) {
      toast.error("Select at least one image.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    setUploading(true);
    try {
      const response = await fetch(`${api}/api/gallery/admin`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload images.");

      toast.success(data.message || "Images uploaded successfully.");
      setFiles([]);
      await fetchGallery();
    } catch (error) {
      console.error("Upload gallery error:", error);
      toast.error(error.message || "Failed to upload images.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const response = await fetch(`${api}/api/gallery/admin/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete image.");

      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success(data.message || "Image deleted successfully.");
    } catch (error) {
      console.error("Delete gallery image error:", error);
      toast.error(error.message || "Failed to delete image.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-6">
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-600/20">
              <ImagePlus className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Gallery Manager</h1>
              <p className="text-sm text-slate-400">Upload or remove images that appear on the public gallery page.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchGallery}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-200 hover:bg-[#243046] transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <form onSubmit={handleUpload} className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Upload New Images</h2>
            <p className="text-sm text-slate-400">These uploads are stored in Cloudinary and shown automatically on the public gallery page.</p>
          </div>

          <label className="block border border-dashed border-slate-600 rounded-2xl p-6 bg-slate-900/50 cursor-pointer hover:border-blue-500/60 transition">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
            <div className="flex flex-col items-center text-center gap-3">
              <Upload className="text-blue-400" size={28} />
              <div>
                <p className="text-white font-medium">Choose gallery images</p>
                <p className="text-sm text-slate-400">PNG, JPG, WEBP and other image files up to 10MB each</p>
              </div>
            </div>
          </label>

          {files.length > 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-300 mb-3">Selected files: {files.length}</p>
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {file.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={uploading}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-2xl transition"
          >
            {uploading ? <LoaderCircle className="animate-spin" size={18} /> : <Upload size={18} />}
            {uploading ? "Uploading..." : "Upload Images"}
          </button>
        </form>

        <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Current Gallery</h2>
              <p className="text-sm text-slate-400">{items.length} image{items.length === 1 ? "" : "s"} published</p>
            </div>
          </div>

          {loading ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400">
              <LoaderCircle className="animate-spin mb-3" size={28} />
              <p>Loading gallery images...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              <ImagePlus size={42} className="mb-3 opacity-40" />
              <p>No gallery images uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item._id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50">
                  <img src={item.imageUrl} alt={item.title || "Gallery image"} className="w-full h-56 object-cover" />
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title || "Untitled image"}</p>
                      <p className="text-xs text-slate-400">
                        {item.width && item.height ? `${item.width} x ${item.height}` : "Image"}{item.format ? ` • ${item.format.toUpperCase()}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600/15 text-red-300 hover:bg-red-600/25 disabled:opacity-60 transition"
                    >
                      {deletingId === item._id ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
