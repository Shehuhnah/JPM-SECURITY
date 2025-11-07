import React, { useState, useEffect } from "react";
import { Send, Trash2, Edit3, Save } from "lucide-react";

export default function AdminHiring() {
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [description, setDescription] = useState("");
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/hirings");
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Create or Update hiring post
  const handlePost = async () => {
    if (!title.trim() || !position.trim() || !description.trim()) {
      alert("Please fill in Title, Position, and Description!");
      return;
    }

    const postData = {
      title,
      position,
      location,
      employmentType,
      description,
      author: "ADMIN",
    };

    try {
      if (editingId) {
        //  UPDATE existing post
        const res = await fetch(`http://localhost:5000/api/hirings/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!res.ok) throw new Error("Failed to update post");
        const updated = await res.json();

        setPosts(posts.map((p) => (p._id === updated._id ? updated : p)));
        setEditingId(null);
      } else {
        // CREATE new post
        const res = await fetch("http://localhost:5000/api/hirings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!res.ok) throw new Error("Failed to create post");
        const created = await res.json();
        setPosts([created, ...posts]);
      }

      // Reset form
      setTitle("");
      setPosition("");
      setLocation("");
      setEmploymentType("Full-time");
      setDescription("");
    } catch (err) {
      console.error("Error saving post:", err);
      alert("Error saving post");
    }
  };

  // Delete post by ID
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/hiring/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete post");
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  //  Edit post handler
  const handleEdit = (post) => {
    setTitle(post.title);
    setPosition(post.position);
    setLocation(post.location);
    setEmploymentType(post.employmentType);
    setDescription(post.description);
    setEditingId(post._id);
  };

  const toggleExpand = (id) => {
    setExpandedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <main className="flex-1 p-6">
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-2">
          💼 Admin Hiring Management
        </h2>

        {/* Create / Update Post Form */}
        <div className="p-6 border border-gray-800 bg-[#1e293b]/80 backdrop-blur-md rounded-2xl shadow-xl space-y-4 mb-10">
          <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
            {editingId ? "✏️ Edit Hiring Post" : "📝 Create New Hiring Post"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-sm"
            />
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full bg-[#0f172a] border border-gray-700 text-gray-200 rounded-lg px-4 py-2 text-sm"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contractual</option>
              <option>Internship</option>
            </select>
          </div>

          <textarea
            placeholder="Write job description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32 bg-[#0f172a] border border-gray-700 text-gray-100 rounded-lg p-3"
          />

          <div className="flex justify-between">
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setPosition("");
                  setLocation("");
                  setEmploymentType("Full-time");
                  setDescription("");
                }}
                className="text-sm text-gray-400 hover:text-gray-200"
              >
                Cancel Edit
              </button>
            )}
            <button
              onClick={handlePost}
              className={`flex items-center gap-2 ${
                editingId ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"
              } text-white px-6 py-2 rounded-lg shadow-md transition`}
            >
              {editingId ? <Save size={16} /> : <Send size={16} />}
              {editingId ? "Update Post" : "Post Job"}
            </button>
          </div>
        </div>

        {/*Posts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 italic col-span-full">
              No hiring posts yet.
            </p>
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
                  className="bg-[#1e293b] border border-gray-800 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex justify-between text-xs text-gray-400 mb-3">
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

                  <h3 className="text-xl font-semibold text-white mb-1">
                    {p.title}
                  </h3>

                  <p className="text-sm text-blue-300 mb-3">
                    <strong>Position:</strong> {p.position} <br />
                    <strong>Location:</strong> {p.location || "Not specified"} <br />
                    <strong>Type:</strong> {p.employmentType}
                  </p>

                  <p className="text-gray-100 text-sm mb-3 whitespace-pre-line break-words">
                    {shortText}
                  </p>

                  {p.description.length > 200 && (
                    <button
                      onClick={() => toggleExpand(p._id)}
                      className="text-blue-400 text-sm hover:underline mb-2"
                    >
                      {isExpanded ? "See Less" : "See More"}
                    </button>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
                    <button
                      onClick={() => handleEdit(p)}
                      className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 px-3 py-1 rounded-md"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-md"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
