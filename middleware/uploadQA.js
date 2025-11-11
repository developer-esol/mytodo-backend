// middleware/uploadQA.js - Dedicated middleware for Q&A image uploads
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
const crypto = require("crypto");
const logger = require("../config/logger");

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// File filter - allow images and documents
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;

  // Allowed document types
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|txt|xml|csv/;

  const extname = path.extname(file.originalname).toLowerCase().substring(1); // Remove the dot
  const isImage = allowedImageTypes.test(extname);
  const isDocument = allowedDocTypes.test(extname);

  // Check MIME type as well for better security
  const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/plain", // .txt
    "application/xml",
    "text/xml", // .xml
    "text/csv",
    "application/csv", // .csv
  ];

  const mimetypeValid = allowedMimeTypes.includes(file.mimetype);

  if ((isImage || isDocument) && mimetypeValid) {
    logger.debug("File accepted for upload", {
      file: "middleware/uploadQA.js",
      function: "fileFilter",
      fileName: file.originalname,
      mimeType: file.mimetype,
    });
    return cb(null, true);
  } else {
    logger.warn("File rejected - invalid type", {
      file: "middleware/uploadQA.js",
      function: "fileFilter",
      fileName: file.originalname,
      mimeType: file.mimetype,
    });
    cb(
      new Error(
        "Only images (jpeg, jpg, png, gif, webp) and documents (pdf, doc, docx, xls, xlsx, txt, xml, csv) are allowed!"
      ),
      false
    );
  }
};

// Configure multer-s3 storage for Q&A images
const qaUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        userId: req.user?._id?.toString() || "unknown",
        uploadDate: new Date().toISOString(),
        uploadType: "qa-image",
      });
    },
    key: function (req, file, cb) {
      // Create unique filename: qa/{taskId}/{type}-{uuid}-{timestamp}.{ext}
      const taskId = req.params.taskId || "unknown";
      const questionId = req.params.questionId || "question";
      const uniqueId = crypto.randomBytes(16).toString("hex");
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);

      // Organize by task and question for easy management
      const key = `qa/${taskId}/${questionId}/${uniqueId}-${timestamp}${ext}`;

      logger.debug("S3 key generated for Q&A upload", {
        file: "middleware/uploadQA.js",
        function: "s3-key-generation",
        key,
        taskId,
        questionId,
      });
      cb(null, key);
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size (increased for documents)
    files: 5, // Maximum 5 files per request
  },
});

// Middleware to handle multiple image uploads for questions
const uploadQuestionImages = qaUpload.array("images", 5);

// Middleware to handle multiple image uploads for answers
const uploadAnswerImages = qaUpload.array("images", 5);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error("Multer upload error", {
      file: "middleware/uploadQA.js",
      function: "handleUploadError",
      errorCode: err.code,
      error: err.message,
    });

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 20MB limit",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images allowed per request",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Use "images" as the field name.',
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    logger.error("File upload error", {
      file: "middleware/uploadQA.js",
      function: "handleUploadError",
      error: err.message,
      stack: err.stack,
    });
    return res.status(400).json({
      success: false,
      message: err.message || "Error uploading images",
    });
  }

  next();
};

// Log uploaded files info
const logUploadedFiles = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    logger.info("Files uploaded successfully", {
      file: "middleware/uploadQA.js",
      function: "logUploadedFiles",
      fileCount: req.files.length,
      files: req.files.map((file, index) => ({
        index: index + 1,
        originalName: file.originalname,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        s3Url: file.location,
        key: file.key,
      })),
    });
  } else {
    logger.debug("No files uploaded with request", {
      file: "middleware/uploadQA.js",
      function: "logUploadedFiles",
    });
  }
  next();
};

module.exports = {
  uploadQuestionImages,
  uploadAnswerImages,
  handleUploadError,
  logUploadedFiles,
  s3Client: s3,
};
