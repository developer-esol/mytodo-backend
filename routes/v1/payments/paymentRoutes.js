// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../../../middleware/authMiddleware");
const {
  createPaymentIntent,
  verifyPayment,
  confirmTaskCompletion,
} = require("../../../controllers/payments/payment.controller");
const validators = require("../../../validators/v1/payments/payment.validator");

// Create payment intent
router.post(
  "/create-intent",
  protect,
  ...validators.createPaymentIntent,
  createPaymentIntent
);

// Verify payment
router.post("/verify", protect, ...validators.verifyPayment, verifyPayment);

// Complete task and release payment
router.post(
  "/complete/:taskId",
  protect,
  ...validators.confirmTaskCompletion,
  confirmTaskCompletion
);

module.exports = router;
