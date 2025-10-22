// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/authMiddleware");
const {
  createPaymentIntent,
  verifyPayment,
  confirmTaskCompletion,
} = require("../controllers/paymentController");

// Create payment intent
router.post("/create-intent", protect, createPaymentIntent);

// Verify payment
router.post("/verify", protect, verifyPayment);

// Complete task and release payment
router.post("/complete/:taskId", protect, confirmTaskCompletion);

module.exports = router;
