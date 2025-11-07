import { useState, useEffect } from "react";
import { Send, Trash2, Edit, Save } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AdminPosts() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const { admin } = useAuth();

  const API_URL = "http://localhost:5000/api/posts"; // backend port

  // Fetch all posts 
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setPosts(data.reverse()); // latest first
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Handle post creation or update
  const handlePost = async () => {
    if (!title.trim() || !subject.trim() || !body.trim()) {
      alert("Please fill in all fields before posting.");
      return;
    }

    const newPost = {
      title,
      subject,
      body,
      author: admin.role, // adjust if you’ll use auth later
    };

    try {
      let res;
      if (editingPost) {
        // Update existing post
        res = await fetch(`${API_URL}/${editingPost._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPost),
        });
      } else {
        // Create new post
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPost),
        });
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error saving post");

      if (editingPost) {
        setPosts((prev) =>
          prev.map((p) => (p._id === editingPost._id ? data : p))
        );
        setEditingPost(null);
      } else {
        setPosts((prev) => [data, ...prev]);
      }

      // Reset form
      setTitle("");
      setSubject("");
      setBody("");
    } catch (err) {
      console.error(err);
      alert("Failed to save post.");
    }
  };

  // Edit existing post
  const handleEdit = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setSubject(post.subject);
    setBody(post.body);
  };

  // Delete post
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to delete");

      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting post.");
    }
  };

  // Expand / Collapse long posts
  const toggleExpand = (id) => {
    setExpandedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 p-6">
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-2">
          📢 Guard Announcements
        </h2>

        {/* Post Form */}
        <div className="p-6 border border-gray-800 bg-[#1e293b]/80 backdrop-blur-md rounded-2xl shadow-xl space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-blue-400">
            {editingPost ? "✏️ Edit Announcement" : "📝 Create New Announcement"}
          </h3>

          <div className="space-y-3">
            <div className="flex flex-row gap-x-3">
              <input
                type="text"
                placeholder="Enter title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Enter subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <textarea
              placeholder="Write your announcement here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-32 bg-[#0f172a] border border-gray-700 text-gray-100 placeholder-gray-500 p-3 rounded-lg focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handlePost}
              className={`flex items-center gap-2 ${
                editingPost
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-blue-600 hover:bg-blue-500"
              } text-white px-5 py-2 rounded-lg shadow-md transition`}
            >
              {editingPost ? <Save size={16} /> : <Send size={16} />}
              {editingPost ? "Save Changes" : "Post Announcement"}
            </button>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <p className="text-center text-gray-400">Loading posts...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.length === 0 ? (
              <p className="text-center text-gray-400 italic col-span-full">
                No announcements yet.
              </p>
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
                    className="bg-[#1e293b] border border-gray-800 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span className="font-semibold text-blue-400">
                          👤 {p.author}
                        </span>
                        <span>
                          {new Date(p.createdAt).toLocaleDateString()} •{" "}
                          {new Date(p.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-1">
                        <span className="font-bold">Title: </span>
                        {p.title}
                      </h3>
                      <p className="text-sm text-blue-300 mb-3 italic">
                        <span className="font-bold">Subject: </span>
                        {p.subject}
                      </p>

                      <p className="text-gray-100 mb-3 whitespace-pre-line break-words">
                        {bodyPreview}
                      </p>

                      {p.body.length > 150 && (
                        <button
                          onClick={() => toggleExpand(p._id)}
                          className="text-blue-400 text-sm hover:underline"
                        >
                          {isExpanded ? "See Less" : "See More"}
                        </button>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-3">
                      <span className="italic">For Guards Only</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-md"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-md"
                        >
                          <Trash2 size={14} /> Delete
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
    </div>
  );
}
