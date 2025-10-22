const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    // Chat identification
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true
    },
    chatId: {
      type: String,
      required: true,
      index: true // Format: task_${taskId}
    },
    
    // Message content
    text: {
      type: String,
      trim: true
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio", "video"],
      default: "text",
      required: true
    },
    
    // Sender information
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    
    // File attachments (for images, files, etc.)
    attachments: [{
      fileName: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileType: {
        type: String,
        required: true // image/jpeg, application/pdf, etc.
      },
      fileSize: {
        type: Number,
        required: true // in bytes
      },
      thumbnailUrl: {
        type: String // for images/videos
      }
    }],
    
    // Message status
    isRead: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    
    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    editedAt: {
      type: Date
    },
    deletedAt: {
      type: Date
    },
    
    // Firebase sync
    firebaseId: {
      type: String,
      sparse: true // Firebase document ID for sync
    },
    syncedToFirebase: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create compound indexes for efficient queries
MessageSchema.index({ taskId: 1, timestamp: 1 });
MessageSchema.index({ chatId: 1, timestamp: 1 });
MessageSchema.index({ senderId: 1, timestamp: -1 });

// Virtual for formatted timestamp
MessageSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Method to check if message has attachments
MessageSchema.methods.hasAttachments = function() {
  return this.attachments && this.attachments.length > 0;
};

// Method to get file types in attachments
MessageSchema.methods.getAttachmentTypes = function() {
  if (!this.hasAttachments()) return [];
  return this.attachments.map(att => att.fileType);
};

// Static method to find messages by chat
MessageSchema.statics.findByChat = function(chatId, limit = 50, offset = 0) {
  return this.find({ 
    chatId: chatId,
    isDeleted: false 
  })
  .populate('senderId', 'firstName lastName avatar')
  .sort({ timestamp: 1 })
  .skip(offset)
  .limit(limit);
};

// Static method to find recent messages for a task
MessageSchema.statics.findRecentByTask = function(taskId, limit = 20) {
  return this.find({ 
    taskId: taskId,
    isDeleted: false 
  })
  .populate('senderId', 'firstName lastName avatar')
  .sort({ timestamp: -1 })
  .limit(limit);
};

module.exports = mongoose.model("Message", MessageSchema);