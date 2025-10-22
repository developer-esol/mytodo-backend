# Chat File Upload API Documentation

## Overview

This API provides comprehensive file upload functionality for chat messages in the Air Task system. It supports images, documents, audio, and video files with proper integration between MongoDB and Firebase for both persistence and real-time functionality.

## Features

- **Multiple File Types**: Images, documents, audio, and video files
- **Dual Storage**: AWS S3 (production) or local storage (development)
- **Database Integration**: MongoDB for persistence, Firebase for real-time sync
- **File Validation**: Type checking, size limits, and security
- **Comprehensive Error Handling**: Detailed error messages and recovery
- **Authentication**: JWT-based authentication for upload endpoints

## API Endpoints

### 1. Send Text Message
```
POST /api/chats/{taskId}/messages
```

**Description**: Send a text-only message to a chat

**Request Body**:
```json
{
  "text": "Hello, this is a message!",
  "senderId": "user_object_id",
  "senderName": "John Doe"
}
```

**Response**:
```json
{
  "id": "firebase_document_id",
  "mongoId": "mongodb_object_id", 
  "message": "Message sent successfully"
}
```

### 2. Upload Multiple Files
```
POST /api/chats/{taskId}/upload
Authorization: Bearer <jwt_token>
```

**Description**: Upload multiple files (up to 10) with a message

**Request Body** (multipart/form-data):
- `files`: Array of files (max 10 files, 25MB each)
- `senderId`: String - User ID of sender
- `senderName`: String - Display name of sender
- `text`: String (optional) - Message text

**Response**:
```json
{
  "success": true,
  "id": "firebase_document_id",
  "mongoId": "mongodb_object_id",
  "message": "Files uploaded successfully",
  "attachments": [
    {
      "fileName": "unique_filename.jpg",
      "originalName": "photo.jpg",
      "fileUrl": "https://s3.amazonaws.com/bucket/path/to/file.jpg",
      "fileType": "image/jpeg",
      "fileSize": 1048576
    }
  ],
  "fileCount": 1
}
```

### 3. Upload Single File
```
POST /api/chats/{taskId}/upload-single
Authorization: Bearer <jwt_token>
```

**Description**: Upload a single file with a message

**Request Body** (multipart/form-data):
- `file`: Single file (max 25MB)
- `senderId`: String - User ID of sender
- `senderName`: String - Display name of sender
- `text`: String (optional) - Message text

**Response**:
```json
{
  "success": true,
  "id": "firebase_document_id",
  "mongoId": "mongodb_object_id",
  "message": "File uploaded successfully",
  "attachment": {
    "fileName": "unique_filename.pdf",
    "originalName": "document.pdf",
    "fileUrl": "https://s3.amazonaws.com/bucket/path/to/file.pdf",
    "fileType": "application/pdf",
    "fileSize": 2097152
  },
  "messageType": "file"
}
```

### 4. Get Messages
```
GET /api/chats/{taskId}/messages?limit=50&offset=0
```

**Description**: Retrieve chat messages with file attachments

**Query Parameters**:
- `limit`: Number of messages to return (default: 50)
- `offset`: Number of messages to skip (default: 0)

**Response**:
```json
[
  {
    "id": "message_id",
    "text": "Check out this image!",
    "senderId": "user_id",
    "senderName": "John Doe",
    "timestamp": "2024-10-15T10:30:00.000Z",
    "messageType": "image",
    "attachments": [
      {
        "fileName": "unique_filename.jpg",
        "originalName": "vacation.jpg",
        "fileUrl": "https://s3.amazonaws.com/bucket/path/to/file.jpg",
        "fileType": "image/jpeg",
        "fileSize": 1048576
      }
    ],
    "hasAttachments": true,
    "isRead": false,
    "isEdited": false
  }
]
```

### 5. Get Chat Statistics
```
GET /api/chats/{taskId}/stats
```

**Description**: Get statistics about a chat including message counts and recent activity

**Response**:
```json
{
  "taskId": "task_object_id",
  "chatId": "task_task_object_id",
  "totalMessages": 45,
  "messagesWithFiles": 12,
  "recentMessages": [
    {
      "id": "message_id",
      "text": "Latest message",
      "senderName": "Jane Doe",
      "timestamp": "2024-10-15T10:30:00.000Z",
      "messageType": "text",
      "hasAttachments": false
    }
  ]
}
```

