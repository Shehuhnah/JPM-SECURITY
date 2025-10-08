import { useState, useEffect } from "react";
import { Image as ImageIcon, Send, Trash2 } from "lucide-react";

export default function AdminPosts() {
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [posts, setPosts] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // ✅ Load posts from localStorage
  useEffect(() => {
    const savedPosts = localStorage.getItem("posts");
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (err) {
        console.error("Error parsing posts:", err);
      }
    }
  }, []);

  // ✅ Save posts whenever they change
  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts]);

  // File Upload Preview
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  // Post new announcement
  const handlePost = () => {
    if (!message.trim() && !file) {
      alert("Please type an announcement or attach a file!");
      return;
    }

    const newPost = {
      id: Date.now(),
      author: "ADMIN",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      message,
      audience,
      file: preview,
    };

    setPosts([newPost, ...posts]);
    setMessage("");
    setFile(null);
    setPreview(null);
  };

  // Delete Post
  const handleDelete = (id) => {
    const updatedPosts = posts.filter((p) => p.id !== id);
    setPosts(updatedPosts);
    localStorage.setItem("posts", JSON.stringify(updatedPosts));
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Main Content */}
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">📢 Admin Posts</h2>

        {/* Post Form */}
        <div className="p-6 border border-gray-200 rounded-xl mb-6 bg-white shadow-lg space-y-4">
          <textarea
            placeholder="Write a new announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-28 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />

          {/* Image Preview */}
          {preview && (
            <div className="relative w-40 h-40">
              <img
                src={preview}
                alt="Preview"
                className="w-40 h-40 object-cover rounded-lg border"
              />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            {/* File Upload */}
            <label className="flex items-center gap-2 cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-2 rounded-lg text-sm">
              <ImageIcon size={16} />
              <span>Attach Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Audience Selector */}
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="border rounded px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none"
            >
              <option value="guards">🛡️ Guards Only</option>
              <option value="applicants">👥 Applicants Only</option>
              <option value="all">🌍 All</option>
            </select>

            {/* Post Button */}
            <button
              onClick={handlePost}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow transition"
            >
              <Send size={16} /> Post
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="p-5 border rounded-xl bg-white shadow-md hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span className="font-semibold">👤 {p.author}</span>
                <span>
                  {p.date} • {p.time}
                </span>
              </div>

              {/* Message */}
              <p className="mb-3 text-gray-800">{p.message}</p>

              {/* Attached Image */}
              {p.file && (
                <img
                  src={p.file}
                  alt="attachment"
                  className="w-full max-h-60 object-cover rounded-lg mb-3"
                />
              )}

              {/* Footer */}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="italic">
                  🎯 Audience:{" "}
                  {p.audience === "guards"
                    ? "Guards"
                    : p.audience === "applicants"
                    ? "Applicants"
                    : "All"}
                </span>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded shadow text-xs"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <p className="text-center text-gray-400 italic mt-6">
              No announcements yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
