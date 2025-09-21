import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";

export default function AdminPosts() {
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [posts, setPosts] = useState([]);
  const [file, setFile] = useState(null);

  // ✅ Load posts from localStorage on mount
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

  // ✅ Save posts only when posts changes
  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts]);

  const handlePost = () => {
    if (!message.trim() && !file) {
      alert("Please type an announcement or attach a file!");
      return;
    }

    const newPost = {
      id: Date.now(),
      author: "ADMIN", // always admin
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      message,
      audience,
      file: file ? URL.createObjectURL(file) : null,
    };

    setPosts([newPost, ...posts]);
    setMessage("");
    setFile(null);
  };

  const handleDelete = (id) => {
    const updatedPosts = posts.filter((p) => p.id !== id);
    setPosts(updatedPosts);
    localStorage.setItem("posts", JSON.stringify(updatedPosts));
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <div className="w-64 bg-white">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Admin Posts</h2>

        {/* Post Form */}
        <div className="p-4 border border-gray-300 rounded-lg mb-6 bg-white shadow text-black">
          <textarea
            placeholder="Add new announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-24 p-3 rounded-lg border border-gray-900 focus:outline-none focus:ring"
          />

          {/* File Upload */}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-3"
          />

          <div className="flex justify-between items-center mt-3">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="border rounded px-3 py-2 bg-white text-gray-800"
            >
              <option value="guards">Guards Only</option>
              <option value="applicants">Applicants Only</option>
              <option value="all">All</option>
            </select>

            <button
              onClick={handlePost}
              className="bg-gray-900 hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow"
            >
              Post
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="p-4 border rounded-lg bg-white shadow text-gray-900"
            >
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>👤 {p.author}</span>
                <span>
                  {p.date} • {p.time}
                </span>
              </div>

              <p className="mb-2">{p.message}</p>

              {p.file && (
                <div className="mt-2">
                  <img
                    src={p.file}
                    alt="attachment"
                    className="max-h-48 rounded-lg"
                  />
                </div>
              )}

              <p className="text-xs italic text-gray-500">
                Audience:{" "}
                {p.audience === "guards"
                  ? "Guards"
                  : p.audience === "applicants"
                  ? "Applicants"
                  : "All"}
              </p>

              <button
                onClick={() => handleDelete(p.id)}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
