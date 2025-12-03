import { useState, useEffect } from "react";
import { Send, Trash2, Edit, Save, Megaphone, User, Calendar, X, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const api = import.meta.env.VITE_API_URL;

export default function AdminPosts() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  
  // Toast State
  const [toasts, setToasts] = useState([]);

  const { user: admin } = useAuth();
  const API_URL = `${api}/api/posts`;

  // Toast Helper
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  // Fetch posts
  const fetchPosts = async () => {
    setLoadingPage(true);
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data.reverse() : []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      showToast("Failed to load posts", "error");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle Create/Update
  const handlePost = async () => {
    if (!title.trim() || !subject.trim() || !body.trim()) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    const newPost = {
      title,
      subject,
      body,
      author: admin?._id,
    };

    try {
      let res;
      if (editingPost) {
        res = await fetch(`${API_URL}/${editingPost._id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPost),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPost),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error saving post");

      if (editingPost) {
        setPosts((prev) => prev.map((p) => (p._id === editingPost._id ? data : p)));
        setEditingPost(null);
        showToast("Announcement updated successfully");
      } else {
        setPosts((prev) => [data, ...prev]);
        showToast("Announcement posted successfully");
      }

      // Reset Form
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to save post", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to delete");

      setPosts((prev) => prev.filter((p) => p._id !== id));
      showToast("Post deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Error deleting post", "error");
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setSubject(post.subject);
    setBody(post.body);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setBody("");
    setEditingPost(null);
  };

  const toggleExpand = (id) => {
    setExpandedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-900/50 text-gray-100 font-sans">
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
                <Megaphone className="text-blue-500" size={28}/> 
            </div>
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Guard Announcements</h2>
                <p className="text-slate-400 text-sm mt-1">Broadcast important updates to all security personnel.</p>
            </div>
        </div>

        {/* --- Post Form Section --- */}
        <div className={`p-6 border border-gray-700 bg-[#1e293b] rounded-2xl shadow-xl space-y-4 mb-10 transition-all duration-300 ${editingPost ? 'ring-2 ring-blue-500/50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               {editingPost ? <Edit className="text-blue-400" size={20}/> : <Send className="text-blue-400" size={20}/>}
               {editingPost ? "Edit Announcement" : "Create New Announcement"}
            </h3>
            {editingPost && (
                <button onClick={resetForm} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md transition">
                    <X size={14}/> Cancel Edit
                </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                 <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Title</label>
                 <input
                    type="text"
                    placeholder="e.g. Mandatory Meeting"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div className="flex-1">
                 <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Subject</label>
                 <input
                    type="text"
                    placeholder="e.g. Policy Update"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
            <div>
                 <label className="text-xs text-gray-400 font-medium ml-1 mb-1 block">Content</label>
                 <textarea
                    placeholder="Type your message here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-32 bg-[#0f172a] border border-gray-700 text-gray-200 placeholder-gray-600 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
                 />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handlePost}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium shadow-lg transition transform active:scale-95 ${
                editingPost
                  ? "bg-green-600 hover:bg-green-500 shadow-green-900/20 text-white"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 text-white"
              }`}
            >
              {editingPost ? <Save size={18} /> : <Send size={18} />}
              {editingPost ? "Save Changes" : "Post Announcement"}
            </button>
          </div>
        </div>

        {/* --- Feed Section --- */}
        <div className="mb-4 flex items-center gap-2">
             <div className="h-px bg-gray-800 flex-1"></div>
             <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Recent Posts</span>
             <div className="h-px bg-gray-800 flex-1"></div>
        </div>

        {loadingPage ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                  <div key={i} className="bg-[#1e293b] border border-gray-800 rounded-2xl h-64 animate-pulse"></div>
              ))}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#1e293b]/50 border border-gray-800 border-dashed rounded-2xl">
                 <Megaphone size={48} className="text-gray-600 mb-4 opacity-50"/>
                 <p className="text-gray-500">No announcements posted yet.</p>
              </div>
            ) : (
              posts.map((p) => {
                const isExpanded = expandedPosts.includes(p._id);
                const bodyPreview =
                  p.body.length > 150 && !isExpanded
                    ? p.body.slice(0, 150) + "..."
                    : p.body;

                return (
                  <div
                    key={p._id}
                    className="bg-[#1e293b] border border-gray-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-gray-700 transition-all duration-300 flex flex-col h-full group"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-700">
                            <User size={20} />
                         </div>
                         <div>
                             <div className="text-sm font-semibold text-white">{p.author?.name || "Admin"}</div>
                             <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar size={10}/>
                                {new Date(p.createdAt).toLocaleDateString()}
                             </div>
                         </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition" title="Edit">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Delete">
                            <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex-1 mb-4">
                         <h3 className="text-lg font-bold text-white mb-1 line-clamp-1" title={p.title}>{p.title}</h3>
                         <div className="text-xs font-medium text-blue-400 mb-3 bg-blue-500/10 inline-block px-2 py-0.5 rounded border border-blue-500/20">
                            {p.subject}
                         </div>
                         <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                            {bodyPreview}
                         </p>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center">
                        <div className="text-xs text-gray-500 italic">Visible to all guards</div>
                        {p.body.length > 150 && (
                            <button
                            onClick={() => toggleExpand(p._id)}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition hover:underline"
                            >
                            {isExpanded ? "Show Less" : "Read More"}
                            </button>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

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

      </main>
    </div>
  );
}