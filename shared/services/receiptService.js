// services/receiptService.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Receipt = require("../../models/payment/Receipt");
const Task = require("../../models/task/Task");
const Offer = require("../../models/task/Offer");
const Payment = require("../../models/payment/Payment");
const User = require("../../models/user/User");
const logger = require("../../config/logger");

/**
 * Tax configuration for different countries
 */
const TAX_CONFIG = {
  // Australia GST
  AU: {
    taxType: "GST",
    taxRate: 10, // 10% GST
    taxIncludedInServiceFee: true,
  },
  // New Zealand GST
  NZ: {
    taxType: "GST",
    taxRate: 15, // 15% GST
    taxIncludedInServiceFee: true,
  },
  // Sri Lanka VAT
  LK: {
    taxType: "VAT",
    taxRate: 18, // 18% VAT
    taxIncludedInServiceFee: true,
  },
};

/**
 * Get country from currency code
 */
const getCountryFromCurrency = (currency) => {
  const currencyToCountry = {
    AUD: "AU",
    NZD: "NZ",
    LKR: "LK",
    USD: "US", // Default fallback
  };
  return currencyToCountry[currency.toUpperCase()] || "US";
};

/**
 * Calculate tax breakdown from service fee
 */
const calculateTaxBreakdown = (serviceFee, currency) => {
  const country = getCountryFromCurrency(currency);
  const taxConfig = TAX_CONFIG[country];

  if (!taxConfig) {
    return {
      taxType: "None",
      taxRate: 0,
      taxAmount: 0,
      taxIncludedInServiceFee: false,
    };
  }

  // Tax is included in service fee, so we calculate the tax component
  const taxAmount = taxConfig.taxIncludedInServiceFee
    ? (serviceFee * taxConfig.taxRate) / (100 + taxConfig.taxRate)
    : (serviceFee * taxConfig.taxRate) / 100;

  return {
    taxType: taxConfig.taxType,
    taxRate: taxConfig.taxRate,
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxIncludedInServiceFee: taxConfig.taxIncludedInServiceFee,
  };
};

/**
 * Generate receipt for completed task
 */
