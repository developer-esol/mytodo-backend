const Task = require("../../models/task/Task");
const Offer = require("../../models/task/Offer");
const TransAction = require("../../models/payment/TransActions");
const Payment = require("../../models/payment/Payment");
const User = require("../../models/user/User");

const findTasksByQuery = async (query) => {
  // Add isActive filter to all queries
  const activeQuery = { ...query, isActive: 1 };
  return await Task.find(activeQuery)
    .populate("createdBy", "firstName lastName avatar rating")
    .populate("assignedTo", "firstName lastName avatar rating")
    .sort({ "dateRange.end": 1, createdAt: -1 })
    .lean();
};

const findTaskById = async (taskId) => {
  return await Task.findOne({ _id: taskId, isActive: 1 });
};

const findTaskByIdWithUsers = async (taskId) => {
  return await Task.findOne({ _id: taskId, isActive: 1 }).populate(
    "createdBy assignedTo",
    "firstName lastName avatar rating completedTasks"
  );
};

const findTaskByIdWithFullUsers = async (taskId) => {
  return await Task.findOne({ _id: taskId, isActive: 1 })
    .populate({
      path: "createdBy",
      select:
        "firstName lastName email phone verified avatar rating memberSince name",
      model: "User",
    })
    .populate({
      path: "assignedTo",
      select: "firstName lastName avatar rating name",
      model: "User",
    })
    .lean();
};

const findOneTask = async (query) => {
  // Add isActive filter
  const activeQuery = { ...query, isActive: 1 };
  return await Task.findOne(activeQuery).populate(
    "createdBy assignedTo",
    "firstName lastName avatar rating completedTasks"
  );
};

const updateTaskStatus = async (task, newStatus, userId, reason) => {
  task.status = newStatus;
  task.statusHistory = task.statusHistory || [];
  task.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    reason: reason || `Changed to ${newStatus}`,
  });
  return await task.save();
};

const completeTask = async (task) => {
  task.status = "completed";
  task.completedAt = new Date();
  return await task.save();
};

const cancelTask = async (task) => {
  task.status = "cancelled";
  task.cancelledAt = new Date();
  return await task.save();
};

const assignTaskToUser = async (task, taskerId) => {
  task.status = "todo";
  task.assignedTo = taskerId;
  task.assignedAt = new Date();
  return await task.save();
};

const findOffersByTaskId = async (taskId) => {
  return await Offer.find({
    taskId: taskId,
    status: { $ne: "withdrawn" },
    isActive: 1,
  })
    .populate({
      path: "taskTakerId",
      select: "firstName lastName avatar rating completedTasks name",
      model: "User",
    })
    .sort({ createdAt: -1 })
    .lean();
};

const findOffersByUserId = async (userId, statusFilter = {}) => {
  const query = { taskTakerId: userId, isActive: 1, ...statusFilter };
  return await Offer.find(query)
    .populate("taskId", "title budget dateRange status")
    .populate("taskCreatorId", "firstName lastName avatar rating")
    .sort({ createdAt: -1 });
};

const findAcceptedOfferByTaskId = async (taskId) => {
  return await Offer.findOne({
    taskId: taskId,
    status: "accepted",
    isActive: 1,
  });
};

const findOfferById = async (offerId) => {
  return await Offer.findOne({ _id: offerId, isActive: 1 });
};

const acceptOffer = async (offer) => {
  offer.status = "accepted";
  offer.updatedAt = new Date();
  return await offer.save();
};

const updateOfferStatus = async (offer, status, additionalData = {}) => {
  offer.status = status;
  Object.assign(offer, additionalData);
  return await offer.save();
};

const rejectOtherOffers = async (taskId, excludeOfferId) => {
  return await Offer.updateMany(
    {
      taskId: taskId,
      _id: { $ne: excludeOfferId },
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        updatedAt: new Date(),
      },
    }
  );
};

const rejectOffersForCancelledTask = async (taskId) => {
  return await Offer.updateMany(
    {
      taskId: taskId,
      status: { $in: ["pending", "accepted"] },
    },
    {
      $set: {
        status: "rejected",
        rejectedAt: new Date(),
      },
    }
  );
};

const createTransaction = async (transactionData) => {
  const transaction = new TransAction(transactionData);
  return await transaction.save();
};

const updateTransactionStatus = async (taskId, status) => {
  return await TransAction.updateMany(
    { taskId: taskId },
    {
      $set: {
        status: status,
        updatedAt: new Date(),
      },
    }
  );
};

const updatePaymentStatus = async (taskId, status) => {
  return await Payment.updateMany(
    { task: taskId },
    { $set: { status: status, updatedAt: new Date() } }
  );
};

const incrementUserCompletedTasks = async (userId, votes) => {
  return await User.findByIdAndUpdate(userId, {
    $inc: { completedTasks: votes },
  });
};

const softDeleteTask = async (taskId, userId) => {
  return await Task.findByIdAndUpdate(
    taskId,
    {
      $set: {
        isActive: 0,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    },
    { new: true }
  );
};

const softDeleteOffers = async (taskId) => {
  return await Offer.updateMany(
    { taskId: taskId },
    {
      $set: {
        isActive: 0,
        deletedAt: new Date(),
      },
    }
  );
};

module.exports = {
  findTasksByQuery,
  findTaskById,
  findTaskByIdWithUsers,
  findTaskByIdWithFullUsers,
  findOneTask,
  updateTaskStatus,
  completeTask,
  cancelTask,
  assignTaskToUser,
  findOffersByTaskId,
  findOffersByUserId,
  findAcceptedOfferByTaskId,
  findOfferById,
  acceptOffer,
  updateOfferStatus,
  rejectOtherOffers,
  rejectOffersForCancelledTask,
  createTransaction,
  updateTransactionStatus,
  updatePaymentStatus,
  incrementUserCompletedTasks,
  softDeleteTask,
  softDeleteOffers,
};
