const receiptRepository = require("../../repository/receipt/receipt.repository");
const {
  generateReceiptPDF,
  generateReceiptsForCompletedTask,
} = require("../../shared/services/receiptService");
const logger = require("../../config/logger");

const transformReceipt = (receipt, userId) => ({
  receiptId: receipt._id,
  receiptNumber: receipt.receiptNumber,
  receiptType: receipt.receiptType,
  taskTitle: receipt.task?.title || receipt.taskDetails?.title,
  taskCategory: receipt.task?.categories?.[0] || receipt.taskDetails?.category,
  amount:
    receipt.receiptType === "payment"
      ? receipt.financial.totalPaid
      : receipt.financial.amountReceived,
  currency: receipt.financial.currency,
  serviceFee: receipt.financial.serviceFee,
  taxAmount: receipt.financial.tax.taxAmount,
  taxType: receipt.financial.tax.taxType,
  dateGenerated: receipt.generatedAt,
  dateCompleted:
    receipt.task?.completedAt || receipt.taskDetails?.dateCompleted,
  downloadCount: receipt.downloadCount,
  lastDownloaded: receipt.lastDownloadedAt,
  status: receipt.status,
  isMyPayment: receipt.poster.toString() === userId.toString(),
  isMyEarning: receipt.tasker.toString() === userId.toString(),
});

