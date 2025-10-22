// Simple server for upload testing
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import our chat upload middleware
const { uploadChatFiles, uploadSingleFile, handleUploadError } = require('./middleware/chatUploadMiddleware');

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Chat upload server running!', timestamp: new Date() });
});

// Firebase routes - just the upload parts
const firebaseRoutes = require("./routes/firebaseRoutes");
app.use("/api", firebaseRoutes);

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;

app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    return;
  }
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/chats/:taskId/upload`);
});

app.on('error', (err) => {
  console.error('❌ Server error:', err);
});