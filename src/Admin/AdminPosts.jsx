import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";

export default function AdminPosts() {
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [posts, setPosts] = useState([]);

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

  // ✅ Save posts only when posts changes and not empty
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem("posts", JSON.stringify(posts));
    }
  }, [posts]);

  const handlePost = () => {
    if (!message.trim()) {
      alert("Please type an announcement!");
      return;
    }

    const newPost = {
      id: Date.now(),
      author: audience.toUpperCase(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      message,
      audience,
    };

    setPosts([newPost, ...posts]);
    setMessage("");
  };

  const handleDelete = (id) => {
    const updatedPosts = posts.filter((p) => p.id !== id);
    setPosts(updatedPosts);

    // ✅ Update localStorage after delete
    localStorage.setItem("posts", JSON.stringify(updatedPosts));
  };

  return (
    
    <div className="min-h-screen bg-center bg-repeat text-white flex itemsjustify-center "
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: "#111",
          backgroundSize: "40px 40px",
           }}
      >
      <Navbar />

      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4">Admin Posts</h2>

        {/* Post Form */}
        <div className="p-4 border border-gray-300 rounded-lg mb-6 bg-white shadow text-black">
          <textarea
            placeholder="Add new announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-24 p-3 rounded-lg border border-gray-900 focus:outline-none focus:ring"
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
              className="bg-green-900 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow"
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
