const receiptService = require("../../servicesN/receipts/receipt.services");
const logger = require("../../config/logger");

exports.getMyReceipts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiptType, page = 1, limit = 10 } = req.query;

    const result = await receiptService.getMyReceipts(
      userId,
      receiptType,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching receipts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch receipts",
      message: error.message,
    });
  }
};

exports.getReceiptById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiptId } = req.params;

    const receiptDetails = await receiptService.getReceiptById(
      receiptId,
      userId
    );

    res.json({
      success: true,
      data: receiptDetails,
    });
  } catch (error) {
    logger.error("Error fetching receipt details:", error);
    const statusCode =
      error.message === "Receipt not found"
        ? 404
        : error.message === "Access denied"
        ? 403
        : 500;
    res.status(statusCode).json({
      success: false,
      error: "Failed to fetch receipt details",
      message: error.message,
    });
  }
};

exports.downloadReceiptPDF = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiptId } = req.params;

    const { pdfDoc, receiptNumber } = await receiptService.downloadReceipt(
      receiptId,
      userId
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${receiptNumber}.pdf"`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    logger.error("Error downloading receipt PDF:", error);

    if (!res.headersSent) {
      const statusCode =
        error.message === "Receipt not found"
          ? 404
          : error.message === "Access denied"
          ? 403
          : 500;
      res.status(statusCode).json({
        success: false,
        error: "Failed to generate receipt PDF",
        message: error.message,
      });
    }
  }
};

exports.getTaskReceipts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    const result = await receiptService.getTaskReceipts(userId, taskId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching task receipts:", error);
    const statusCode =
      error.message === "Task not found" ||
      error.message === "Receipt not found"
        ? 404
        : error.message.includes("Access denied")
        ? 403
        : 500;
    res.status(statusCode).json({
      success: false,
      error: "Failed to fetch task receipts",
      message: error.message,
    });
  }
};


