import Post from "../models/Post.model.js";

// ✅ GET all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("createdBy", "name role");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ POST new announcement (admin/subadmin only)
export const createPost = async (req, res) => {
  try {
    const { title, message, audience, file } = req.body;
    const post = await Post.create({
      title,
      message,
      audience,
      file,
      createdBy: req.user._id,
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ DELETE post (admin/subadmin only)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
