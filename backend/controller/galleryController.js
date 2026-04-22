import GalleryImage from "../models/galleryImage.model.js";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "../utils/cloudinary.js";

export const listGalleryImages = async (_req, res) => {
  try {
    const images = await GalleryImage.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    res.status(500).json({ message: "Failed to load gallery images." });
  }
};

export const listGalleryImagesForAdmin = async (_req, res) => {
  try {
    const images = await GalleryImage.find()
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching admin gallery images:", error);
    res.status(500).json({ message: "Failed to load gallery images." });
  }
};

export const uploadGalleryImages = async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ message: "Select at least one image to upload." });
    }

    const currentCount = await GalleryImage.countDocuments();
    const uploaded = [];

    for (const [index, file] of files.entries()) {
      const cloudinaryResult = await uploadImageToCloudinary(file, {
        folder: "jpm-security/gallery",
      });

      const created = await GalleryImage.create({
        title: file.originalname.replace(/\.[^.]+$/, ""),
        imageUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes,
        uploadedBy: req.user?._id || null,
        sortOrder: currentCount + index,
      });

      uploaded.push(created);
    }

    res.status(201).json({
      message: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded successfully.`,
      items: uploaded,
    });
  } catch (error) {
    console.error("Error uploading gallery images:", error);
    res.status(500).json({ message: error.message || "Failed to upload gallery images." });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Gallery image not found." });
    }

    await deleteImageFromCloudinary(image.publicId);
    await image.deleteOne();

    res.status(200).json({ message: "Gallery image deleted successfully." });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    res.status(500).json({ message: error.message || "Failed to delete gallery image." });
  }
};