const generateReceipt = async (taskId, receiptType = "payment") => {
  try {
    // Fetch all related data
    const task = await Task.findById(taskId)
      .populate("createdBy", "firstName lastName email phone")
      .populate("assignedTo", "firstName lastName email phone");

    if (!task) {
      throw new Error("Task not found");
    }

    const offer = await Offer.findOne({
      taskId: task._id,
      status: { $in: ["accepted", "completed"] },
    }).populate("taskTakerId", "firstName lastName email");

    if (!offer) {
      throw new Error("No accepted offer found for task");
    }

    const payment = await Payment.findOne({
      task: task._id,
      offer: offer._id,
      status: "completed",
    });

    if (!payment) {
      throw new Error("No completed payment found for task");
    }

    // Calculate tax breakdown
    const taxBreakdown = calculateTaxBreakdown(
      payment.serviceFee,
      payment.currency
    );

    // Determine receipt recipients based on type
    // Handle cases where users might be deleted from database
    const poster = task.createdBy;
    const tasker = offer.taskTakerId;

    // Get raw IDs from task if population failed
    const rawTask = await Task.findById(taskId).select("createdBy assignedTo");
    const posterId = poster?._id || rawTask.createdBy;
    const taskerId = tasker?._id || rawTask.assignedTo;

    if (!posterId) {
      throw new Error("Cannot determine poster ID - task.createdBy is missing");
    }

    if (!taskerId) {
      throw new Error(
        "Cannot determine tasker ID - task.assignedTo is missing"
      );
    }

    logger.info("Receipt generation started", {
      service: "receiptService",
      function: "generateReceipt",
      taskId,
      receiptType,
      posterId,
      taskerId,
    });

    // Create receipt data
    const receiptData = {
      task: task._id,
      offer: offer._id,
      payment: payment._id,
      poster: posterId,
      tasker: taskerId,
      receiptType: receiptType,

      // Financial details
      financial: {
        offerAmount: payment.amount,
        serviceFee: payment.serviceFee,
        totalPaid:
          receiptType === "payment"
            ? payment.amount + payment.serviceFee
            : payment.amount,
        amountReceived:
          receiptType === "earnings" ? payment.taskerAmount : payment.amount,
        currency: payment.currency,

        // Tax information
        tax: taxBreakdown,

        // Stripe details
        stripe: {
          paymentIntentId: payment.paymentIntentId,
          chargeId: payment.metadata?.chargeId || null,
          transactionFee: payment.metadata?.stripeFee || 0,
        },
      },

      // Task details snapshot
      taskDetails: {
        title: task.title,
        category: task.categories?.[0] || "General",
        location: task.location?.address || "Not specified",
        dateCompleted: task.completedAt || new Date(),
        description: task.details,
      },

      // Platform information
      platformInfo: {
        name: "MyToDoo",
        address: "Australia | New Zealand | Sri Lanka",
        abn: "ABN: 123 456 789",
        email: "support@mytodoo.com",
        phone: "+61 2 1234 5678",
      },

      status: "generated",
    };

    // Generate receipt number manually as fallback
    if (!receiptData.receiptNumber) {
      try {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        // Find the last receipt number for today
        const lastReceipt = await Receipt.findOne({
          receiptNumber: new RegExp(`^MT${year}${month}${day}`),
        }).sort({ receiptNumber: -1 });

        let sequence = 1;
        if (lastReceipt) {
          const lastSequence = parseInt(lastReceipt.receiptNumber.slice(-4));
          sequence = lastSequence + 1;
        }

        // Format: MT20251008-0001 (MyToDoo + YYYYMMDD + sequence)
        receiptData.receiptNumber = `MT${year}${month}${day}-${String(
          sequence
        ).padStart(4, "0")}`;
      } catch (error) {
        logger.error("Error generating receipt number", {
          service: "receiptService",
          function: "generateReceipt",
          error: error.message,
        });
        // Fallback to timestamp-based number
        receiptData.receiptNumber = `MT${Date.now()}`;
      }
    }

    // Save receipt to database
    const receipt = new Receipt(receiptData);
    await receipt.save();

    return receipt;
  } catch (error) {
    logger.error("Error generating receipt", {
      service: "receiptService",
      function: "generateReceipt",
      taskId,
      receiptType,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to generate receipt: ${error.message}`);
  }
};

/**
 * Generate PDF receipt document
 */
const generateReceiptPDF = async (receiptId) => {
  try {
    const receipt = await Receipt.findById(receiptId)
      .populate("task", "title categories location details completedAt")
      .populate("poster", "firstName lastName email")
      .populate("tasker", "firstName lastName email")
      .populate("payment", "paymentIntentId amount serviceFee currency");

    if (!receipt) {
      throw new Error("Receipt not found");
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    let y = 50;

    // Helper function to add text
    const addText = (text, x = 50, options = {}) => {
      doc.text(text, x, y, options);
      y += options.lineGap || 20;
    };

    // Add MyToDoo logo (SVG converted to drawing commands)
    const logoY = y;
    const logoX = 450; // Right side of the page

    // Draw MyToDoo logo components
    // Orange bars
    doc.rect(logoX, logoY + 15, 25, 5).fill("#FF8C42");
    doc.rect(logoX + 65, logoY + 15, 25, 5).fill("#FF8C42");

    // Green circle with "0"
    doc.circle(logoX + 45, logoY + 17.5, 8).fill("#7ED321");
    doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold");
    doc.text("0", logoX + 42, logoY + 14, { width: 6, align: "center" });

    // Orange T-shaped connector
    doc.rect(logoX + 25, logoY + 15, 40, 5).fill("#FF8C42");
    doc.rect(logoX + 42.5, logoY + 20, 5, 15).fill("#FF8C42");

    // MyToDoo text
    doc.fillColor("#CCCCCC").fontSize(8).font("Helvetica-Bold");
    doc.text("MYTODOO", logoX + 25, logoY + 38, { width: 40, align: "center" });

    // Reset color for rest of document
    doc.fillColor("#000000");

    // Header
    doc.fontSize(20).font("Helvetica-Bold");
    addText("PAYMENT RECEIPT", 50, { align: "left", lineGap: 30 });

    doc.fontSize(12).font("Helvetica");
    addText(`Receipt #: ${receipt.receiptNumber}`, 50, { lineGap: 15 });
    addText(`Date: ${receipt.generatedAt.toLocaleDateString()}`, 50, {
      lineGap: 15,
    });

    // Platform info
    y += 10;
    doc.fontSize(14).font("Helvetica-Bold");
    addText(receipt.platformInfo.name, 50, { lineGap: 15 });
    doc.fontSize(10).font("Helvetica");
    addText(receipt.platformInfo.address, 50, { lineGap: 12 });
    addText(`Email: ${receipt.platformInfo.email}`, 50, { lineGap: 12 });
    addText(`Phone: ${receipt.platformInfo.phone}`, 50, { lineGap: 12 });

    if (receipt.platformInfo.abn) {
      addText(receipt.platformInfo.abn, 50, { lineGap: 12 });
    }

    // Bill to section
    y += 20;
    doc.fontSize(14).font("Helvetica-Bold");
    const recipient =
      receipt.receiptType === "payment" ? receipt.poster : receipt.tasker;
    const recipientLabel =
      receipt.receiptType === "payment" ? "Bill To:" : "Payment To:";

    addText(recipientLabel, 50, { lineGap: 15 });
    doc.fontSize(11).font("Helvetica");
    addText(`${recipient.firstName} ${recipient.lastName}`, 50, {
      lineGap: 12,
    });
    addText(recipient.email, 50, { lineGap: 12 });

    // Task details
    y += 20;
    doc.fontSize(14).font("Helvetica-Bold");
    addText("Task Details:", 50, { lineGap: 15 });
    doc.fontSize(11).font("Helvetica");
    addText(`Title: ${receipt.taskDetails.title}`, 50, { lineGap: 12 });
    addText(`Category: ${receipt.taskDetails.category}`, 50, { lineGap: 12 });
    addText(`Location: ${receipt.taskDetails.location}`, 50, { lineGap: 12 });
    addText(
      `Completed: ${receipt.taskDetails.dateCompleted.toLocaleDateString()}`,
      50,
      { lineGap: 12 }
    );

    // Payment breakdown
    y += 20;
    doc.fontSize(14).font("Helvetica-Bold");
    addText("Payment Breakdown:", 50, { lineGap: 15 });

    // Create a table-like structure
    const startY = y;
    const lineHeight = 15;

    doc.fontSize(11).font("Helvetica");

    // Table headers
    doc.text("Description", 50, y);
    doc.text("Amount", 400, y, { align: "right", width: 100 });
    y += lineHeight;

    // Draw line under headers
    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 5;

    // Task amount
    doc.text(`Task Amount`, 50, y);
    doc.text(
      `${receipt.financial.currency} ${receipt.financial.offerAmount.toFixed(
        2
      )}`,
      400,
      y,
      { align: "right", width: 100 }
    );
    y += lineHeight;

    // Service fee
    doc.text(
      `Service Fee (${(
        (receipt.financial.serviceFee / receipt.financial.offerAmount) *
        100
      ).toFixed(1)}%)`,
      50,
      y
    );
    doc.text(
      `${receipt.financial.currency} ${receipt.financial.serviceFee.toFixed(
        2
      )}`,
      400,
      y,
      { align: "right", width: 100 }
    );
    y += lineHeight;

    // Tax breakdown if applicable
    if (receipt.financial.tax.taxAmount > 0) {
      doc.text(
        `${receipt.financial.tax.taxType} (${receipt.financial.tax.taxRate}%) - Included in Service Fee`,
        50,
        y
      );
      doc.text(
        `${
          receipt.financial.currency
        } ${receipt.financial.tax.taxAmount.toFixed(2)}`,
        400,
        y,
        { align: "right", width: 100 }
      );
      y += lineHeight;
    }

    // Stripe transaction fee if available
    if (receipt.financial.stripe.transactionFee > 0) {
      doc.text(`Payment Processing Fee`, 50, y);
      doc.text(
        `${
          receipt.financial.currency
        } ${receipt.financial.stripe.transactionFee.toFixed(2)}`,
        400,
        y,
        { align: "right", width: 100 }
      );
      y += lineHeight;
    }

    // Total line
    y += 5;
    doc.moveTo(350, y).lineTo(500, y).stroke();
    y += 10;

    doc.fontSize(12).font("Helvetica-Bold");
    const totalLabel =
      receipt.receiptType === "payment" ? "Total Paid:" : "Amount Received:";
    const totalAmount =
      receipt.receiptType === "payment"
        ? receipt.financial.totalPaid
        : receipt.financial.amountReceived;

    doc.text(totalLabel, 50, y);
    doc.text(
      `${receipt.financial.currency} ${totalAmount.toFixed(2)}`,
      400,
      y,
      { align: "right", width: 100 }
    );
    y += 30;

    // Payment method
    doc.fontSize(11).font("Helvetica");
    addText("Payment Method: Credit/Debit Card via Stripe", 50, {
      lineGap: 12,
    });
    addText(`Transaction ID: ${receipt.financial.stripe.paymentIntentId}`, 50, {
      lineGap: 12,
    });

    // Footer
    y += 30;
    doc.fontSize(10).font("Helvetica");
    addText("Thank you for using MyToDoo!", 50, {
      align: "center",
      lineGap: 15,
    });
    addText("This is a computer-generated receipt.", 50, {
      align: "center",
      lineGap: 10,
    });

    // Update receipt download count
    receipt.downloadCount += 1;
    receipt.lastDownloadedAt = new Date();
    receipt.status = "downloaded";
    await receipt.save();

    return doc;
  } catch (error) {
    logger.error("Error generating PDF receipt", {
      service: "receiptService",
      function: "generateReceiptPDF",
      receiptId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to generate PDF receipt: ${error.message}`);
  }
};

/**
 * Generate receipts for both poster and tasker when task is completed
 */
const generateReceiptsForCompletedTask = async (taskId) => {
  try {
    logger.info("Generating receipts for completed task", {
      service: "receiptService",
      function: "generateReceiptsForCompletedTask",
      taskId,
    });

    // Check if receipts already exist to prevent duplicates
    const Receipt = require("../models/payment/Receipt");
    const existingReceipts = await Receipt.find({ task: taskId });

    if (existingReceipts.length > 0) {
      logger.warn("Receipts already exist for task, returning existing ones", {
        service: "receiptService",
        function: "generateReceiptsForCompletedTask",
        taskId,
        existingCount: existingReceipts.length,
      });
      const paymentReceipt = existingReceipts.find(
        (r) => r.receiptType === "payment"
      );
      const earningsReceipt = existingReceipts.find(
        (r) => r.receiptType === "earnings"
      );

      return {
        paymentReceipt: paymentReceipt || existingReceipts[0],
        earningsReceipt: earningsReceipt || existingReceipts[0],
      };
    }

    // Generate payment receipt for poster (person who paid)
    const paymentReceipt = await generateReceipt(taskId, "payment");
    logger.info("Payment receipt generated", {
      service: "receiptService",
      function: "generateReceiptsForCompletedTask",
      taskId,
      receiptNumber: paymentReceipt.receiptNumber,
    });

    // Generate earnings receipt for tasker (person who did the work)
    const earningsReceipt = await generateReceipt(taskId, "earnings");
    logger.info("Earnings receipt generated", {
      service: "receiptService",
      function: "generateReceiptsForCompletedTask",
      taskId,
      receiptNumber: earningsReceipt.receiptNumber,
    });

    return {
      paymentReceipt,
      earningsReceipt,
    };
  } catch (error) {
    logger.error("Error generating receipts for completed task", {
      service: "receiptService",
      function: "generateReceiptsForCompletedTask",
      taskId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Get user's receipts
 */
const getUserReceipts = async (userId, receiptType = null) => {
  try {
    const query = {
      $or: [{ poster: userId }, { tasker: userId }],
    };

    if (receiptType) {
      query.receiptType = receiptType;
    }

    const receipts = await Receipt.find(query)
      .populate("task", "title categories completedAt")
      .populate("poster", "firstName lastName")
      .populate("tasker", "firstName lastName")
      .sort({ createdAt: -1 });

    return receipts;
  } catch (error) {
    logger.error("Error fetching user receipts", {
      service: "receiptService",
      function: "getUserReceipts",
      userId,
      receiptType,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  generateReceipt,
  generateReceiptPDF,
  generateReceiptsForCompletedTask,
  getUserReceipts,
  TAX_CONFIG,
  calculateTaxBreakdown,
};
