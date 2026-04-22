import express from "express";
import multer from "multer";
import {
  deleteGalleryImage,
  listGalleryImages,
  listGalleryImagesForAdmin,
  uploadGalleryImages,
} from "../controller/galleryController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

router.get("/", listGalleryImages);
router.get("/admin", protect, authorizeRoles("Admin"), listGalleryImagesForAdmin);
router.post("/admin", protect, authorizeRoles("Admin"), upload.array("images", 12), uploadGalleryImages);
router.delete("/admin/:id", protect, authorizeRoles("Admin"), deleteGalleryImage);

export default router;
