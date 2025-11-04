const mongoose = require("mongoose");
const chatRepository = require("../../repository/chat/chat.repository");
const { formatUserObject } = require("../../utils/userUtils");
const logger = require("../../config/logger");

const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id);
};

const extractUniqueTaskIds = (chats) => {
  const taskIds = chats
    .map((chat) => chat.taskId)
    .filter((taskId) => isValidObjectId(taskId));

  return [...new Set(taskIds)];
};

const createTaskMap = (tasks) => {
  return tasks.reduce((acc, task) => {
    acc[task._id.toString()] = task;
    return acc;
  }, {});
};

const formatChatData = (chats, taskMap, userId) => {
  return chats.map((chat) => {
    const task = chat.taskId ? taskMap[chat.taskId.toString()] : null;

    // Determine the other participant (not the current user)
    const otherParticipant =
      chat.posterId &&
      chat.posterId._id &&
      chat.posterId._id.toString() === userId.toString()
        ? chat.taskerId
        : chat.posterId;

    return {
      chat: {
        ...chat,
        posterId: formatUserObject(chat.posterId),
        taskerId: formatUserObject(chat.taskerId),
        otherParticipant: formatUserObject(otherParticipant),
      },
      task: task || null,
      lastMessage: chat.lastMessage || null,
      unreadCount: chat.unreadCount || 0,
    };
  });
};

const getUserChatsWithTasks = async (userId) => {
  // Validate userId
  if (!isValidObjectId(userId)) {
    throw new Error("Valid user ID is required");
  }

  logger.debug("Searching for user chats", {
    service: "chat.services",
    function: "getUserChatsWithTasks",
    userId,
  });

  // Find chats
  const chats = await chatRepository.findChatsByUserId(userId);

  logger.info("Found user chats", {
    service: "chat.services",
    function: "getUserChatsWithTasks",
    userId,
    chatCount: chats.length,
  });

  // Early return if no chats found
  if (!chats.length) {
    return [];
  }

  // Extract and fetch related tasks
  const uniqueTaskIds = extractUniqueTaskIds(chats);
  const tasks = await chatRepository.findTasksByIds(uniqueTaskIds);

  // Create task map and format data
  const taskMap = createTaskMap(tasks);
  const formattedChats = formatChatData(chats, taskMap, userId);

  logger.debug("Formatted chat results", {
    service: "chat.services",
    function: "getUserChatsWithTasks",
    userId,
    resultCount: formattedChats.length,
  });

  return formattedChats;
};

const acceptOfferAndUpdateChat = async (updateData) => {
  const { taskId, offerId, userId, action, chatStatus } = updateData;

  // Validate required fields
  if (!taskId || !offerId || !userId) {
    throw new Error("TaskId, offerId, and userId are required");
  }

  // Validate IDs
  if (
    !isValidObjectId(taskId) ||
    !isValidObjectId(offerId) ||
    !isValidObjectId(userId)
  ) {
    throw new Error("Invalid taskId, offerId, or userId");
  }

  // Validate action and status
  if (action !== "accept_offer" || chatStatus !== "accept") {
    throw new Error("Invalid action or chatStatus");
  }

  // Find the offer to get the task taker ID
  const offer = await chatRepository.findOfferById(offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }

  // Find the task to get the poster ID
  const task = await chatRepository.findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  // Update chat status
  const updatedChat = await chatRepository.updateChatStatus(
    taskId,
    task.createdBy,
    offer.taskTakerId,
    "accept"
  );

  if (!updatedChat) {
    throw new Error("Chat not found for this task and offer");
  }

  logger.info("Chat status updated successfully", {
    service: "chat.services",
    function: "acceptOfferAndUpdateChat",
    taskId,
    offerId,
    chatStatus: "accept",
  });

  return updatedChat;
};

module.exports = {
  getUserChatsWithTasks,
  acceptOfferAndUpdateChat,
};
