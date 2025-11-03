const Notification = require("../../models/notification/Notification");

const findUserNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, unreadOnly = false, type = null } = options;

  const query = { recipient: userId };

  if (unreadOnly) {
    query.isRead = false;
  }

  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return notifications;
};

const countUnreadNotifications = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

const countTotalNotifications = async (userId, query = {}) => {
  return await Notification.countDocuments({
    recipient: userId,
    ...query,
  });
};

const findNotificationById = async (notificationId, userId) => {
  return await Notification.findOne({
    _id: notificationId,
    recipient: userId,
  });
};

const updateNotificationAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: Date.now() },
    { new: true }
  );
};

const updateAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: Date.now() }
  );
};

const deleteNotificationById = async (notificationId, userId) => {
  return await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
};

const createNotification = async (notificationData) => {
  const notification = new Notification(notificationData);
  return await notification.save();
};

const getNotificationStats = async (userId) => {
  const [total, unread, byType] = await Promise.all([
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.aggregate([
      { $match: { recipient: userId } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
  ]);

  return { total, unread, read: total - unread, byType };
};

const findRecentNotifications = async (userId, limit = 5) => {
  return await Notification.find({ recipient: userId })
    .select("title type isRead createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

module.exports = {
  findUserNotifications,
  countUnreadNotifications,
  countTotalNotifications,
  findNotificationById,
  updateNotificationAsRead,
  updateAllAsRead,
  deleteNotificationById,
  createNotification,
  getNotificationStats,
  findRecentNotifications,
};
