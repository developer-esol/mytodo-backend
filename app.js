const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const app = express();

// Enable CORS for all routes in development
app.use(cors());

// Additional headers for better CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Increase header size limit to handle larger requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const taskRoutes = require("./routes/TaskRoutes");
const userAuthRoutes = require("./routes/UserRoutes"); // Regular authentication
const authRoutes = require("./routes/Auth_fixed"); // Updated auth routes with password reset
const twoFactorAuthRoutes = require("./routes/TwoFactorAuth");
const paymentRoutes = require("./routes/paymentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const firebaseRoutes = require("./routes/firebaseRoutes");
const serviceFeeRoutes = require("./routes/serviceFeeRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutesSimple");
const reviewRoutes = require("./routes/reviewRoutes");
const userReviewRoutes = require("./routes/userReviewRoutes");

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  })
);

// Rest of middleware
app.use(helmet());
app.use(morgan("dev"));

// Serve static files from public directory with CORS headers
app.use('/images', cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
}), express.static(path.join(__dirname, 'public/images')));

// Serve uploaded chat files
app.use('/uploads', cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
}), express.static(path.join(__dirname, 'public/uploads')));

app.use(express.static(path.join(__dirname, 'public')));

// Handle preflight requests explicitly
app.options('*', cors());

// Middleware to handle large headers gracefully
app.use((req, res, next) => {
  // Check if headers are too large (rough estimation)
  const headerString = JSON.stringify(req.headers);
  if (headerString.length > 8192) { // 8KB limit
    console.log('Headers too large, attempting to reduce payload size');
  }
  next();
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/tasks", taskRoutes); // Standard task routes
app.use("/api/post-task", taskRoutes); // Legacy task creation route
app.use("/api/users", userAuthRoutes); // User profile routes
app.use("/api/auth", userAuthRoutes); // Regular auth routes (login, etc.)
app.use("/api/auth", authRoutes); // Password reset and Google auth routes
app.use("/api/two-factor-auth", twoFactorAuthRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ChatApp", chatRoutes);
app.use("/api", firebaseRoutes); // Firebase routes for messaging - more specific paths first

// Add simple upload route directly in app.js for files[] field compatibility
const multer = require('multer');
const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public/uploads/chats', req.params.taskId || 'general');
    if (!require('fs').existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = require('crypto').randomBytes(16).toString("hex") + ext;
    cb(null, filename);
  }
});

const fileUpload = multer({
  storage: uploadStorage,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 }
}).array('files[]', 10);

app.post('/api/chats/:taskId/upload', (req, res) => {
  fileUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/chats/${req.params.taskId}/${file.filename}`
    }));
    
    console.log(`✅ Files uploaded for task ${req.params.taskId}:`, uploadedFiles.map(f => f.originalName));
    res.json({ success: true, message: 'Files uploaded successfully', files: uploadedFiles });
  });
});
app.use("/api/service-fee", serviceFeeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", reviewRoutes); // Task-based review routes (legacy)
app.use("/api", userReviewRoutes); // User-based review routes (new system)

// swagger integration
const swaggerDocs = require("./swagger");
swaggerDocs(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

module.exports = app;
