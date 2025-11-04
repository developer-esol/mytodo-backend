const mongoose = require("mongoose");
const taskRepository = require("../../repository/task/task.repository");
const {
  formatUserObject,
  formatCurrency,
  formatCurrencyObject,
} = require("../../utils/userUtils");
const { calculateVotes } = require("../../utils/taskStatus.utils");
const {
  generateReceiptsForCompletedTask,
} = require("../../shared/services/receiptService");
const notificationService = require("../../shared/services/notificationService");
const logger = require("../../config/logger");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const calculateServiceFee = (amount) => {
  const fee = amount * 0.1;
  return Math.max(fee, 1);
};

const getDateRange = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const buildTaskQuery = (section, subsection, userId) => {
  const now = new Date();
  let query = {};

  switch (section) {
    case "browse-tasks":
      query = { status: "open", createdBy: { $ne: userId } };
      break;

    case "my-tasks":
      if (subsection === "open") {
        query = { createdBy: userId, status: "open" };
      } else if (subsection === "todo") {
        query = { createdBy: userId, status: "todo" };
      } else if (subsection === "completed") {
        query = { createdBy: userId, status: "completed" };
      } else {
        query = { createdBy: userId };
      }
      break;

    case "task-im-doing":
      if (subsection === "todo") {
        query = { assignedTo: userId, status: "todo" };
      } else if (subsection === "completed") {
        query = { assignedTo: userId, status: "completed" };
      } else {
        query = { assignedTo: userId };
      }
      break;

    case "overdue-tasks":
      query = {
        $or: [{ createdBy: userId }, { assignedTo: userId }],
        "dateRange.end": { $lt: now },
        status: { $nin: ["completed", "cancelled"] },
      };
      break;

    case "completed-tasks":
      if (subsection === "last-7-days") {
        query = {
          $or: [{ createdBy: userId }, { assignedTo: userId }],
          status: "completed",
          completedAt: { $gte: getDateRange(7) },
        };
      } else if (subsection === "last-30-days") {
        query = {
          $or: [{ createdBy: userId }, { assignedTo: userId }],
          status: "completed",
          completedAt: { $gte: getDateRange(30) },
        };
      } else if (subsection === "last-90-days") {
        query = {
          $or: [{ createdBy: userId }, { assignedTo: userId }],
          status: "completed",
          completedAt: { $gte: getDateRange(90) },
        };
      } else {
        query = {
          $or: [{ createdBy: userId }, { assignedTo: userId }],
          status: "completed",
        };
      }
      break;

    default:
      throw new Error("Invalid section");
  }

  // Additional status filtering for non-special cases
  if (
    !["overdue-tasks", "completed-tasks"].includes(section) &&
    subsection &&
    !["open", "todo", "completed", "overdue", "expired"].includes(subsection)
  ) {
    query.status = subsection;
  }

  return query;
};

const formatTaskWithOffers = async (task, userId) => {
  const isCreator =
    task.createdBy && task.createdBy._id.toString() === userId.toString();
  const isAssignee =
    task.assignedTo && task.assignedTo._id.toString() === userId.toString();

  // Get offers for this task
  const offers = await taskRepository.findOffersByTaskId(task._id.toString());

  // Count offers by status
  const offerCounts = {
    total: offers.length,
    pending: offers.filter((o) => o.status === "pending").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    rejected: offers.filter((o) => o.status === "rejected").length,
  };

  // Find accepted offer if exists
  const acceptedOffer = offers.find((o) => o.status === "accepted");

  // Format offers if user is creator
  let formattedOffers = null;
  if (isCreator && offers.length > 0) {
    formattedOffers = offers.map((offer) => ({
      _id: offer._id,
      amount: offer.offer.amount,
      currency: offer.offer.currency,
      message: offer.offer.message,
      status: offer.status,
      taskTaker: formatUserObject(offer.taskTakerId),
      createdAt: offer.createdAt,
    }));
  }

  return {
    ...task,
    createdBy: formatUserObject(task.createdBy),
    assignedTo: formatUserObject(task.assignedTo),
    userRole: isCreator ? "creator" : isAssignee ? "assignee" : "viewer",
    offerCounts,
    acceptedOffer: acceptedOffer
      ? {
          _id: acceptedOffer._id,
          amount: acceptedOffer.offer.amount,
          currency: acceptedOffer.offer.currency,
          message: acceptedOffer.offer.message,
          taskTaker: formatUserObject(acceptedOffer.taskTakerId),
        }
      : null,
    offers: formattedOffers,
  };
};

