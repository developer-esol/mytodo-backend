const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const paymentRepository = require("../../repository/payment/payment.repository");
const { calculateServiceFee } = require("../../utils/serviceFee");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createPaymentIntent = async (userId, taskId, offerId) => {
  if (!isValidObjectId(taskId) || !isValidObjectId(offerId)) {
    throw new Error("Invalid task or offer ID");
  }

  const task = await paymentRepository.findTaskById(taskId);
  const offer = await paymentRepository.findOfferById(offerId);

  if (!task || !offer) {
    throw new Error("Task or offer not found");
  }

  const budgetAmount = task.budget;
  const taskCurrency = task.currency;
  const offerAmount = offer.offer.amount;

  if (isNaN(budgetAmount) || budgetAmount <= 0) {
    throw new Error("Invalid budget amount");
  }

  if (isNaN(offerAmount) || offerAmount <= 0) {
    throw new Error("Invalid offer amount");
  }

  const serviceFeeCalculation = calculateServiceFee(budgetAmount, taskCurrency);

  console.log("Payment calculation:", {
    budget: budgetAmount,
    currency: taskCurrency,
    serviceFeeDetails: serviceFeeCalculation,
    offerAmount: offerAmount,
  });

  const totalChargeInCents = Math.round(
    serviceFeeCalculation.totalAmount * 100
  );
  const serviceFeeInCents = Math.round(serviceFeeCalculation.serviceFee * 100);
  const budgetInCents = Math.round(budgetAmount * 100);

  const adjustedAmount =
    offerAmount < 50 ? offerAmount + 5 : (offerAmount * 105) / 100;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(adjustedAmount * 100),
    currency: taskCurrency.toLowerCase(),
    metadata: {
      taskId: task._id.toString(),
      offerId: offer._id.toString(),
      userId: userId.toString(),
      originalBudget: budgetInCents,
      serviceFee: serviceFeeInCents,
      offerAmount: Math.round(offerAmount * 100),
      taskerReceives: Math.round(
        (offerAmount - serviceFeeCalculation.serviceFee) * 100
      ),
      serviceFeeReason: serviceFeeCalculation.breakdown.reason,
    },
    capture_method: "automatic",
    payment_method_types: ["card"],
  });

  const payment = await paymentRepository.createPayment({
    task: task._id,
    offer: offer._id,
    user: userId,
    tasker: offer.taskTakerId,
    paymentIntentId: paymentIntent.id,
    amount: offerAmount,
    taskerAmount: offerAmount - serviceFeeCalculation.serviceFee,
    serviceFee: serviceFeeCalculation.serviceFee,
    currency: taskCurrency,
    status: "pending",
  });

  return {
    clientSecret: paymentIntent.client_secret,
    breakdown: {
      budgetAmount: budgetAmount,
      serviceFee: serviceFeeCalculation.serviceFee,
      totalCharge: serviceFeeCalculation.totalAmount,
      taskerWillReceive: offerAmount,
      currency: taskCurrency,
    },
    serviceFeeDetails: serviceFeeCalculation.breakdown,
    paymentId: payment._id,
  };
};

const verifyPayment = async (paymentIntentId, taskId) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment not completed");
  }

  const payment = await paymentRepository.findPaymentByIntentId(
    paymentIntentId
  );

  if (!payment) {
    throw new Error("Payment record not found");
  }

  await paymentRepository.updatePaymentStatus(paymentIntentId, "completed");
  await paymentRepository.updateTaskStatus(taskId, "in_progress", {
    paymentIntentId,
  });

  return payment;
};

const confirmTaskCompletion = async (taskId) => {
  const task = await paymentRepository.findTaskById(taskId);

  if (!task || !task.paymentIntentId) {
    throw new Error("Task not found or no payment intent");
  }

  const paymentIntent = await stripe.paymentIntents.capture(
    task.paymentIntentId
  );

  await paymentRepository.updateTaskStatus(taskId, "todo");
  await paymentRepository.updatePaymentStatus(task.paymentIntentId, "todo");

  return { task, paymentIntent };
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
  confirmTaskCompletion,
};
