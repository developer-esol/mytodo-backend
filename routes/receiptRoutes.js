// routes/receiptRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getMyReceipts, 
  getReceiptById, 
  downloadReceiptPDF, 
  getTaskReceipts 
} = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get user's receipts with pagination and filtering
// @route   GET /api/receipts
// @access  Private
// @query   receiptType (payment|earnings), page, limit
router.get('/', protect, getMyReceipts);

// @desc    Get receipts for a specific task
// @route   GET /api/receipts/task/:taskId
// @access  Private
router.get('/task/:taskId', protect, getTaskReceipts);

// @desc    Get specific receipt details
// @route   GET /api/receipts/:receiptId
// @access  Private
router.get('/:receiptId', protect, getReceiptById);

// @desc    Download receipt as PDF
// @route   GET /api/receipts/:receiptId/download
// @access  Private
router.get('/:receiptId/download', protect, downloadReceiptPDF);

module.exports = router;