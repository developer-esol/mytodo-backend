const paymentService = require("../../servicesN/payments/payment.services");
const logger = require("../../config/logger");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { taskId, offerId } = req.body;
    const userId = req.user._id;

    const result = await paymentService.createPaymentIntent(
      userId,
      taskId,
      offerId
    );

    logger.info("Payment intent created successfully", {
      controller: "payment.controller",
      userId,
      taskId,
      offerId,
      paymentId: result.paymentId,
    });

    res.json({
      success: true,
      clientSecret: result.clientSecret,
      breakdown: result.breakdown,
      serviceFeeDetails: result.serviceFeeDetails,
      paymentId: result.paymentId,
    });
  } catch (error) {
    logger.error("Payment error:", error);
    const statusCode = error.message.includes("Invalid")
      ? 400
      : error.message.includes("not found")
      ? 404
      : 500;
    res.status(statusCode).json({
      error: error.message || "Payment processing failed",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId, taskId } = req.body;

    const payment = await paymentService.verifyPayment(paymentIntentId, taskId);

    logger.info("Payment verified successfully", {
      controller: "payment.controller",
      paymentIntentId,
      taskId,
    });

    res.json({ success: true, payment });
  } catch (error) {
    logger.error("Payment error:", error);
    const statusCode =
      error.message === "Payment not completed"
        ? 400
        : error.message === "Payment record not found"
        ? 404
        : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || "Payment processing failed",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

exports.confirmTaskCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await paymentService.confirmTaskCompletion(taskId);

    logger.info("Task completion confirmed", {
      controller: "payment.controller", taskId });

    res.json({
      success: true,
      task: result.task,
      paymentIntent: result.paymentIntent,
    });
  } catch (error) {
    logger.error("Task completion confirmation error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to confirm task completion",
    });
  }
};

