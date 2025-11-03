// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Who should receive the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Who triggered the notification (optional)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification type for categorization and handling
  type: {
    type: String,
    enum: [
      'TASK_POSTED',           // When a new task is posted
      'OFFER_MADE',            // When someone makes an offer on your task
      'OFFER_ACCEPTED',        // When your offer is accepted
      'OFFER_REJECTED',        // When your offer is rejected
      'TASK_ASSIGNED',         // When task is assigned to you
      'TASK_COMPLETED',        // When task is marked as completed
      'PAYMENT_RECEIVED',      // When payment is processed
      'RECEIPT_READY',         // When receipt is available for download
      'MESSAGE_RECEIVED',      // When you receive a chat message
      'TASK_CANCELLED',        // When task is cancelled
      'TASK_OVERDUE',          // When task becomes overdue
      'SYSTEM_UPDATE',         // System-wide updates
      'PROFILE_UPDATE',        // Profile-related notifications
      'VERIFICATION_UPDATE'    // ID verification updates
    ],
    required: true,
    index: true
  },
  
  // Notification title (short description)
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  // Detailed message
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Related entities for navigation
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  
  relatedOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  relatedChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  
  // Navigation URL for frontend
  actionUrl: {
    type: String
  },
  
  // Additional data for the notification
  metadata: {
    taskTitle: String,
    offerAmount: Number,
    currency: String,
    senderName: String,
    senderAvatar: String,
    customData: mongoose.Schema.Types.Mixed
  },
  
  // Notification status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isDelivered: {
    type: Boolean,
    default: false
  },
  
  // Priority level for sorting and display
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  
  // Delivery channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // Delivery tracking
  deliveredAt: Date,
  readAt: Date,
  
  // Expiration date (optional)
  expiresAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, type: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Virtual for time ago
NotificationSchema.virtual('timeAgo').get(function() {
  if (!this.createdAt) return 'Unknown time';
  
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Mark notification as read
NotificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Mark notification as delivered
NotificationSchema.methods.markAsDelivered = function() {
  if (!this.isDelivered) {
    this.isDelivered = true;
    this.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Notification', NotificationSchema);