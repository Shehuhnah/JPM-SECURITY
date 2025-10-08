import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Send, Trash2 } from "lucide-react";

export default function AdminHiring() {
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("full-time");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("all");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);

  // Load posts
  useEffect(() => {
    const savedPosts = localStorage.getItem("hiringPosts");
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (err) {
        console.error("Error parsing hiringPosts:", err);
      }
    }
  }, []);

  // Save posts
  useEffect(() => {
    localStorage.setItem("hiringPosts", JSON.stringify(posts));
  }, [posts]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!title.trim() || !position.trim() || !description.trim()) {
      alert("Please fill in at least Title, Position, and Description!");
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
      title,
      position,
      location,
      employmentType,
      description,
      audience,
      image,
    };

    setPosts([newPost, ...posts]);
    setTitle("");
    setPosition("");
    setLocation("");
    setEmploymentType("full-time");
    setDescription("");
    setImage(null);
  };

  const handleDelete = (id) => {
    const updatedPosts = posts.filter((p) => p.id !== id);
    setPosts(updatedPosts);
    localStorage.setItem("hiringPosts", JSON.stringify(updatedPosts));
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">📢 Create Hiring Post</h2>

        {/* Post Form */}
        <div className="p-6 border border-gray-200 rounded-xl mb-6 bg-white shadow-lg space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Job Title (e.g. We’re Hiring Security Guards!)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {/* Position & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Position (e.g. Security Guard)"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Location (e.g. Cavite / Client Site)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Employment Type */}
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contractual">Contractual</option>
            <option value="internship">Internship</option>
          </select>

          {/* Description */}
          <textarea
            placeholder="Job Description, qualifications, requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-28 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />

          {/* Image Upload */}
          {image && (
            <div className="mt-3 relative w-40 h-40">
              <img
                src={image}
                alt="Preview"
                className="w-40 h-40 object-cover rounded-lg border"
              />
              <button
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <label className="flex items-center gap-2 cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-2 rounded-lg text-sm">
              <ImageIcon size={16} />
              <span>Attach Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="border rounded px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none"
            >
              <option value="guards">🛡️ Guards Only</option>
              <option value="applicants">👥 Applicants Only</option>
              <option value="all">🌍 All</option>
            </select>

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
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span className="font-semibold">👤 {p.author}</span>
                <span>
                  {p.date} • {p.time}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-800">{p.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Position:</strong> {p.position} •{" "}
                <strong>Location:</strong> {p.location} •{" "}
                <strong>Type:</strong> {p.employmentType}
              </p>

              <p className="mb-3 text-gray-800">{p.description}</p>

              {p.image && (
                <img
                  src={p.image}
                  alt="Hiring"
                  className="w-full max-h-60 object-cover rounded-lg mb-3"
                />
              )}

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
              No hiring posts yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