const getMyReceipts = async (userId, receiptType, page, limit) => {
  const query = {
    $or: [{ poster: userId }, { tasker: userId }],
  };

  if (receiptType && ["payment", "earnings"].includes(receiptType)) {
    query.receiptType = receiptType;
  }

  const skip = (page - 1) * limit;

  const [receipts, total] = await Promise.all([
    receiptRepository.findUserReceipts(userId, query, skip, limit),
    receiptRepository.countUserReceipts(query),
  ]);

  const transformedReceipts = receipts.map((r) => transformReceipt(r, userId));

  return {
    receipts: transformedReceipts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getReceiptById = async (receiptId, userId) => {
  const receipt = await receiptRepository.findReceiptById(receiptId);

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  const hasAccess =
    receipt.poster._id.toString() === userId.toString() ||
    receipt.tasker._id.toString() === userId.toString();

  if (!hasAccess) {
    throw new Error("Access denied");
  }

  return {
    receiptId: receipt._id,
    receiptNumber: receipt.receiptNumber,
    receiptType: receipt.receiptType,
    task: {
      id: receipt.task._id,
      title: receipt.task.title || receipt.taskDetails.title,
      category: receipt.task.categories?.[0] || receipt.taskDetails.category,
      location: receipt.task.location?.address || receipt.taskDetails.location,
      description: receipt.task.details || receipt.taskDetails.description,
      dateCompleted:
        receipt.task.completedAt || receipt.taskDetails.dateCompleted,
      status: receipt.task.status,
    },
    financial: {
      offerAmount: receipt.financial.offerAmount,
      serviceFee: receipt.financial.serviceFee,
      totalPaid: receipt.financial.totalPaid,
      amountReceived: receipt.financial.amountReceived,
      currency: receipt.financial.currency,
      tax: {
        type: receipt.financial.tax.taxType,
        rate: receipt.financial.tax.taxRate,
        amount: receipt.financial.tax.taxAmount,
        includedInServiceFee: receipt.financial.tax.taxIncludedInServiceFee,
      },
      stripe: {
        paymentIntentId: receipt.financial.stripe.paymentIntentId,
        transactionFee: receipt.financial.stripe.transactionFee || 0,
      },
    },
    people: {
      poster: {
        id: receipt.poster._id,
        name: `${receipt.poster.firstName} ${receipt.poster.lastName}`,
        email: receipt.poster.email,
      },
      tasker: {
        id: receipt.tasker._id,
        name: `${receipt.tasker.firstName} ${receipt.tasker.lastName}`,
        email: receipt.tasker.email,
      },
    },
    platform: receipt.platformInfo,
    metadata: {
      dateGenerated: receipt.generatedAt,
      downloadCount: receipt.downloadCount,
      lastDownloaded: receipt.lastDownloadedAt,
      status: receipt.status,
    },
    userRelation: {
      isMyPayment: receipt.poster._id.toString() === userId.toString(),
      isMyEarning: receipt.tasker._id.toString() === userId.toString(),
    },
  };
};

const downloadReceipt = async (receiptId, userId) => {
  const receipt = await receiptRepository.findReceiptById(receiptId);

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  const hasAccess =
    receipt.poster.toString() === userId.toString() ||
    receipt.tasker.toString() === userId.toString();

  if (!hasAccess) {
    throw new Error("Access denied");
  }

  const pdfDoc = await generateReceiptPDF(receiptId);

  return { pdfDoc, receiptNumber: receipt.receiptNumber };
};

const getTaskReceipts = async (userId, taskId) => {
  logger.info("Receipt request received", {
    service: "receipt.services",
    function: "getTaskReceipts",
    userId,
    taskId,
  });

  let receipts = await receiptRepository.findReceiptsByTask(taskId, userId);

  logger.info("Found receipts for task", {
    service: "receipt.services",
    function: "getTaskReceipts",
    userId,
    taskId,
    receiptCount: receipts.length,
  });

  if (!receipts || receipts.length === 0) {
    logger.debug("No receipts found, checking task status", {
      service: "receipt.services",
      function: "getTaskReceipts",
      taskId,
    });

    const task = await receiptRepository.findTaskById(taskId);
    if (!task) {
      logger.warn("Task not found", {
        service: "receipt.services",
        function: "getTaskReceipts",
        taskId,
      });
      throw new Error("Task not found");
    }

    logger.debug("Task details retrieved", {
      service: "receipt.services",
      function: "getTaskReceipts",
      taskId,
      taskStatus: task.status,
      createdBy: task.createdBy,
      assignedTo: task.assignedTo,
    });

    const hasAccess =
      task.createdBy.toString() === userId.toString() ||
      task.assignedTo?.toString() === userId.toString();

    if (!hasAccess) {
      logger.warn("User access denied to task", {
        service: "receipt.services",
        function: "getTaskReceipts",
        userId,
        taskId,
      });
      throw new Error("Access denied to this task");
    }

    if (task.status === "completed") {
      logger.info("Task is completed, attempting to generate receipts", {
        service: "receipt.services",
        function: "getTaskReceipts",
        taskId,
        taskStatus: task.status,
      });

      const completedPayment = await receiptRepository.findCompletedPayment(
        taskId
      );

      if (!completedPayment) {
        logger.warn("No completed payment found for task", {
          service: "receipt.services",
          function: "getTaskReceipts",
          taskId,
        });
        return {
          taskId: taskId,
          receipts: [],
          message: "No receipts available - payment not yet processed",
        };
      }

      const existingReceipts = await receiptRepository.findExistingReceipts(
        taskId
      );

      if (existingReceipts.length > 0) {
        logger.info("Found existing receipts, skipping generation", {
          service: "receipt.services",
          function: "getTaskReceipts",
          taskId,
          existingReceiptCount: existingReceipts.length,
        });

        const userReceipts = existingReceipts.filter(
          (receipt) =>
            receipt.poster.toString() === userId.toString() ||
            receipt.tasker.toString() === userId.toString()
        );

        if (userReceipts.length > 0) {
          const transformedReceipts = userReceipts.map((receipt) => ({
            receiptId: receipt._id,
            receiptNumber: receipt.receiptNumber,
            receiptType: receipt.receiptType,
            amount:
              receipt.receiptType === "payment"
                ? receipt.financial.totalPaid
                : receipt.financial.amountReceived,
            currency: receipt.financial.currency,
            dateGenerated: receipt.generatedAt,
            downloadCount: receipt.downloadCount,
            canDownload: true,
          }));

          return {
            taskId: taskId,
            receipts: transformedReceipts,
          };
        }
      }

      logger.info("Generating receipts for completed task", {
        service: "receipt.services",
        function: "getTaskReceipts",
        taskId,
      });
      await generateReceiptsForCompletedTask(taskId);

      receipts = await receiptRepository.findReceiptsByTask(taskId, userId);
    } else {
      logger.info("No receipts available - task not completed", {
        service: "receipt.services",
        function: "getTaskReceipts",
        taskId,
        taskStatus: task.status,
      });
      throw new Error(
        task.status === "completed"
          ? "Receipts are being generated, please try again in a few moments"
          : "Receipts will be available when the task is completed"
      );
    }
  }

  const userRelevantReceipts = [];

  const paymentReceipts = receipts.filter(
    (r) =>
      r.receiptType === "payment" && r.poster.toString() === userId.toString()
  );

  if (paymentReceipts.length > 0) {
    const latestPaymentReceipt = paymentReceipts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
    userRelevantReceipts.push(latestPaymentReceipt);
    logger.debug("Added payment receipt for poster", {
      service: "receipt.services",
      function: "getTaskReceipts",
      receiptNumber: latestPaymentReceipt.receiptNumber,
      userId,
    });
  }

  const earningsReceipts = receipts.filter(
    (r) =>
      r.receiptType === "earnings" && r.tasker.toString() === userId.toString()
  );

  if (earningsReceipts.length > 0) {
    const latestEarningsReceipt = earningsReceipts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
    userRelevantReceipts.push(latestEarningsReceipt);
    logger.debug("Added earnings receipt for tasker", {
      service: "receipt.services",
      function: "getTaskReceipts",
      receiptNumber: latestEarningsReceipt.receiptNumber,
      userId,
    });
  }

  const transformedReceipts = userRelevantReceipts.map((receipt) => ({
    receiptId: receipt._id,
    receiptNumber: receipt.receiptNumber,
    receiptType: receipt.receiptType,
    amount:
      receipt.receiptType === "payment"
        ? receipt.financial.totalPaid
        : receipt.financial.amountReceived,
    currency: receipt.financial.currency,
    dateGenerated: receipt.generatedAt,
    downloadCount: receipt.downloadCount,
    canDownload: true,
    status: "generated",
  }));

  logger.info("Returning filtered receipts", {
    service: "receipt.services",
    function: "getTaskReceipts",
    taskId,
    receiptCount: transformedReceipts.length,
    userId,
  });

  return {
    taskId: taskId,
    receipts: transformedReceipts,
  };
};

module.exports = {
  getMyReceipts,
  getReceiptById,
  downloadReceipt,
  getTaskReceipts,
};
