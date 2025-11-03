const notificationServiceN = require("../../servicesN/notifications/notification.services");
const notificationService = require("../../shared/services/notificationService");
const logger = require("../../config/logger");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false, type = null } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === "true",
      type: type || null,
    };

    const result = await notificationServiceN.getUserNotifications(
      userId,
      options
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    logger.info(`🔔 Fetching unread count for user: ${userEmail} (${userId})`);

    const unreadCount = await notificationServiceN.getUnreadCount(userId);

    logger.info(`📊 User ${userEmail} has ${unreadCount} unread notifications`);

    res.status(200).json({
      success: true,
      unreadCount,
      meta: {
        userId: userId.toString(),
        userEmail: userEmail,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
      meta: {
        userId: req.user?._id?.toString() || "UNKNOWN",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await notificationServiceN.markAsRead(
      notificationId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message:
        error.message === "Notification not found"
          ? error.message
          : "Failed to mark notification as read",
      error: error.message,
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await notificationServiceN.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const deletedNotification = await notificationServiceN.deleteNotification(
      notificationId,
      userId
    );

    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await notificationServiceN.getNotificationStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching notification stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification statistics",
      error: error.message,
    });
  }
};

exports.getNotificationsByType = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type.toUpperCase(),
    };

    const result = await notificationServiceN.getUserNotifications(
      userId,
      options
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error("Error fetching notifications by type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications by type",
      error: error.message,
    });
  }
};

exports.testNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = "SYSTEM_UPDATE", title, message } = req.body;

    const notification = await notificationServiceN.createNotification({
      recipient: userId,
      type: type.toUpperCase(),
      title: title || "Test Notification",
      message:
        message ||
        "This is a test notification to verify the system is working.",
      priority: "NORMAL",
      actionUrl: "/dashboard",
    });

    res.status(201).json({
      success: true,
      message: "Test notification created successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Error creating test notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test notification",
      error: error.message,
    });
  }
};

exports.testSoundNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      type = "OFFER_MADE",
      title = "Test Sound Alert",
      message = "This is a test notification with sound alert!",
      priority = "HIGH",
    } = req.body;

    const notification = await notificationServiceN.createNotification({
      recipient: userId,
      type: type.toUpperCase(),
      title,
      message,
      priority: priority.toUpperCase(),
      actionUrl: "/dashboard",
      metadata: {
        testNotification: true,
        soundEnabled: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Test sound notification created successfully",
      data: {
        ...notification.toObject(),
        playSound: true,
        soundType: "notification_alert",
      },
    });
  } catch (error) {
    logger.error("Error creating test sound notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test sound notification",
      error: error.message,
    });
  }
};

exports.webhook = async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      metadata = {},
      priority = "NORMAL",
      actionUrl,
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, type, title, message",
      });
    }

    const notification = await notificationServiceN.createNotification({
      recipient: userId,
      type: type.toUpperCase(),
      title,
      message,
      metadata,
      priority: priority.toUpperCase(),
      actionUrl,
    });

    res.status(201).json({
      success: true,
      message: "Webhook notification processed successfully",
      data: notification,
    });
  } catch (error) {
    logger.error("Error processing webhook notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process webhook notification",
      error: error.message,
    });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const preferences = {
      email: {
        OFFER_MADE: true,
        OFFER_ACCEPTED: true,
        TASK_COMPLETED: true,
        PAYMENT_RECEIVED: true,
        MESSAGE_RECEIVED: false,
      },
      push: {
        OFFER_MADE: true,
        OFFER_ACCEPTED: true,
        TASK_COMPLETED: true,
        PAYMENT_RECEIVED: true,
        MESSAGE_RECEIVED: true,
      },
      inApp: {
        OFFER_MADE: true,
        OFFER_ACCEPTED: true,
        TASK_COMPLETED: true,
        PAYMENT_RECEIVED: true,
        MESSAGE_RECEIVED: true,
        SYSTEM_UPDATE: true,
      },
    };

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error("Error fetching notification preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification preferences",
      error: error.message,
    });
  }
};

exports.debugUserInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const debug = await notificationServiceN.getDebugInfo(userId, userEmail);

    res.status(200).json({
      success: true,
      debug,
    });
  } catch (error) {
    logger.error("Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Debug endpoint failed",
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        userId: req.user?._id || "NOT_FOUND",
        errorDetails: error.stack,
      },
    });
  }
};


