// Simple server for testing upload functionality without dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3005;

// CORS and basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Setup storage for uploads
const uploadPath = path.join(__dirname, 'public/uploads/chats');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const taskId = req.params.taskId || 'general';
    const taskUploadPath = path.join(uploadPath, taskId);
    
    if (!fs.existsSync(taskUploadPath)) {
      fs.mkdirSync(taskUploadPath, { recursive: true });
    }
    
    cb(null, taskUploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 10
  }
});

// Simple health check
app.get('/', (req, res) => {
  res.json({ message: 'Simple upload server is running', port: PORT });
});

// Upload route supporting files[] field name (without auth for testing)
app.post('/api/chats/:taskId/upload', upload.array('files[]', 10), async (req, res) => {
  try {
    console.log('📁 Upload request received for task:', req.params.taskId);
    console.log('📊 Number of files received:', req.files?.length || 0);
    
    const { taskId } = req.params;
    const { senderId, senderName, text = '' } = req.body;
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    // Create file info for response
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/chats/${taskId}/${file.filename}`,
      type: file.mimetype.startsWith('image/') ? 'image' : 
            file.mimetype.startsWith('video/') ? 'video' :
            file.mimetype.startsWith('audio/') ? 'audio' : 'file'
    }));
    
    console.log('✅ Files uploaded successfully:', uploadedFiles.map(f => f.originalName));
    
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      info: {
        taskId,
        senderId,
        senderName,
        text
      }
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files: ' + error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple upload server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadPath}`);
});