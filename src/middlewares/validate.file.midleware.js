import multer from "multer";
import { ValidationError } from "../shared/errors/AppError.js";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ValidationError("Type de fichier non autorisé"));
  }
  cb(null, true);
};

export const validateFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo partout
    files: 1,
  },
});