const getMyTasksWithOffers = async (userId, section, subsection) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const query = buildTaskQuery(section, subsection, userId);
  const tasks = await taskRepository.findTasksByQuery(query);

  const tasksWithOffers = await Promise.all(
    tasks.map((task) => formatTaskWithOffers(task, userId))
  );

  return tasksWithOffers;
};

const updateTaskStatusService = async (taskId, userId, newStatus, reason) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  const task = await taskRepository.findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  // Validate status transition
  const validTransitions = {
    open: ["todo", "expired"],
    todo: ["done", "overdue"],
    done: ["completed"],
    completed: [],
    expired: [],
    overdue: [],
  };

  if (!validTransitions[task.status]?.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${task.status} to ${newStatus}`
    );
  }

  // Permission checks
  switch (newStatus) {
    case "todo":
      if (task.createdBy.toString() !== userId.toString()) {
        throw new Error("Only task creator can move to todo");
      }
      break;

    case "done":
      if (
        !task.assignedTo ||
        task.assignedTo.toString() !== userId.toString()
      ) {
        throw new Error("Only assigned tasker can mark as done");
      }
      break;

    case "completed":
      if (task.createdBy.toString() !== userId.toString()) {
        throw new Error("Only task creator can mark as completed");
      }
      if (task.status !== "done") {
        throw new Error("Task must be done before completing");
      }
      break;

    case "expired":
    case "overdue":
      // System managed statuses
      break;

    default:
      throw new Error("Invalid status");
  }

  // Update task
  const updatedTask = await taskRepository.updateTaskStatus(
    task,
    newStatus,
    userId,
    reason
  );

  // Sync with transaction table
  if (newStatus !== "completed") {
    await taskRepository.updateTransactionStatus(taskId, newStatus);
  }

  return updatedTask;
};

const getUserOffers = async (userId, status) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const statusFilter = status ? { status } : {};
  return await taskRepository.findOffersByUserId(userId, statusFilter);
};

const completeTaskService = async (taskId, userId) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  // Find task
  const task = await taskRepository.findOneTask({
    _id: taskId,
    status: "todo",
    $or: [{ createdBy: userId }, { assignedTo: userId }],
  });

  if (!task) {
    throw new Error("Task not found or invalid status");
  }

  // Find accepted offer
  const acceptedOffer = await taskRepository.findAcceptedOfferByTaskId(taskId);
  if (!acceptedOffer) {
    throw new Error("No accepted offer found for this task");
  }

  // Calculate votes
  const { posterVotes, taskerVotes } = calculateVotes(
    task.budget,
    acceptedOffer.offer.amount
  );

  // Complete task
  await taskRepository.completeTask(task);

  // Update payment status FIRST
  logger.info("Updating payment status to completed", {
    service: "tasks.services",
    function: "completeTaskService",
    taskId,
  });
  await taskRepository.updatePaymentStatus(taskId, "completed");
  logger.info("Payment status updated to completed", {
    service: "tasks.services",
    function: "completeTaskService",
    taskId,
  });

  // Update user vote counts
  await taskRepository.incrementUserCompletedTasks(
    task.createdBy._id,
    posterVotes
  );
  await taskRepository.incrementUserCompletedTasks(
    task.assignedTo._id,
    taskerVotes
  );

  // Update offer status
  await taskRepository.updateOfferStatus(acceptedOffer, "completed", {
    completedAt: new Date(),
    posterVotes,
    taskerVotes,
  });

  // Generate receipts
  try {
    logger.info("Generating receipts for completed task", {
      service: "tasks.services",
      function: "completeTaskService",
      taskId,
    });
    await generateReceiptsForCompletedTask(taskId);
    logger.info("Receipts generated successfully", {
      service: "tasks.services",
      function: "completeTaskService",
      taskId,
    });

    // Send notifications
    await notificationService.sendTaskCompletionNotification(
      task.createdBy._id,
      task.assignedTo._id,
      taskId
    );
  } catch (receiptError) {
    logger.error("Error generating receipts", {
      service: "tasks.services",
      function: "completeTaskService",
      taskId,
      error: receiptError.message,
      stack: receiptError.stack,
    });
  }

  return task;
};

const checkTaskCompletionStatus = async (taskId, userId) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  const task = await taskRepository.findTaskByIdWithUsers(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const isTaskCreator =
    task.createdBy && task.createdBy._id.toString() === userId.toString();
  const isAssignedTasker =
    task.assignedTo && task.assignedTo._id.toString() === userId.toString();

  const canComplete = task.status === "todo" && isTaskCreator;

  return {
    taskId: task._id,
    status: task.status,
    canComplete,
    completionButtonText: canComplete ? "Mark as Complete" : null,
    userRole: isTaskCreator
      ? "creator"
      : isAssignedTasker
      ? "assignee"
      : "none",
  };
};

const cancelTaskService = async (taskId, userId) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  const task = await taskRepository.findOneTask({
    _id: taskId,
    createdBy: userId,
    status: { $in: ["open", "todo"] },
  });

  if (!task) {
    throw new Error("Task not found or cannot be cancelled");
  }

  await taskRepository.cancelTask(task);
  await taskRepository.rejectOffersForCancelledTask(taskId);

  return task;
};

const acceptOfferService = async (taskId, offerId, userId) => {
  if (!taskId || !offerId) {
    throw new Error("TaskId and offerId are required");
  }

  if (!isValidObjectId(taskId) || !isValidObjectId(offerId)) {
    throw new Error("Invalid taskId or offerId");
  }

  // Get task and offer
  const task = await taskRepository.findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const offer = await taskRepository.findOfferById(offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }

  // Verify offer belongs to task
  if (offer.taskId.toString() !== taskId) {
    throw new Error("Offer does not belong to this task");
  }

  // Verify user is task creator
  if (task.createdBy.toString() !== userId.toString()) {
    throw new Error("Only task creator can accept offers");
  }

  // Check task status
  if (!["open", "pending"].includes(task.status)) {
    throw new Error("Task is not available for offer acceptance");
  }

  // Check offer status
  if (offer.status !== "pending") {
    throw new Error("Offer is not in pending status");
  }

  // Extract service type
  const serviceType = Array.isArray(task.categories)
    ? task.categories[0]?.split(",")[0]?.trim() || "Other"
    : typeof task.categories === "string"
    ? task.categories.split(",")[0]?.trim() || "Other"
    : "Other";

  // Create transaction
  const transactionData = {
    taskId: task._id,
    posterId: task.createdBy,
    taskerId: offer.taskTakerId,
    amount: offer.offer.amount,
    serviceFee: calculateServiceFee(offer.offer.amount),
    totalAmount: offer.offer.amount + calculateServiceFee(offer.offer.amount),
    paymentStatus: "requires_payment_method",
    serviceType,
  };

  const transaction = await taskRepository.createTransaction(transactionData);

  // Update task and offer
  await taskRepository.assignTaskToUser(task, offer.taskTakerId);
  await taskRepository.acceptOffer(offer);

  // Reject other offers
  await taskRepository.rejectOtherOffers(taskId, offerId);

  return { task, offer, transaction };
};

/**
 * Get task with all offers
 * @param {String} taskId - Task ID
 * @returns {Promise<Object>} Task with formatted offers
 */
const getTaskWithOffersService = async (taskId) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  const task = await taskRepository.findTaskByIdWithFullUsers(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const offers = await taskRepository.findOffersByTaskId(taskId);

  // Format offers
  const formattedOffers = offers.map((offer) => ({
    _id: offer._id,
    user: offer.taskTakerId
      ? {
          _id: offer.taskTakerId._id,
          name:
            `${offer.taskTakerId.firstName || ""} ${
              offer.taskTakerId.lastName || ""
            }`.trim() || offer.taskTakerId.name,
          avatar: offer.taskTakerId.avatar,
          rating: offer.taskTakerId.rating,
          completedTasks: offer.taskTakerId.completedTasks,
        }
      : null,
    amount: offer.offer.amount,
    currency: offer.offer.currency,
    formattedAmount: formatCurrency(offer.offer.amount, offer.offer.currency),
    currencyInfo: formatCurrencyObject(
      offer.offer.amount,
      offer.offer.currency
    ),
    message: offer.offer.message,
    status: offer.status,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  }));

  // Format date
  let formattedDate;
  let dateDisplay;

  try {
    if (task.dateRange && task.dateRange.start && task.dateRange.end) {
      const startDate = new Date(task.dateRange.start);
      const endDate = new Date(task.dateRange.end);

      if (!isNaN(startDate) && !isNaN(endDate)) {
        const startOptions = {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        };
        const endOptions = {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        };

        const startFormatted = startDate.toLocaleDateString(
          "en-US",
          startOptions
        );
        const endFormatted = endDate.toLocaleDateString("en-US", endOptions);

        formattedDate = `${startFormatted} - ${endFormatted}`;

        dateDisplay = {
          start: {
            full: startDate.toISOString(),
            formatted: startFormatted,
            day: startDate.getDate(),
            month: startDate.toLocaleDateString("en-US", { month: "short" }),
            year: startDate.getFullYear(),
            weekday: startDate.toLocaleDateString("en-US", {
              weekday: "short",
            }),
          },
          end: {
            full: endDate.toISOString(),
            formatted: endFormatted,
            day: endDate.getDate(),
            month: endDate.toLocaleDateString("en-US", { month: "short" }),
            year: endDate.getFullYear(),
            weekday: endDate.toLocaleDateString("en-US", { weekday: "short" }),
            time: endDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          },
          combined: formattedDate,
        };
      }
    }
  } catch (error) {
    logger.error("Error formatting date", {
      service: "tasks.services",
      function: "getTaskWithOffersService",
      taskId,
      error: error.message,
      rawDateRange: task.dateRange,
    });
    formattedDate = "Date not available";
    dateDisplay = {
      error: "Unable to format date",
      raw: task.dateRange,
    };
  }

  return {
    _id: task._id,
    title: task.title,
    description: task.description,
    budget: task.budget,
    currency: task.currency,
    formattedBudget: formatCurrency(task.budget, task.currency),
    budgetInfo: formatCurrencyObject(task.budget, task.currency),
    status: task.status,
    categories: task.categories,
    locationType: task.locationType,
    location: task.location,
    dateRange: task.dateRange,
    formattedDate,
    dateDisplay,
    images: task.images,
    createdBy: formatUserObject(task.createdBy),
    assignedTo: formatUserObject(task.assignedTo),
    offers: formattedOffers,
    offersCount: formattedOffers.length,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

module.exports = {
  getMyTasksWithOffers,
  updateTaskStatusService,
  getUserOffers,
  completeTaskService,
  checkTaskCompletionStatus,
  cancelTaskService,
  acceptOfferService,
  getTaskWithOffersService,
};
