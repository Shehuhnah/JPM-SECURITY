import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";

export default function CompanyDetails() {
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState("");
  const [audience, setAudience] = useState("all");
  const [image, setImage] = useState(null);

  // ✅ Load posts from localStorage when component mounts
  // load saved posts on mount
  useEffect(() => {
    const savedPosts = localStorage.getItem("companyPosts");
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (err) {
        console.error("Error parsing posts:", err);
      }
    }
  }, []);

  // save posts whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem("companyPosts", JSON.stringify(posts));
    }
  }, [posts]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!newText.trim() && !image) {
      alert("Please write something or attach an image!");
      return;
    }

    const newPost = {
      id: Date.now(),
      text: newText,
      audience,
      image,
      author: "ADMIN",
      date: new Date().toLocaleString(),
    };

    setPosts([newPost, ...posts]); // add new post to top
    setNewText("");
    setImage(null);
  };

  return (
    <div
      className="min-h-screen bg-center bg-repeat text-white flex itemsjustify-center "
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: "#111",
        backgroundSize: "40px 40px",
      }}
    >
      <Navbar />
      <div className="flex-1 p-6">
        <h2 className="text-xl font-bold mb-4">Post Company Details</h2>

        {/* Post input box */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4 text-black">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add new company details..."
            className="w-full p-2 border rounded mb-2"
          />
          <div className="flex items-center gap-4 mb-2">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="border rounded p-2"
            >
              <option value="all">All</option>
              <option value="guards">Guards Only</option>
              <option value="applicants">Applicants Only</option>
            </select>
          </div>
          <button
            onClick={handlePost}
            className="bg-green-900 text-white px-4 py-2 rounded"
          >
            POST
          </button>
        </div>

        {/* Posts list */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-100 p-4 rounded-lg shadow text-black "
            >
              <p>{post.text}</p>
              {post.image && (
                <img
                  src={post.image}
                  alt="Attachment"
                  className="mt-2 rounded-lg"
                />
              )}
              <p className="text-sm text-black ">
                👤 {post.author} | {post.date} | Audience: {post.audience}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
