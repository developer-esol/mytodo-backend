// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Disable caching for all notification routes to fix 304 issue
router.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

// Test endpoint for frontend debugging (no auth required) - must come before auth middleware
router.get('/test-frontend', async (req, res) => {
  try {
    // Use the service directly - same as controller uses
    const notificationService = require('../services/notificationService');
    const userId = '68d295e638cbeb79a7d7cf8e'; // Kasun's user ID
    
    const result = await notificationService.getUserNotifications(userId, {
      page: 1,
      limit: 20
    });
    
    res.json({
      success: true,
      message: 'Backend is working correctly!',
      user: {
        id: userId,
        name: 'kasun Pasan',
        email: 'janidu.ophtha@gmail.com'
      },
      notifications: {
        total: result.pagination.totalCount,
        unread: result.unreadCount,
        data: result.notifications.map(n => ({
          id: n._id,
          title: n.title,
          type: n.type,
          isRead: n.isRead,
          message: n.message,
          createdAt: n.createdAt
        }))
      },
      frontendInstructions: {
        step1: 'Call GET /api/notifications with Authorization header',
        step2: 'Parse response.data for notification list',
        step3: 'Use response.unreadCount for badge count',
        step4: 'Check browser Network tab for actual API calls',
        expectedUnreadCount: result.unreadCount,
        expectedTotalCount: result.pagination.totalCount,
        apiEndpoint: 'http://localhost:5001/api/notifications',
        unreadCountEndpoint: 'http://localhost:5001/api/notifications/unread-count'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Webhook endpoint (no auth required) - must come before auth middleware
router.post('/webhook', async (req, res) => {
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

    const notificationService = require('../services/notificationService');
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
});

// Apply authentication middleware to all other notification routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notification management for MyToDoo
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications with pagination
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only return unread notifications
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', notificationController.getStats);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * @swagger
 * /api/notifications/debug:
 *   get:
 *     summary: Debug endpoint to help identify notification count issues
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Debug information retrieved successfully
 */
router.get('/debug', notificationController.debugUserInfo);

/**
 * @swagger
 * /api/notifications/type/{type}:
 *   get:
 *     summary: Get notifications by type
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification type to filter by
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/type/:type', notificationController.getNotificationsByType);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post('/mark-all-read', notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read (Frontend compatible endpoint)
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Create a test notification (development only)
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 default: "SYSTEM_UPDATE"
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Test notification created successfully
 */
router.post('/test', notificationController.testNotification);

/**
 * @swagger
 * /api/notifications/test-sound:
 *   post:
 *     summary: Create a test notification with sound alert
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 default: OFFER_MADE
 *                 description: Notification type that triggers sound
 *               title:
 *                 type: string
 *                 default: Test Sound Alert
 *               message:
 *                 type: string
 *                 default: This is a test notification with sound alert
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 default: HIGH
 *     responses:
 *       201:
 *         description: Test sound notification created successfully
 */
router.post('/test-sound', notificationController.testSoundNotification);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch('/:notificationId/read', notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to delete
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
router.delete('/:notificationId', notificationController.deleteNotification);

// Webhook endpoint (no auth required for external systems)
/**
 * @swagger
 * /api/notifications/webhook:
 *   post:
 *     summary: Webhook endpoint for external notification triggers
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               metadata:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *               actionUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Webhook notification processed successfully
 *       400:
 *         description: Missing required fields
 */
// Webhook endpoint already defined above (before auth middleware)

module.exports = router;