## Supported File Types

### Images
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)

### Documents
- PDF (`application/pdf`)
- Word Documents (`application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- Excel Files (`application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- Plain Text (`text/plain`)
- CSV (`text/csv`)

### Audio
- MP3 (`audio/mpeg`)
- WAV (`audio/wav`)
- OGG (`audio/ogg`)

### Video
- MP4 (`video/mp4`)
- WebM (`video/webm`)
- OGG (`video/ogg`)

## File Limits

- **Maximum File Size**: 25MB per file
- **Maximum Files per Upload**: 10 files
- **Total Upload Size**: No specific limit, but individual file limits apply

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "error": "File too large. Maximum size is 25MB."
}
```

**400 Bad Request - Invalid File Type**:
```json
{
  "success": false,
  "error": "Invalid file type: application/exe. Only images, documents, audio, and video files are allowed."
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Access denied. Please provide a valid token."
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Upload failed: AWS S3 connection error"
}
```

## Frontend Integration Examples

### JavaScript/Fetch API

```javascript
// Upload single file
async function uploadFile(taskId, file, userId, userName) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('senderId', userId);
  formData.append('senderName', userName);
  formData.append('text', 'Sending you this file!');

  try {
    const response = await fetch(`/api/chats/${taskId}/upload-single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      console.log('File uploaded successfully:', result);
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Upload multiple files
async function uploadMultipleFiles(taskId, files, userId, userName) {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('senderId', userId);
  formData.append('senderName', userName);
  formData.append('text', `Uploading ${files.length} files`);

  try {
    const response = await fetch(`/api/chats/${taskId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Multiple file upload failed:', error);
    throw error;
  }
}
```

### React Example

```jsx
import React, { useState } from 'react';

function ChatFileUpload({ taskId, userId, userName, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('senderId', userId);
      formData.append('senderName', userName);

      const response = await fetch(`/api/chats/${taskId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        onUploadSuccess(result);
        setSelectedFiles([]);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="chat-file-upload">
      <input
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <p>Selected files:</p>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={uploading || selectedFiles.length === 0}
      >
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>
    </div>
  );
}

export default ChatFileUpload;
```

## Testing

Use the provided test script to verify functionality:

```bash
node test-chat-upload.js
```

This will run comprehensive tests including:
- Text message sending
- Single file upload
- Multiple file upload
- Message retrieval
- Error handling
- Database integration verification

## Environment Configuration

Ensure these environment variables are set:

```env
# AWS S3 Configuration (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/your_database

# JWT Configuration
JWT_SECRET=your_jwt_secret
```

## Database Schema

The system uses a MongoDB `Message` model with the following structure:

```javascript
{
  _id: ObjectId,
  taskId: ObjectId,           // Reference to Task
  chatId: String,             // Format: "task_{taskId}"
  text: String,
  messageType: String,        // "text", "image", "file", "audio", "video"
  senderId: ObjectId,         // Reference to User
  senderName: String,
  attachments: [{
    fileName: String,         // Unique filename
    originalName: String,     // Original uploaded filename
    fileUrl: String,          // S3 URL or local path
    fileType: String,         // MIME type
    fileSize: Number,         // Size in bytes
    thumbnailUrl: String      // Optional thumbnail URL
  }],
  isRead: Boolean,
  isEdited: Boolean,
  isDeleted: Boolean,
  timestamp: Date,
  firebaseId: String,         // Firebase document ID
  syncedToFirebase: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

1. **Authentication**: All upload endpoints require JWT authentication
2. **File Validation**: File types and sizes are strictly validated
3. **Path Security**: Files are stored with random names to prevent directory traversal
4. **Error Handling**: Sensitive information is not exposed in error messages
5. **Rate Limiting**: Consider implementing rate limiting for upload endpoints

## Future Enhancements

1. **Thumbnail Generation**: Automatic thumbnail generation for images and videos
2. **Progress Tracking**: Upload progress callbacks for large files
3. **File Compression**: Automatic image compression for large files
4. **Virus Scanning**: Integration with antivirus scanning services
5. **CDN Integration**: CloudFront or similar CDN for faster file delivery