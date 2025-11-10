// middleware/uploadMiddleware.js
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
const crypto = require("crypto");

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create multer upload instance for S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = crypto.randomBytes(16).toString("hex") + ext;
      cb(null, `tasks/${filename}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."), false);
    }
  },
});

// Accept multiple common field names to avoid Multer "Unexpected field" errors
const uploadFlexibleFields = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "image", maxCount: 5 },
  { name: "photos", maxCount: 5 },
  { name: "photo", maxCount: 5 },
  { name: "files", maxCount: 5 },
  { name: "file", maxCount: 5 },
]);

// Wrapper to flatten req.files to a single array for downstream controllers
function uploadFiles(req, res, next) {
  uploadFlexibleFields(req, res, function (err) {
    if (err) return next(err);

    // Multer sets req.files as an object when using .fields
    if (req.files && !Array.isArray(req.files)) {
      const all = [];
      Object.values(req.files).forEach((arr) => {
        if (Array.isArray(arr)) all.push(...arr);
      });
      req.files = all;
    }
    // Ensure req.files is always an array for controller logic
    if (!req.files) req.files = [];
    next();
  });
}

exports.uploadFiles = uploadFiles;
