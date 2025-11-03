// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../../../controllers/notifications/notification.controller");
const { protect } = require("../../../middleware/authMiddleware");
const validators = require("../../../validators/v1/notifications/notifications.validator");

// Disable caching for all notification routes to fix 304 issue
router.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  next();
});

// Test endpoint for frontend debugging (no auth required) - must come before auth middleware
router.get("/test-frontend", async (req, res) => {
  try {
    // Use the service directly - same as controller uses
    const notificationService = require("../../../shared/services/notificationService");
    const userId = "68d295e638cbeb79a7d7cf8e"; // Kasun's user ID

    const result = await notificationService.getUserNotifications(userId, {
      page: 1,
      limit: 20,
    });

    res.json({
      success: true,
      message: "Backend is working correctly!",
      user: {
        id: userId,
        name: "kasun Pasan",
        email: "janidu.ophtha@gmail.com",
      },
      notifications: {
        total: result.pagination.totalCount,
        unread: result.unreadCount,
        data: result.notifications.map((n) => ({
          id: n._id,
          title: n.title,
          type: n.type,
          isRead: n.isRead,
          message: n.message,
          createdAt: n.createdAt,
        })),
      },
      frontendInstructions: {
        step1: "Call GET /api/notifications with Authorization header",
        step2: "Parse response.data for notification list",
        step3: "Use response.unreadCount for badge count",
        step4: "Check browser Network tab for actual API calls",
        expectedUnreadCount: result.unreadCount,
        expectedTotalCount: result.pagination.totalCount,
        apiEndpoint: "http://localhost:5001/api/notifications",
        unreadCountEndpoint:
          "http://localhost:5001/api/notifications/unread-count",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Test endpoint failed",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Webhook endpoint (no auth required) - must come before auth middleware
router.post("/webhook", ...validators.webhookNotification, async (req, res) => {
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

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, type, title, message",
      });
    }

    const notificationService = require("../services/notificationService");
    const notification = await notificationService.createNotification({
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
    console.error("Error processing webhook notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process webhook notification",
      error: error.message,
    });
  }
});

// Apply authentication middleware to all other notification routes
router.use(protect);

// Get user notifications with pagination
router.get(
  "/",
  ...validators.getNotifications,
  notificationController.getNotifications
);

// Get count of unread notifications
router.get("/unread-count", notificationController.getUnreadCount);

// Get notification statistics
router.get("/stats", notificationController.getStats);

// Get user notification preferences
router.get("/preferences", notificationController.getPreferences);

// Debug endpoint to help identify notification count issues
router.get("/debug", notificationController.debugUserInfo);

// Get notifications by type
router.get(
  "/type/:type",
  ...validators.getNotificationsByType,
  notificationController.getNotificationsByType
);

// Mark all notifications as read
router.post("/mark-all-read", notificationController.markAllAsRead);

// Mark all notifications as read (Frontend compatible endpoint)
router.put("/read-all", notificationController.markAllAsRead);

// Create a test notification (development only)
router.post(
  "/test",
  ...validators.testNotification,
  notificationController.testNotification
);

// Create a test notification with sound alert
router.post(
  "/test-sound",
  ...validators.testSoundNotification,
  notificationController.testSoundNotification
);

// Mark a specific notification as read
router.patch(
  "/:notificationId/read",
  ...validators.validateNotificationId,
  notificationController.markAsRead
);

// Delete a notification
router.delete(
  "/:notificationId",
  ...validators.validateNotificationId,
  notificationController.deleteNotification
);

module.exports = router;
