import multer from "multer";
import path from "path";
import fs from "fs";

const allowed = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
];

export const createUpload = (folder = "messages") => {
  const uploadDir = path.join(process.cwd(), "backend", "uploads", folder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueName + path.extname(file.originalname));
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Invalid file type"), false);
      }
      cb(null, true);
    },
  });
};

const upload = createUpload("messages");

export default upload;
