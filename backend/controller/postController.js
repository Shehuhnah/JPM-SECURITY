import Post from "../models/post.model.js";

// ✅ CREATE new post
export const createPost = async (req, res) => {
  try {
    const { title, subject, body, author } = req.body;

    if (!title || !subject || !body) {
      return res.status(400).json({ message: "Title, subject, and body are required." });
    }

    const post = await Post.create({
      title,
      subject,
      body,
      author: author || "ADMIN",
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // newest first
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE post by ID
export const updatePost = async (req, res) => {
  try {
    const { title, subject, body, author } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, subject, body, author },
      { new: true, runValidators: true }
    );

    if (!updatedPost) return res.status(404).json({ message: "Post not found." });

    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ DELETE post by ID
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json({ message: "Post deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
