const Receipt = require("../../models/payment/Receipt");
const Task = require("../../models/task/Task");
const Payment = require("../../models/payment/Payment");

const findUserReceipts = async (userId, query, skip, limit) => {
  return await Receipt.find(query)
    .populate("task", "title categories completedAt status")
    .populate("poster", "firstName lastName")
    .populate("tasker", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countUserReceipts = async (query) => {
  return await Receipt.countDocuments(query);
};

const findReceiptById = async (receiptId) => {
  return await Receipt.findById(receiptId)
    .populate("task", "title categories location details completedAt status")
    .populate("poster", "firstName lastName email")
    .populate("tasker", "firstName lastName email")
    .populate("offer", "offer.amount offer.message")
    .populate("payment", "paymentIntentId amount serviceFee currency status");
};

const findReceiptsByTask = async (taskId, userId) => {
  return await Receipt.find({
    task: taskId,
    $or: [{ poster: userId }, { tasker: userId }],
  })
    .populate("task", "title status completedAt")
    .sort({ createdAt: -1 });
};

const findTaskById = async (taskId) => {
  return await Task.findById(taskId);
};

const findCompletedPayment = async (taskId) => {
  return await Payment.findOne({
    task: taskId,
    status: "completed",
  });
};

const findExistingReceipts = async (taskId) => {
  return await Receipt.find({ task: taskId });
};

module.exports = {
  findUserReceipts,
  countUserReceipts,
  findReceiptById,
  findReceiptsByTask,
  findTaskById,
  findCompletedPayment,
  findExistingReceipts,
};
