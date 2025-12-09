import React, { useState, useEffect } from "react";

export default function CompanyDetails() {
  const [posts, setPosts] = useState([]);
  const [newText, setNewText] = useState("");
  const [audience, setAudience] = useState("all");
  const [image, setImage] = useState(null);

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

  // save posts 
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

    setPosts([newPost, ...posts]); 
    setNewText("");
    setImage(null);
  };

  return (
    <div
      className="flex min-h-screen bg-[#0f172a]">
      <div className="flex-1 p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Post Company Details</h2>
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
              className="bg-gray-900 hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow"
            >
              Post
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
