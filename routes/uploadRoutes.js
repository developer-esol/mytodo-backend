const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const admin = require('firebase-admin');
const { db } = require('../config/firebase-admin');
const { protect } = require('../middleware/authMiddleware');

// Setup storage for uploads
const uploadPath = path.join(__dirname, '../public/uploads/chats');
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
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const allowedDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv"
    ];
    const allowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    
    const allAllowedTypes = [
      ...allowedImageTypes,
      ...allowedDocumentTypes,
      ...allowedAudioTypes,
      ...allowedVideoTypes
    ];

    if (allAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images, documents, audio, and video files are allowed.`), false);
    }
  }
});

// Upload route supporting files[] field name
router.post('/chats/:taskId/upload', protect, upload.array('files[]', 10), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { senderId, senderName, text = '' } = req.body;
    
    if (!req.files || req.files.length === 0) {
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
    
    // Save to Firebase
    const chatId = `task_${taskId}`;
    const messageData = {
      senderId,
      senderName,
      text,
      files: uploadedFiles,
      messageType: 'file',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('chats').doc(chatId)
                         .collection('messages')
                         .add(messageData);
    
    console.log(`✅ Files uploaded successfully for task ${taskId}:`, uploadedFiles.map(f => f.originalName));
    
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      messageId: docRef.id,
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files: ' + error.message
    });
  }
});

// Fallback route for standard 'files' field name
router.post('/chats/:taskId/upload-standard', protect, upload.array('files', 10), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { senderId, senderName, text = '' } = req.body;
    
    if (!req.files || req.files.length === 0) {
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
    
    // Save to Firebase
    const chatId = `task_${taskId}`;
    const messageData = {
      senderId,
      senderName,
      text,
      files: uploadedFiles,
      messageType: 'file',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('chats').doc(chatId)
                         .collection('messages')
                         .add(messageData);
    
    console.log(`✅ Files uploaded successfully (standard) for task ${taskId}:`, uploadedFiles.map(f => f.originalName));
    
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      messageId: docRef.id,
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files: ' + error.message
    });
  }
});

module.exports = router;