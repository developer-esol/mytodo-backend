// middleware/chatUploadMiddleware.js
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const logger = require("../config/logger");

// Force local storage for development
logger.info("Using local storage for file uploads", {
  file: "middleware/chatUploadMiddleware.js",
  function: "initialization",
});

// File type validation
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];
  const allowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

  const allAllowedTypes = [
    ...allowedImageTypes,
    ...allowedDocumentTypes,
    ...allowedAudioTypes,
    ...allowedVideoTypes,
  ];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only images, documents, audio, and video files are allowed.`
      ),
      false
    );
  }
};

// Use local storage for now (can be enhanced for AWS later)
logger.info("Configured local storage for file uploads", {
  file: "middleware/chatUploadMiddleware.js",
  function: "storage-config",
});

// Ensure upload directory exists
const uploadPath = path.join(__dirname, "../public/uploads/chats");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  logger.info("Created upload directory", {
    file: "middleware/chatUploadMiddleware.js",
    function: "directory-setup",
    uploadPath,
  });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const taskId = req.params.taskId || "general";
      const taskUploadPath = path.join(uploadPath, taskId);

      // Create task-specific directory if it doesn't exist
      if (!fs.existsSync(taskUploadPath)) {
        fs.mkdirSync(taskUploadPath, { recursive: true });
      }

      cb(null, taskUploadPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = crypto.randomBytes(16).toString("hex") + ext;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 10,
  },
  fileFilter: fileFilter,
});

// Export different upload configurations
exports.uploadChatFiles = upload.array("files", 10); // For multiple files (standard)
exports.uploadChatFilesArray = upload.array("files[]", 10); // For multiple files (array notation)
exports.uploadSingleFile = upload.single("file"); // For single file
exports.uploadChatImages = upload.array("images", 5); // Backward compatibility

// Error handling middleware
exports.handleUploadError = (error, req, res, next) => {
  logger.error("File upload error occurred", {
    file: "middleware/chatUploadMiddleware.js",
    function: "handleUploadError",
    error: error.message,
    errorCode: error.code,
    stack: error.stack,
  });

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum size is 25MB.",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          error: "Too many files. Maximum 10 files per upload.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          error: "Unexpected file field.",
        });
      default:
        return res.status(400).json({
          success: false,
          error: "File upload error: " + error.message,
        });
    }
  }

  if (error.message && error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  // Other errors
  return res.status(500).json({
    success: false,
    error: "Upload failed: " + error.message,
  });
};

// Helper function to get file type category from mimetype
exports.getFileTypeCategory = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "file";
};
