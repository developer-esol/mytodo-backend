// services/notificationService.js
const mongoose = require("mongoose");
const Notification = require("../../models/notification/Notification");
const User = require("../../models/user/User");
const Task = require("../../models/task/Task");
const Offer = require("../../models/task/Offer");
const logger = require("../../config/logger");

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Trigger real-time notification via webhook
      this.sendWebhookNotification(notification);

      return notification;
    } catch (error) {
      logger.error("Error creating notification:", {
      service: "notificationService",
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Send webhook notification for real-time updates
   */
  async sendWebhookNotification(notification) {
    try {
      // Populate the notification with user data
      await notification.populate("recipient sender relatedTask relatedOffer");

      // Determine if sound should be played based on notification priority and type
      const shouldPlaySound = this.shouldPlaySound(
        notification.type,
        notification.priority
      );

      // Emit to connected websocket clients using socket.io
      if (global.io) {
        global.io
          .to(`user_${notification.recipient._id}`)
          .emit("notification", {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
            actionUrl: notification.actionUrl,
            priority: notification.priority,
            playSound: shouldPlaySound, // This tells frontend to play sound
            isRead: notification.isRead,
          });

        logger.info(
          `Real-time notification sent to user ${notification.recipient._id}`,
          {
            type: notification.type,
            playSound: shouldPlaySound,
            userId: notification.recipient._id,
          }
        );
      } else {
        logger.warn(
          `Socket.io not available - notification created but not broadcast`,
          {
            type: notification.type,
            userId: notification.recipient?._id,
          }
        );
      }

      logger.debug(
        `Webhook notification sent for user ${notification.recipient._id}`,
        {
          type: notification.type,
        }
      );
    } catch (error) {
      logger.error("Error sending webhook notification:", {
      service: "notificationService",
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Determine if sound should be played for notification
   */
  shouldPlaySound(type, priority) {
    // Always play sound for high priority notifications
    if (priority === "HIGH" || priority === "URGENT") {
      return true;
    }

    // Play sound for specific important notification types
    const soundEnabledTypes = [
      "OFFER_MADE",
      "OFFER_ACCEPTED",
      "PAYMENT_RECEIVED",
      "MESSAGE_RECEIVED",
      "TASK_ASSIGNED",
      "TASK_COMPLETED",
    ];

    return soundEnabledTypes.includes(type);
  }

  /**
   * Create notification when a task is posted
   */
  async notifyTaskPosted(task, poster) {
    const notification = {
      recipient: poster._id,
      type: "TASK_POSTED",
      title: "Task Posted Successfully",
      message: `Your task "${task.title}" has been posted and is now visible to taskers.`,
      relatedTask: task._id,
      actionUrl: `/tasks/${task._id}`,
      metadata: {
        taskTitle: task.title,
        taskCategory: task.category,
      },
      priority: "NORMAL",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when an offer is made on a task
   */
  async notifyOfferMade(offer, task, tasker, poster) {
    const notification = {
      recipient: poster._id,
      sender: tasker._id,
      type: "OFFER_MADE",
      title: "New Offer Received",
      message: `${tasker.firstName || "A tasker"} made an offer of $${
        offer.amount
      } for your task "${task.title}".`,
      relatedTask: task._id,
      relatedOffer: offer._id,
      actionUrl: `/tasks/${task._id}/offers`,
      metadata: {
        taskTitle: task.title,
        offerAmount: offer.amount,
        currency: offer.currency || "USD",
        senderName: `${tasker.firstName} ${tasker.lastName}`,
        senderAvatar: tasker.avatar,
      },
      priority: "HIGH",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when an offer is accepted
   */
  async notifyOfferAccepted(offer, task, tasker, poster) {
    const notification = {
      recipient: tasker._id,
      sender: poster._id,
      type: "OFFER_ACCEPTED",
      title: "Offer Accepted!",
      message: `Congratulations! Your offer of $${offer.amount} for "${task.title}" has been accepted.`,
      relatedTask: task._id,
      relatedOffer: offer._id,
      actionUrl: `/tasks/${task._id}`,
      metadata: {
        taskTitle: task.title,
        offerAmount: offer.amount,
        currency: offer.currency || "USD",
        senderName: `${poster.firstName} ${poster.lastName}`,
        senderAvatar: poster.avatar,
      },
      priority: "HIGH",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when an offer is rejected
   */
  async notifyOfferRejected(offer, task, tasker, poster) {
    const notification = {
      recipient: tasker._id,
      sender: poster._id,
      type: "OFFER_REJECTED",
      title: "Offer Not Selected",
      message: `Your offer for "${task.title}" was not selected. Keep trying!`,
      relatedTask: task._id,
      relatedOffer: offer._id,
      actionUrl: `/tasks/browse`,
      metadata: {
        taskTitle: task.title,
        offerAmount: offer.amount,
        currency: offer.currency || "USD",
      },
      priority: "NORMAL",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when task is assigned
   */
  async notifyTaskAssigned(task, tasker) {
    const notification = {
      recipient: tasker._id,
      type: "TASK_ASSIGNED",
      title: "Task Assigned to You",
      message: `You've been assigned to work on "${task.title}". Start working now!`,
      relatedTask: task._id,
      actionUrl: `/tasks/${task._id}`,
      metadata: {
        taskTitle: task.title,
        taskDeadline: task.deadline,
      },
      priority: "HIGH",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when task is completed
   */
  async notifyTaskCompleted(task, tasker, poster) {
    // Notify the poster
    const posterNotification = {
      recipient: poster._id,
      sender: tasker._id,
      type: "TASK_COMPLETED",
      title: "Task Completed",
      message: `${tasker.firstName || "The tasker"} has marked "${
        task.title
      }" as completed. Please review the work.`,
      relatedTask: task._id,
      actionUrl: `/tasks/${task._id}/review`,
      metadata: {
        taskTitle: task.title,
        senderName: `${tasker.firstName} ${tasker.lastName}`,
      },
      priority: "HIGH",
    };

    // Notify the tasker
    const taskerNotification = {
      recipient: tasker._id,
      type: "TASK_COMPLETED",
      title: "Task Submitted",
      message: `You've successfully completed "${task.title}". Waiting for poster review.`,
      relatedTask: task._id,
      actionUrl: `/tasks/${task._id}`,
      metadata: {
        taskTitle: task.title,
      },
      priority: "NORMAL",
    };

    return Promise.all([
      this.createNotification(posterNotification),
      this.createNotification(taskerNotification),
    ]);
  }

  /**
   * Create notification when payment is processed
   */
  async notifyPaymentReceived(payment, task, tasker) {
    const notification = {
      recipient: tasker._id,
      type: "PAYMENT_RECEIVED",
      title: "Payment Received",
      message: `You've received $${payment.amount} for completing "${task.title}".`,
      relatedTask: task._id,
      relatedPayment: payment._id,
      actionUrl: `/payments/${payment._id}/receipt`,
      metadata: {
        taskTitle: task.title,
        paymentAmount: payment.amount,
        currency: payment.currency || "USD",
      },
      priority: "HIGH",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when receipt is ready
   */
  async notifyReceiptReady(receipt, task, user) {
    const notification = {
      recipient: user._id,
      type: "RECEIPT_READY",
      title: "Receipt Available",
      message: `Your receipt for "${task.title}" is ready for download.`,
      relatedTask: task._id,
      actionUrl: `/receipts/${receipt._id}/download`,
      metadata: {
        taskTitle: task.title,
        receiptNumber: receipt.receiptNumber,
      },
      priority: "NORMAL",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification for new chat messages
   */
  async notifyMessageReceived(message, chat, sender, recipient, task) {
    const notification = {
      recipient: recipient._id,
      sender: sender._id,
      type: "MESSAGE_RECEIVED",
      title: "New Message",
      message: `${sender.firstName || "Someone"} sent you a message about "${
        task.title
      }".`,
      relatedTask: task._id,
      relatedChat: chat._id,
      actionUrl: `/chats/${chat._id}`,
      metadata: {
        taskTitle: task.title,
        senderName: `${sender.firstName} ${sender.lastName}`,
        senderAvatar: sender.avatar,
        messagePreview: message.content.substring(0, 50),
      },
      priority: "NORMAL",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification for new group chat messages
   * Notifies all participants except the sender
   */
  async notifyGroupChatMessage(
    groupChat,
    task,
    sender,
    messageContent,
    messageType = "text"
  ) {
    try {
      const activeParticipants = groupChat.getActiveParticipants();
      const notifications = [];

      for (const participant of activeParticipants) {
        // Don't notify the sender
        if (participant.userId.toString() === sender._id.toString()) {
          continue;
        }

        let title, message, priority;

        switch (messageType) {
          case "offer":
            title = "New Offer in Group Chat";
            message = `${sender.firstName} made an offer in the "${task.title}" group chat.`;
            priority = "HIGH";
            break;
          case "assignment":
            title = "Task Assignment Update";
            message = `Task "${task.title}" has been assigned. Check the group chat for details.`;
            priority = "HIGH";
            break;
          case "system":
            title = "Group Chat Update";
            message = `Update in "${
              task.title
            }" group chat: ${messageContent.substring(0, 50)}...`;
            priority = "NORMAL";
            break;
          default:
            title = "New Group Message";
            message = `${sender.firstName} sent a message in "${task.title}" group chat.`;
            priority = "NORMAL";
        }

        const notification = {
          recipient: participant.userId,
          sender: sender._id,
          type: "MESSAGE_RECEIVED",
          title,
          message,
          relatedTask: task._id,
          actionUrl: `/group-chats/${groupChat._id}`,
          metadata: {
            taskTitle: task.title,
            senderName: `${sender.firstName} ${sender.lastName}`,
            senderAvatar: sender.avatar,
            messagePreview: messageContent.substring(0, 100),
            messageType,
            groupChatId: groupChat._id,
            firebaseChatId: groupChat.firebaseChatId,
            participantRole: participant.role,
          },
          priority,
        };

        notifications.push(this.createNotification(notification));
      }

      return Promise.all(notifications);
    } catch (error) {
      logger.error("Error creating group chat message notifications:", {
      service: "notificationService",
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create notification when new participant joins group chat
   */
  async notifyGroupChatParticipantJoined(
    groupChat,
    task,
    newParticipant,
    recipient
  ) {
    const isTasker = newParticipant.role !== "poster";

    const notification = {
      recipient: recipient._id,
      sender: newParticipant._id,
      type: "SYSTEM_UPDATE",
      title: "New Participant Joined",
      message: isTasker
        ? `${newParticipant.firstName} joined the "${task.title}" group chat as a tasker.`
        : `${newParticipant.firstName} created the "${task.title}" group chat.`,
      relatedTask: task._id,
      actionUrl: `/group-chats/${groupChat._id}`,
      metadata: {
        taskTitle: task.title,
        participantName: `${newParticipant.firstName} ${newParticipant.lastName}`,
        participantRole: isTasker ? "tasker" : "poster",
        groupChatId: groupChat._id,
        firebaseChatId: groupChat.firebaseChatId,
      },
      priority: "NORMAL",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when tasker makes an offer (includes group chat invitation)
   */
  async notifyOfferMadeWithGroupChat(offer, task, tasker, poster, groupChat) {
    const notification = {
      recipient: poster._id,
      sender: tasker._id,
      type: "OFFER_MADE",
      title: "New Offer & Chat Participant",
      message: `${tasker.firstName} made an offer of $${offer.amount} for "${task.title}" and joined the group chat.`,
      relatedTask: task._id,
      relatedOffer: offer._id,
      actionUrl: `/group-chats/${groupChat._id}`,
      metadata: {
        taskTitle: task.title,
        offerAmount: offer.amount,
        currency: offer.currency || "USD",
        senderName: `${tasker.firstName} ${tasker.lastName}`,
        senderAvatar: tasker.avatar,
        groupChatId: groupChat._id,
        firebaseChatId: groupChat.firebaseChatId,
        hasGroupChat: true,
      },
      priority: "HIGH",
    };

    return this.createNotification(notification);
  }

  /**
   * Create notification when offer is accepted with group chat context
   */
  async notifyOfferAcceptedWithGroupChat(
    offer,
    task,
    tasker,
    poster,
    groupChat
  ) {
    const notifications = [];

    // Notify the tasker whose offer was accepted
    const taskerNotification = {
      recipient: tasker._id,
      sender: poster._id,
      type: "OFFER_ACCEPTED",
      title: "Offer Accepted!",
      message: `Congratulations! Your offer of $${offer.amount} for "${task.title}" has been accepted. Continue in the group chat.`,
      relatedTask: task._id,
      relatedOffer: offer._id,
      actionUrl: `/group-chats/${groupChat._id}`,
      metadata: {
        taskTitle: task.title,
        offerAmount: offer.amount,
        currency: offer.currency || "USD",
        senderName: `${poster.firstName} ${poster.lastName}`,
        senderAvatar: poster.avatar,
        groupChatId: groupChat._id,
        firebaseChatId: groupChat.firebaseChatId,
      },
      priority: "HIGH",
    };

    notifications.push(this.createNotification(taskerNotification));

    // Notify other participants in the group chat
    const otherParticipants = groupChat
      .getActiveParticipants()
      .filter(
        (p) =>
          p.userId.toString() !== tasker._id.toString() &&
          p.userId.toString() !== poster._id.toString()
      );

    for (const participant of otherParticipants) {
      const participantNotification = {
        recipient: participant.userId,
        type: "SYSTEM_UPDATE",
        title: "Task Assigned",
        message: `"${task.title}" has been assigned to ${tasker.firstName}. The group chat is still active.`,
        relatedTask: task._id,
        actionUrl: `/group-chats/${groupChat._id}`,
        metadata: {
          taskTitle: task.title,
          assignedTasker: `${tasker.firstName} ${tasker.lastName}`,
          groupChatId: groupChat._id,
          firebaseChatId: groupChat.firebaseChatId,
        },
        priority: "NORMAL",
      };

      notifications.push(this.createNotification(participantNotification));
    }

    return Promise.all(notifications);
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false, type = null } = options;

    const query = { recipient: userId };
    if (unreadOnly) query.isRead = false;
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .populate("sender", "firstName lastName avatar")
      .populate("relatedTask", "title category")
      .populate("relatedOffer", "amount currency")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification.markAsRead();
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId) {
    const stats = await Notification.aggregate([
      { $match: { recipient: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
          high_priority: {
            $sum: { $cond: [{ $eq: ["$priority", "HIGH"] }, 1, 0] },
          },
        },
      },
    ]);

    return stats[0] || { total: 0, unread: 0, high_priority: 0 };
  }
}

module.exports = new NotificationService();


