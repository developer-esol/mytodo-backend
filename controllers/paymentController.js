// controllers/paymentController.js
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Task = require("../models/task/Task");
const Offer = require("../models/task/Offer");
const Payment = require("../models/payment/Payment");
const { calculateServiceFee } = require("../utils/serviceFee");

const createPaymentIntent = async (req, res) => {
  try {
    const { taskId, offerId } = req.body;

    // Validate input
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(offerId)
    ) {
      return res.status(400).json({ error: "Invalid task or offer ID" });
    }

    const task = await Task.findById(taskId);
    const offer = await Offer.findById(offerId);

    if (!task || !offer) {
      return res.status(404).json({ error: "Task or offer not found" });
    }

    // IMPORTANT: Service fee comes from the original budget
    // The customer pays: offer amount (NOT budget + service_fee)
    // The tasker receives: offer amount - service_fee
    // The platform keeps: service_fee

    const budgetAmount = task.budget;
    const taskCurrency = task.currency;
    const offerAmount = offer.offer.amount;

    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json({ error: "Invalid budget amount" });
    }

    if (isNaN(offerAmount) || offerAmount <= 0) {
      return res.status(400).json({ error: "Invalid offer amount" });
    }

    // Calculate service fee based on budget amount
    const serviceFeeCalculation = calculateServiceFee(
      budgetAmount,
      taskCurrency
    );

    console.log("Payment calculation:", {
      budget: budgetAmount,
      currency: taskCurrency,
      serviceFeeDetails: serviceFeeCalculation,
      offerAmount: offerAmount,
    });

    // Convert to cents for Stripe
    const totalChargeInCents = Math.round(
      serviceFeeCalculation.totalAmount * 100
    );
    const serviceFeeInCents = Math.round(
      serviceFeeCalculation.serviceFee * 100
    );
    const budgetInCents = Math.round(budgetAmount * 100);

    // Add 5% to the offer amount
    const adjustedAmount =
      offerAmount < 50 ? offerAmount + 5 : (offerAmount * 105) / 100;

    // Create Stripe payment intent for the offer amount (service fee is included in this)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(adjustedAmount * 100), // Charge the adjusted amount
      currency: taskCurrency.toLowerCase(),
      metadata: {
        taskId: task._id.toString(),
        offerId: offer._id.toString(),
        userId: req.user._id.toString(),
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

    // Create payment record with proper fee breakdown
    const payment = new Payment({
      task: task._id,
      offer: offer._id,
      user: req.user._id,
      tasker: offer.taskTakerId,
      paymentIntentId: paymentIntent.id,
      amount: offerAmount, // Total offer amount
      taskerAmount: offerAmount - serviceFeeCalculation.serviceFee, // Amount tasker receives after service fee
      serviceFee: serviceFeeCalculation.serviceFee, // Service fee deducted from offer
      currency: taskCurrency,
      status: "pending",
    });

    await payment.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      // Payment breakdown for frontend
      breakdown: {
        budgetAmount: budgetAmount,
        serviceFee: serviceFeeCalculation.serviceFee,
        totalCharge: serviceFeeCalculation.totalAmount,
        taskerWillReceive: offerAmount,
        currency: taskCurrency,
      },
      serviceFeeDetails: serviceFeeCalculation.breakdown,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      error: error.message || "Payment processing failed",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};
const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId, taskId } = req.body;

    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res
        .status(400)
        .json({ success: false, error: "Payment not completed" });
    }

    // Update payment record and get original
    const payment = await Payment.findOne({ paymentIntentId });

    if (!payment) {
      throw new Error("Payment record not found");
    }

    payment.status = "completed";
    await payment.save();

    // Update task status
    await Task.findByIdAndUpdate(taskId, {
      status: "in_progress",
      paymentIntentId,
    });

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      error: error.message || "Payment processing failed",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

const confirmTaskCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task || !task.paymentIntentId) {
      return res
        .status(404)
        .json({ error: "Task not found or no payment intent" });
    }

    // Capture the payment
    const paymentIntent = await stripe.paymentIntents.capture(
      task.paymentIntentId
    );

    // Update task status
    task.status = "todo";

    await task.save();

    // Update payment status
    await Payment.findOneAndUpdate(
      { paymentIntentId: task.paymentIntentId },
      { status: "todo" }
    );

    res.json({ success: true, task, paymentIntent });
  } catch (error) {
    console.error("Task completion confirmation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm task completion",
    });
  }
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
  confirmTaskCompletion,
};
