// controllers/notificationController.js
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

class NotificationController {

  /**
   * Get user notifications with pagination
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true',
        type: type || null
      };

      const result = await notificationService.getUserNotifications(userId, options);

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user._id;
      const userEmail = req.user.email;

      console.log(`🔔 Fetching unread count for user: ${userEmail} (${userId})`);

      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });

      console.log(`📊 User ${userEmail} has ${unreadCount} unread notifications`);

      res.status(200).json({
        success: true,
        unreadCount,
        meta: {
          userId: userId.toString(),
          userEmail: userEmail,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message,
        meta: {
          userId: req.user?._id?.toString() || 'UNKNOWN',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user._id;
      const { notificationId } = req.params;

      const notification = await notificationService.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: error.message === 'Notification not found' ? error.message : 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user._id;

      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `Marked ${result.modifiedCount} notifications as read`
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req, res) {
    try {
      const userId = req.user._id;
      const { notificationId } = req.params;

      const deletedNotification = await notificationService.deleteNotification(notificationId, userId);

      if (!deletedNotification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(req, res) {
    try {
      const userId = req.user._id;

      const stats = await notificationService.getNotificationStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification statistics',
        error: error.message
      });
    }
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(req, res) {
    try {
      const userId = req.user._id;
      const { type } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        type: type.toUpperCase()
      };

      const result = await notificationService.getUserNotifications(userId, options);

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error fetching notifications by type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications by type',
        error: error.message
      });
    }
  }

  /**
   * Test notification endpoint (for development)
   */
  async testNotification(req, res) {
    try {
      const userId = req.user._id;
      const { type = 'SYSTEM_UPDATE', title, message } = req.body;

      const notification = await notificationService.createNotification({
        recipient: userId,
        type: type.toUpperCase(),
        title: title || 'Test Notification',
        message: message || 'This is a test notification to verify the system is working.',
        priority: 'NORMAL',
        actionUrl: '/dashboard'
      });

      res.status(201).json({
        success: true,
        message: 'Test notification created successfully',
        data: notification
      });

    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test notification',
        error: error.message
      });
    }
  }

  /**
   * Test sound notification endpoint (for development)
   */
  async testSoundNotification(req, res) {
    try {
      const userId = req.user._id;
      const { 
        type = 'OFFER_MADE', 
        title = 'Test Sound Alert', 
        message = 'This is a test notification with sound alert!',
        priority = 'HIGH'
      } = req.body;

      const notification = await notificationService.createNotification({
        recipient: userId,
        type: type.toUpperCase(),
        title,
        message,
        priority: priority.toUpperCase(),
        actionUrl: '/dashboard',
        metadata: {
          testNotification: true,
          soundEnabled: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Test sound notification created successfully',
        data: {
          ...notification.toObject(),
          playSound: true,
          soundType: 'notification_alert'
        }
      });

    } catch (error) {
      console.error('Error creating test sound notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test sound notification',
        error: error.message
      });
    }
  }

  /**
   * Webhook endpoint for external notifications
   */
  async webhook(req, res) {
    try {
      const { 
        userId, 
        type, 
        title, 
        message, 
        metadata = {},
        priority = 'NORMAL',
        actionUrl 
      } = req.body;

      // Validate required fields
      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, type, title, message'
        });
      }

      const notification = await notificationService.createNotification({
        recipient: userId,
        type: type.toUpperCase(),
        title,
        message,
        metadata,
        priority: priority.toUpperCase(),
        actionUrl
      });

      res.status(201).json({
        success: true,
        message: 'Webhook notification processed successfully',
        data: notification
      });

    } catch (error) {
      console.error('Error processing webhook notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook notification',
        error: error.message
      });
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(req, res) {
    try {
      const userId = req.user._id;

      // In a real app, you'd fetch from a UserPreferences model
      // For now, return default preferences
      const preferences = {
        email: {
          OFFER_MADE: true,
          OFFER_ACCEPTED: true,
          TASK_COMPLETED: true,
          PAYMENT_RECEIVED: true,
          MESSAGE_RECEIVED: false
        },
        push: {
          OFFER_MADE: true,
          OFFER_ACCEPTED: true,
          TASK_COMPLETED: true,
          PAYMENT_RECEIVED: true,
          MESSAGE_RECEIVED: true
        },
        inApp: {
          OFFER_MADE: true,
          OFFER_ACCEPTED: true,
          TASK_COMPLETED: true,
          PAYMENT_RECEIVED: true,
          MESSAGE_RECEIVED: true,
          SYSTEM_UPDATE: true
        }
      };

      res.status(200).json({
        success: true,
        data: preferences
      });

    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification preferences',
        error: error.message
      });
    }
  }

  /**
   * Debug endpoint to help frontend developers identify notification count issues
   */
  async debugUserInfo(req, res) {
    try {
      const userId = req.user._id;
      const userEmail = req.user.email;

      // Get notification counts
      const totalCount = await Notification.countDocuments({ recipient: userId });
      const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
      const readCount = totalCount - unreadCount;

      // Get recent notifications
      const recentNotifications = await Notification.find({ recipient: userId })
        .select('title type isRead createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      // Get user info from token
      const userInfo = {
        id: userId,
        email: userEmail,
        tokenValid: true
      };

      res.status(200).json({
        success: true,
        debug: {
          timestamp: new Date().toISOString(),
          user: userInfo,
          notifications: {
            total: totalCount,
            unread: unreadCount,
            read: readCount
          },
          recentNotifications: recentNotifications.map(n => ({
            title: n.title,
            type: n.type,
            isRead: n.isRead,
            createdAt: n.createdAt
          })),
          frontendChecklist: {
            'API_ENDPOINT_CORRECT': 'Check if calling /api/notifications/unread-count',
            'JWT_TOKEN_VALID': 'Verify JWT token is valid and belongs to this user',
            'RESPONSE_PARSING': 'Check if parsing response.data.unreadCount correctly',
            'USER_ID_MATCH': 'Verify user ID in token matches expected user'
          },
          expectedResponse: {
            success: true,
            unreadCount: unreadCount
          }
        }
      });

    } catch (error) {
      console.error('Error in debug endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Debug endpoint failed',
        error: error.message,
        debug: {
          timestamp: new Date().toISOString(),
          userId: req.user?._id || 'NOT_FOUND',
          errorDetails: error.stack
        }
      });
    }
  }
}

module.exports = new NotificationController();