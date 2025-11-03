const Task = require("../../models/task/Task");
const Offer = require("../../models/task/Offer");
const Payment = require("../../models/payment/Payment");

const findTaskById = async (taskId) => {
  return await Task.findById(taskId);
};

const findOfferById = async (offerId) => {
  return await Offer.findById(offerId);
};

const createPayment = async (paymentData) => {
  const payment = new Payment(paymentData);
  return await payment.save();
};

const findPaymentByIntentId = async (paymentIntentId) => {
  return await Payment.findOne({ paymentIntentId });
};

const updatePaymentStatus = async (paymentIntentId, status) => {
  return await Payment.findOneAndUpdate(
    { paymentIntentId },
    { status },
    { new: true }
  );
};

const updateTaskStatus = async (taskId, status, additionalData = {}) => {
  return await Task.findByIdAndUpdate(
    taskId,
    { status, ...additionalData },
    { new: true }
  );
};

module.exports = {
  findTaskById,
  findOfferById,
  createPayment,
  findPaymentByIntentId,
  updatePaymentStatus,
  updateTaskStatus,
};
