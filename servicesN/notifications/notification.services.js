const notificationRepository = require("../../repository/notification/notification.repository");
const notificationService = require("../../shared/services/notificationService");

const getUserNotifications = async (userId, options) => {
  const { page, limit, unreadOnly, type } = options;

  const notifications = await notificationRepository.findUserNotifications(
    userId,
    { page, limit, unreadOnly, type }
  );

  const totalCount = await notificationRepository.countTotalNotifications(
    userId,
    unreadOnly ? { isRead: false } : type ? { type } : {}
  );

  const unreadCount = await notificationRepository.countUnreadNotifications(
    userId
  );

  const totalPages = Math.ceil(totalCount / limit);

  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    unreadCount,
  };
};

const getUnreadCount = async (userId) => {
  return await notificationRepository.countUnreadNotifications(userId);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await notificationRepository.updateNotificationAsRead(
    notificationId,
    userId
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  return await notificationRepository.updateAllAsRead(userId);
};

const deleteNotification = async (notificationId, userId) => {
  return await notificationRepository.deleteNotificationById(
    notificationId,
    userId
  );
};

const getNotificationStats = async (userId) => {
  return await notificationRepository.getNotificationStats(userId);
};

const createNotification = async (notificationData) => {
  return await notificationService.createNotification(notificationData);
};

const getDebugInfo = async (userId, userEmail) => {
  const totalCount = await notificationRepository.countTotalNotifications(
    userId
  );
  const unreadCount = await notificationRepository.countUnreadNotifications(
    userId
  );
  const readCount = totalCount - unreadCount;

  const recentNotifications =
    await notificationRepository.findRecentNotifications(userId, 5);

  return {
    timestamp: new Date().toISOString(),
    user: {
      id: userId,
      email: userEmail,
      tokenValid: true,
    },
    notifications: {
      total: totalCount,
      unread: unreadCount,
      read: readCount,
    },
    recentNotifications: recentNotifications.map((n) => ({
      title: n.title,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    frontendChecklist: {
      API_ENDPOINT_CORRECT: "Check if calling /api/notifications/unread-count",
      JWT_TOKEN_VALID: "Verify JWT token is valid and belongs to this user",
      RESPONSE_PARSING: "Check if parsing response.data.unreadCount correctly",
      USER_ID_MATCH: "Verify user ID in token matches expected user",
    },
    expectedResponse: {
      success: true,
      unreadCount: unreadCount,
    },
  };
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createNotification,
  getDebugInfo,
};
