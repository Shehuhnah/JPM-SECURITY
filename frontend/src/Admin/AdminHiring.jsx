import React, { useState, useEffect } from "react";
import { Send, Trash2, Edit3, Save, Briefcase, MapPin, Clock, X, CheckCircle, AlertCircle, Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import ConfirmationModal from "../components/ConfirmationModal";

const api = import.meta.env.VITE_API_URL;

export default function AdminHiring() {
  const { user, loading } = useAuth();
  
  // Form State
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [description, setDescription] = useState("");
  
  // Data State
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Toast State
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const fetchPosts = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`${api}/api/hirings`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data.reverse()); // Show newest first
    } catch (err) {
      console.error("Error fetching posts:", err);
      showToast("Failed to load hiring posts", "error");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!title.trim() || !position.trim() || !description.trim()) {
      showToast("Please fill in Title, Position, and Description.", "error");
      return;
    }

    const postData = {
      title,
      position,
      location,
      employmentType,
      description,
    };

    try {
      if (editingId) {
        // UPDATE
        const res = await fetch(`${api}/api/hirings/${editingId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!res.ok) throw new Error("Failed to update post");
        const updated = await res.json();

        setPosts(posts.map((p) => (p._id === updated._id ? updated : p)));
        setEditingId(null);
        showToast("Job post updated successfully");
      } else {
        // CREATE
        const res = await fetch(`${api}/api/hirings`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!res.ok) throw new Error("Failed to create post");
        const created = await res.json();
        setPosts([created, ...posts]);
        showToast("Job post created successfully");
      }

      resetForm();
    } catch (err) {
      console.error("Error saving post:", err);
      showToast("Error saving post", "error");
    }
  };

  const confirmDelete = (id) => {
      setPostToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const res = await fetch(`${api}/api/hirings/${postToDelete}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to delete post");
      setPosts(posts.filter((p) => p._id !== postToDelete));
      showToast("Job post deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting post:", err);
      showToast("Failed to delete post", "error");
    } finally {
        setIsDeleteModalOpen(false);
        setPostToDelete(null);
    }
  };

  const handleEdit = (post) => {
    setTitle(post.title);
    setPosition(post.position);
    setLocation(post.location);
    setEmploymentType(post.employmentType);
    setDescription(post.description);
    setEditingId(post._id);
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setPosition("");
    setLocation("");
    setEmploymentType("Full-time");
    setDescription("");
  };

  const toggleExpand = (id) => {
    setExpandedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-900/50 text-gray-100 font-sans">
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <Briefcase className="text-blue-500" size={28}/> 
            </div>
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Hiring Management</h2>
                <p className="text-slate-400 text-sm mt-1">Post new job openings and manage vacancies.</p>
            </div>
        </div>

        {/* --- Form Section --- */}
        <div className={`p-6 border border-gray-700 bg-[#1e293b] rounded-2xl shadow-xl space-y-5 mb-10 transition-all duration-300 ${editingId ? 'ring-2 ring-blue-500/50' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {editingId ? <Edit3 className="text-blue-400" size={20}/> : <Briefcase className="text-blue-400" size={20}/>}
              {editingId ? "Edit Hiring Post" : "Create New Job Post"}
            </h3>
            {editingId && (
                <button onClick={resetForm} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md transition">
                    <X size={14}/> Cancel Edit
                </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Security Officer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
               </div>
               <div>
                  <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Target Position</label>
                  <input
                    type="text"
                    placeholder="e.g. Security Guard"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
               </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input
                        type="text"
                        placeholder="e.g. Cavite Area"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[#0f172a] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Employment Type</label>
                  <div className="relative">
                     <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full bg-[#0f172a] border border-gray-700 text-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition appearance-none cursor-pointer"
                    >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contractual</option>
                        <option>OJT</option>
                    </select>
                    <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                  </div>
               </div>
            </div>

            {/* Description */}
            <div>
               <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Job Description</label>
               <textarea
                placeholder="Describe responsibilities, requirements, and benefits..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 bg-[#0f172a] border border-gray-700 text-gray-200 placeholder-gray-600 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handlePost}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium shadow-lg transition transform active:scale-95 ${
                editingId
                  ? "bg-green-600 hover:bg-green-500 shadow-green-900/20 text-white"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 text-white"
              }`}
            >
              {editingId ? <Save size={18} /> : <Send size={18} />}
              {editingId ? "Update Job Post" : "Publish Job Post"}
            </button>
          </div>
        </div>

        {/* --- Feed Section --- */}
        <div className="mb-4 flex items-center gap-2">
             <div className="h-px bg-gray-800 flex-1"></div>
             <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Current Openings</span>
             <div className="h-px bg-gray-800 flex-1"></div>
        </div>

        {isLoadingData ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-[#1e293b] border border-gray-800 rounded-2xl h-64 animate-pulse"></div>
                ))}
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#1e293b]/50 border border-gray-800 border-dashed rounded-2xl">
                    <Briefcase size={48} className="text-gray-600 mb-4 opacity-50"/>
                    <p className="text-gray-500">No active job listings.</p>
                </div>
            ) : (
                posts.map((p) => {
                const isExpanded = expandedPosts.includes(p._id);
                const shortText =
                    p.description.length > 200 && !isExpanded
                    ? p.description.slice(0, 200) + "..."
                    : p.description;

                return (
                    <div
                    key={p._id}
                    className="bg-[#1e293b] border border-gray-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-gray-700 transition-all duration-300 flex flex-col h-full group"
                    >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                           <h3 className="text-lg font-bold text-white leading-tight">{p.title}</h3>
                           <span className="text-xs text-blue-400 font-medium">{p.position}</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded-lg text-gray-400">
                           <Building2 size={18} />
                        </div>
                    </div>

                    {/* Meta Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-300 bg-gray-700/50 px-2 py-1 rounded-md border border-gray-600/50">
                            <MapPin size={12} className="text-red-400"/>
                            {p.location || "Remote"}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-300 bg-gray-700/50 px-2 py-1 rounded-md border border-gray-600/50">
                            <Clock size={12} className="text-yellow-400"/>
                            {p.employmentType}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1 mb-4">
                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                            {shortText}
                        </p>
                    </div>
                    
                    {/* Read More Toggle */}
                    {p.description.length > 200 && (
                        <button
                        onClick={() => toggleExpand(p._id)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 self-start mb-4 hover:underline"
                        >
                        {isExpanded ? "Show Less" : "Read Full Description"}
                        </button>
                    )}

                    {/* Footer / Actions */}
                    <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center mt-auto">
                        <span className="text-xs text-gray-500">
                           Posted {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                        <button
                            onClick={() => handleEdit(p)}
                            className="flex items-center gap-1 bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => confirmDelete(p._id)}
                            className="flex items-center gap-1 bg-red-600/10 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                            Delete
                        </button>
                        </div>
                    </div>
                    </div>
                );
                })
            )}
            </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title="Delete Job Post"
            message="Are you sure you want to delete this job post? This action cannot be undone."
            confirmText="Delete Post"
      />

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 flex flex-col items-end gap-3 z-50">
        {toasts.map((toast) => (
        <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white font-medium text-sm animate-in slide-in-from-right-10 fade-in duration-300 ${
            toast.type === "success" ? "bg-emerald-600 shadow-emerald-900/20" : 
            toast.type === "error" ? "bg-red-600 shadow-red-900/20" : "bg-gray-700"
            }`}
        >
            {toast.type === "success" && <CheckCircle size={18}/>}
            {toast.type === "error" && <AlertCircle size={18}/>}
            {toast.message}
        </div>
        ))}
     </div>
    </div>
  );
}