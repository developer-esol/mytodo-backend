const Task = require("../models/Task");
const Offer = require("../models/Offer");
const TransAction = require("../models/TransActions");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");
const { formatUserObject, formatCurrency, formatCurrencyObject } = require('../utils/userUtils');
const User = require("../models/User");
const { generateReceiptsForCompletedTask } = require('../services/receiptService');
const notificationService = require('../services/notificationService');

const calculateServiceFee = (amount) => {
  const fee = amount * 0.1; // 10% service fee
  return Math.max(fee, 1); // Minimum $1 fee
};

const getDateRange = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const isValidObjectId = mongoose.Types.ObjectId.isValid;

exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const {section, subsection} = req.query;
    const now = new Date();

    if (!isValidObjectId(userId)) {
      return res.status(400).json({success: false, message: "Invalid user ID"});
    }

    let query = {};

    switch (section) {
      case "all-tasks":
        switch (subsection) {
          case "open":
            const offeredTaskIds = await Offer.find({
              taskTakerId: userId,
              status: {$ne: "rejected"},
            }).distinct("taskId");

            query = {
              $or: [
                {createdBy: userId, status: "open"},
                {
                  _id: {$in: offeredTaskIds},
                  status: "open",
                  createdBy: {$ne: userId},
                },
              ],
            };
            break;

          case "todo":
            // Get both directly assigned tasks AND tasks from transactions
            const transactionTaskIds = await TransAction.find({
              taskerId: userId,
              status: "todo",
            }).distinct("taskId");

            query = {
              status: "todo",
              $or: [
                {createdBy: userId}, // Tasks I created
                {assignedTo: userId}, // Tasks directly assigned to me
                {_id: {$in: transactionTaskIds || []}}, // Tasks from transactions
              ],
            };
            break;
          case "completed":
            query = {
              $or: [
                {createdBy: userId, status: "completed"},
                {assignedTo: userId, status: "completed"},
              ],
            };
            break;

          default:
            // Keep original all-tasks behavior for other subsections
            const defaultOfferedTaskIds = await Offer.find({
              taskTakerId: userId,
              status: {$ne: "rejected"},
            }).distinct("taskId");

            query.$or = [
              {createdBy: userId},
              {assignedTo: userId},
              {_id: {$in: defaultOfferedTaskIds || []}},
            ];
        }
        break;

      case "posted-tasks":
        query.createdBy = userId;
        if (subsection) {
          if (subsection === "overdue") {
            query.$or = [
              {status: "open", "dateRange.end": {$lt: now}},
              {status: "todo", "dateRange.end": {$lt: now}},
            ];
          } else if (subsection === "expired") {
            query.status = "open";
            query["dateRange.end"] = {
              $lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            };
          } else {
            query.status = subsection;
          }
        }
        break;

      case "todo-tasks":
        // Get all tasks the user is involved with (doing for others)
        const taskIdsForUser = await TransAction.find({
          taskerId: userId,
          status: {$in: ["todo", "done", "completed"]},
        }).distinct("taskId");

        query = {
          _id: {$in: taskIdsForUser || []},
          createdBy: {$ne: userId}, // Only others' tasks
        };

        // Apply subsection filters
        switch (subsection) {
          case "open":
            // Tasks where user has made offers but not yet assigned
            const offeredTaskIds = await Offer.find({
              taskTakerId: userId,
              status: "pending",
            }).distinct("taskId");

            query = {
              _id: {$in: offeredTaskIds || []},
              status: "open",
              createdBy: {$ne: userId},
            };
            break;

          case "todo":
            const transactionTaskIds = await TransAction.find({
              taskerId: userId,
              status: "todo",
            }).distinct("taskId");

            query = {
              status: "todo",
              $or: [
                {createdBy: userId}, // Tasks I created
                {assignedTo: userId}, // Tasks directly assigned to me
                {_id: {$in: transactionTaskIds || []}}, // Tasks from transactions
              ],
            };
            break;

          case "done":
            // Tasks user has marked done but awaiting confirmation
            query.status = "done";
            break;

          case "completed":
            // Tasks user has completed for others
            query.status = "completed";
            break;

          default:
            // Show all tasks user is involved with (default behavior)
            break;
        }
        break;

      case "completed-tasks":
        query.$or = [
          {createdBy: userId, status: "completed"},
          {assignedTo: userId, status: "completed"},
        ];
        break;

      case "overdue-tasks":
        query.$or = [
          {status: "open", "dateRange.end": {$lt: now}, createdBy: userId},
          {status: "todo", "dateRange.end": {$lt: now}, assignedTo: userId},
        ];
        break;

      default:
        return res
          .status(400)
          .json({success: false, message: "Invalid section"});
    }

    // Additional status filtering for non-special cases
    if (
      !["overdue-tasks", "completed-tasks"].includes(section) &&
      subsection &&
      !["open", "todo", "completed", "overdue", "expired"].includes(subsection)
    ) {
      query.status = subsection;
    }

    const tasks = await Task.find(query)
      .populate("createdBy", "firstName lastName avatar rating")
      .populate("assignedTo", "firstName lastName avatar rating")
      .sort({"dateRange.end": 1, createdAt: -1})
      .lean();

    // For each task, get the relevant offer information
    const tasksWithOffers = await Promise.all(tasks.map(async (task) => {
      let relevantOffer = null;
      
      // Find the relevant offer for this task
      if (section === "posted-tasks") {
        // For posted tasks, we want to show the TASK BUDGET, not offer amounts
        // But we can include offer information for reference
        relevantOffer = await Offer.findOne({
          taskId: task._id,
          status: { $in: ["accepted", "pending"] }
        })
        .populate("taskTakerId", "firstName lastName avatar rating")
        .sort({ status: -1, createdAt: -1 }) // Accepted offers first, then by newest
        .lean();
      } else {
        // For other sections (todo-tasks, etc.), get the user's specific offer
        relevantOffer = await Offer.findOne({
          taskId: task._id,
          taskTakerId: userId
        })
        .populate("taskTakerId", "firstName lastName avatar rating")
        .lean();
      }

      // Create enhanced task object
      const enhancedTask = {
        ...task,
        // Always preserve original task information
        taskBudget: task.budget,
        taskCurrency: task.currency,
        formattedTaskBudget: formatCurrency(task.budget, task.currency),
        taskCurrencyInfo: formatCurrencyObject(task.budget, task.currency),
      };

      // Add completion permissions for todo tasks
      if (task.status === "todo") {
        const userIdString = userId.toString();
        const isTaskCreator = task.createdBy && task.createdBy._id.toString() === userIdString;
        const isAssignedTasker = task.assignedTo && task.assignedTo._id.toString() === userIdString;
        
        console.log('Task completion check:', {
          taskId: task._id,
          taskStatus: task.status,
          userIdString,
          createdBy: task.createdBy?._id.toString(),
          assignedTo: task.assignedTo?._id.toString(),
          isTaskCreator,
          isAssignedTasker
        });
        
        // Only the task CREATOR (poster) can mark the task as complete
        // The task poster is the one who made the payment and should mark completion
        enhancedTask.canComplete = isTaskCreator;
        enhancedTask.completionButtonText = isTaskCreator ? "Mark as Complete" : null;
        enhancedTask.completionAction = isTaskCreator ? "complete" : null;
        enhancedTask.userRole = isTaskCreator ? "creator" : (isAssignedTasker ? "assignee" : "none");
        enhancedTask.showCompleteButton = isTaskCreator; // Only show to task poster
        enhancedTask.showCancelButton = isTaskCreator; // Only creator can cancel
      } else {
        enhancedTask.canComplete = false;
        enhancedTask.completionButtonText = null;
        enhancedTask.completionAction = null;
        enhancedTask.userRole = "none";
        enhancedTask.showCompleteButton = false;
        enhancedTask.showCancelButton = false;
      }

      // Add general action flags that frontend can use
      enhancedTask.actions = {
        canComplete: enhancedTask.canComplete, // Only task creator can complete
        canCancel: enhancedTask.showCancelButton, // Only task creator can cancel
        canEdit: task.createdBy && task.createdBy._id.toString() === userId.toString() && task.status === "open",
        canView: true
      };

      if (section === "posted-tasks") {
        // For posted tasks, show TASK BUDGET as the main amount
        enhancedTask.budget = task.budget;
        enhancedTask.currency = task.currency;
        enhancedTask.formattedBudget = formatCurrency(task.budget, task.currency);
        enhancedTask.currencyInfo = formatCurrencyObject(task.budget, task.currency);
        
        // Include offer information as additional data (not main display amount)
        if (relevantOffer) {
          enhancedTask.acceptedOffer = {
            _id: relevantOffer._id,
            amount: relevantOffer.offer.amount,
            currency: relevantOffer.offer.currency,
            formattedAmount: formatCurrency(relevantOffer.offer.amount, relevantOffer.offer.currency),
            message: relevantOffer.offer.message,
            status: relevantOffer.status,
            createdAt: relevantOffer.createdAt,
            tasker: relevantOffer.taskTakerId
          };
        }
      } else {
        // For tasks where user made offers, show USER'S OFFER AMOUNT as main amount
        if (relevantOffer) {
          enhancedTask.budget = relevantOffer.offer.amount;
          enhancedTask.currency = relevantOffer.offer.currency;
          enhancedTask.formattedBudget = formatCurrency(relevantOffer.offer.amount, relevantOffer.offer.currency);
          enhancedTask.currencyInfo = formatCurrencyObject(relevantOffer.offer.amount, relevantOffer.offer.currency);
          
          enhancedTask.userOffer = {
            _id: relevantOffer._id,
            amount: relevantOffer.offer.amount,
            currency: relevantOffer.offer.currency,
            formattedAmount: formatCurrency(relevantOffer.offer.amount, relevantOffer.offer.currency),
            message: relevantOffer.offer.message,
            status: relevantOffer.status,
            createdAt: relevantOffer.createdAt
          };
        } else {
          // If no offer found, show task budget as fallback
          enhancedTask.budget = task.budget;
          enhancedTask.currency = task.currency;
          enhancedTask.formattedBudget = formatCurrency(task.budget, task.currency);
          enhancedTask.currencyInfo = formatCurrencyObject(task.budget, task.currency);
        }
      }

      return enhancedTask;
    }));

    res.status(200).json({success: true, data: tasksWithOffers});
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const {taskId} = req.params;
    const {newStatus} = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(taskId)) {
      return res.status(400).json({success: false, error: "Invalid task ID"});
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({success: false, error: "Task not found"});
    }

    // Enhanced status transition validation
    const validTransitions = {
      open: ["todo", "expired"],
      todo: ["done", "overdue"],
      done: ["completed"],
      completed: [],
      expired: [],
      overdue: [],
    };

    if (!validTransitions[task.status]?.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from ${task.status} to ${newStatus}`,
      });
    }

    // Enhanced permission checks
    switch (newStatus) {
      case "todo":
        if (userId.toString() !== task.createdBy.toString()) {
          return res.status(403).json({
            success: false,
            error: "Only task creator can accept offers",
          });
        }
        break;

      case "done":
        if (
          !task.assignedTo ||
          userId.toString() !== task.assignedTo.toString()
        ) {
          return res.status(403).json({
            success: false,
            error: "Only assigned user can mark task as done",
          });
        }
        task.doneAt = new Date();
        break;

      case "completed":
        if (userId.toString() !== task.createdBy.toString()) {
          return res.status(403).json({
            success: false,
            error: "Only task creator can confirm completion",
          });
        }
        task.completedAt = new Date();

        // Update related offer and transaction
        await Promise.all([
          Offer.findOneAndUpdate(
            {taskId, status: "accepted"},
            {status: "completed", completedAt: new Date()}
          ),
          TransAction.updateMany({taskId}, {$set: {taskStatus: "completed"}}),
        ]);
        break;

      case "expired":
      case "overdue":
        // System-generated statuses only
        return res.status(403).json({
          success: false,
          error: "This status can only be set by the system",
        });
    }

    // Update task
    task.status = newStatus;
    task.statusHistory = task.statusHistory || [];
    task.statusHistory.push({
      status: newStatus,
      changedBy: userId,
      changedAt: new Date(),
      reason: req.body.reason || `Changed to ${newStatus}`,
    });

    await task.save();

    // Sync with transaction table (corrected case sensitivity)
    if (newStatus !== "completed") {
      // Already handled above for completed
      await TransAction.updateMany({taskId}, {$set: {taskStatus: newStatus}});
    }

    res.status(200).json({success: true, data: task});
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
};
exports.getMyOffers = async (req, res) => {
  try {
    const userId = req.user._id;
    const {status} = req.query;

    // Validate user ID
    if (!isValidObjectId(userId)) {
      return res.status(400).json({success: false, message: "Invalid user ID"});
    }

    let query = {taskTakerId: userId};
    if (status) {
      query.status = status;
    }

    const offers = await Offer.find(query)
      .populate("taskId", "title budget dateRange status")
      .populate("taskCreatorId", "firstName lastName avatar rating")
      .sort({createdAt: -1});

    res.status(200).json({success: true, data: offers});
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const { calculateVotes } = require('../utils/taskStatus.utils');

exports.completeTask = async (req, res) => {
  try {
    const {taskId} = req.params;
    const userId = req.user._id;

    // Validate task ID
    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // Find the task and check permissions
    const task = await Task.findOne({
      _id: taskId,
      status: "todo", // Only todo tasks can be completed
      $or: [
        {createdBy: userId}, // Task creator can complete
        {assignedTo: userId}, // Assigned tasker can complete
      ],
    }).populate("createdBy assignedTo", "firstName lastName avatar rating completedTasks");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not in correct state",
      });
    }

    // Find the accepted offer for this task
    const acceptedOffer = await Offer.findOne({
      taskId: taskId,
      status: "accepted"
    });

    if (!acceptedOffer) {
      return res.status(404).json({
        success: false,
        message: "No accepted offer found for this task"
      });
    }

    // Calculate votes based on task budget and offer amount
    const { posterVotes, taskerVotes } = calculateVotes(task.budget, acceptedOffer.offer.amount);

    // Update task status
    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    // CRITICAL: Update payment status FIRST before generating receipts
    console.log(`💳 Updating payment status to completed for task ${taskId}...`);
    await Payment.updateMany(
      {task: taskId}, 
      {$set: {status: "completed", updatedAt: new Date()}}
    );
    console.log(`✅ Payment status updated to completed`);

    // Update task poster's vote count
    await User.findByIdAndUpdate(task.createdBy._id, {
      $inc: { completedTasks: posterVotes }
    });

    // Update tasker's vote count
    await User.findByIdAndUpdate(task.assignedTo._id, {
      $inc: { completedTasks: taskerVotes }
    });

    // Update offer status
    await Offer.findOneAndUpdate(
      {
        taskId: taskId,
        status: "accepted",
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          posterVotes,
          taskerVotes
        },
      }
    );

    // Generate receipts for both poster and tasker when task is completed
    try {
      console.log(`🔄 Attempting to generate receipts for completed task ${taskId}...`);
      const receipts = await generateReceiptsForCompletedTask(taskId);
      console.log(`✅ Receipts successfully generated for task ${taskId}:`, {
        paymentReceipt: receipts.paymentReceipt.receiptNumber,
        earningsReceipt: receipts.earningsReceipt.receiptNumber
      });
      
      // Send receipt ready notifications
      if (receipts.paymentReceipt) {
        try {
          const poster = await User.findById(task.createdBy._id);
          await notificationService.notifyReceiptReady(receipts.paymentReceipt, task, poster);
        } catch (notifError) {
          console.error("Error sending poster receipt notification:", notifError);
        }
      }
      
      if (receipts.earningsReceipt) {
        try {
          const tasker = await User.findById(task.assignedTo._id);
          await notificationService.notifyReceiptReady(receipts.earningsReceipt, task, tasker);
        } catch (notifError) {
          console.error("Error sending tasker receipt notification:", notifError);
        }
      }
    } catch (receiptError) {
      console.error(`❌ Failed to generate receipts for task ${taskId}:`, {
        error: receiptError.message,
        stack: receiptError.stack
      });
      // Don't fail the task completion if receipt generation fails
      // Receipts can be generated later via the API
    }

    res.status(200).json({
      success: true,
      data: task,
      message: "Task completed successfully",
    });
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to complete task",
    });
  }
};

exports.checkTaskCompletionStatus = async (req, res) => {
  try {
    const {taskId} = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId).populate("createdBy assignedTo", "firstName lastName");
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isTaskCreator = task.createdBy && task.createdBy._id.toString() === userId.toString();
    const isAssignedTasker = task.assignedTo && task.assignedTo._id.toString() === userId.toString();
    
    // Only the task CREATOR (poster) can mark the task as complete
    // The task poster is the one who made the payment and should mark completion
    const canComplete = task.status === "todo" && isTaskCreator;
    
    res.status(200).json({
      success: true,
      data: {
        taskId: task._id,
        status: task.status,
        canComplete: canComplete,
        completionButtonText: canComplete ? "Mark as Complete" : null,
        userRole: isTaskCreator ? "creator" : (isAssignedTasker ? "assignee" : "none")
      }
    });
  } catch (error) {
    console.error("Error checking task completion status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.cancelTask = async (req, res) => {
  try {
    const {taskId} = req.params;
    const userId = req.user._id;

    // Validate task ID
    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // Find the task and check permissions
    const task = await Task.findOne({
      _id: taskId,
      createdBy: userId, // Only task creator can cancel
      status: {$in: ["open", "todo"]}, // Can cancel open or todo tasks
    }).populate("createdBy assignedTo", "firstName lastName avatar rating");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to cancel it",
      });
    }

    // Update task status
    task.status = "cancelled";
    task.cancelledAt = new Date();
    await task.save();

    // Update related offers to rejected status
    await Offer.updateMany(
      {
        taskId: taskId,
        status: {$in: ["pending", "accepted"]},
      },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      data: task,
      message: "Task cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling task:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel task",
    });
  }
};

exports.acceptOffer = async (req, res) => {
  try {
    const {taskId, offerId} = req.params;
    const {role} = req.body;

    // Validate inputs
    if (!taskId || !offerId) {
      return res.status(400).json({
        success: false,
        message: "Missing taskId or offerId",
      });
    }

    // Validate IDs
    if (!isValidObjectId(taskId) || !isValidObjectId(offerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid taskId or offerId",
      });
    }

    // Retrieve task and offer
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // Verify the offer belongs to this task
    if (offer.taskId.toString() !== taskId) {
      return res.status(400).json({
        success: false,
        message: "Offer does not belong to this task",
      });
    }

    // Verify the user is authorized (must be task creator)
    const userId = req.user._id;
    if (task.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only task creator can accept offers",
      });
    }

    // Check task status
    if (!["open", "pending"].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: "Task is not in a state to accept offers",
      });
    }

    // Verify offer status
    if (offer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Offer is not in a state to be accepted",
      });
    }

    // Create transaction record
    const serviceType = Array.isArray(task.categories)
      ? task.categories[0]?.split(",")[0]?.trim() || "Other"
      : typeof task.categories === "string"
      ? task.categories.split(",")[0]?.trim() || "Other"
      : "Other";

    const transaction = new TransAction({
      taskId: task._id,
      posterId: task.createdBy,
      taskerId: offer.taskTakerId,
      amount: offer.offer.amount,
      serviceFee: calculateServiceFee(offer.offer.amount),
      totalAmount: offer.offer.amount + calculateServiceFee(offer.offer.amount),
      paymentStatus: "requires_payment_method",
      serviceType: serviceType,
    });

    // Update task status
    task.status = "todo";
    task.assignedTo = offer.taskTakerId;
    task.assignedAt = new Date();

    // Update offer status
    offer.status = "accepted";
    offer.updatedAt = new Date();

    // Save all changes
    await Promise.all([transaction.save(), task.save(), offer.save()]);

    // Reject other offers
    await Offer.updateMany(
      {
        taskId: task._id,
        _id: {$ne: offer._id},
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        task,
        offer,
        transaction,
      },
      message: "Offer accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to accept offer",
    });
  }
};

exports.getTaskWithOffers = async (req, res) => {
  try {
    const taskId = req.params.id;

    // Validate task ID
    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID",
      });
    }

    // First get the task with populated user details
    const task = await Task.findById(taskId)
      .populate({
        path: "createdBy",
        select:
          "firstName lastName email phone verified avatar rating memberSince name",
        model: "User",
      })
      .populate({
        path: "assignedTo",
        select: "firstName lastName avatar rating name",
        model: "User",
      })
      .lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Get all offers with populated user details
    const offers = await Offer.find({
      taskId: taskId,
      status: {$ne: "withdrawn"}, // Only exclude withdrawn offers
    })
      .populate({
        path: "taskTakerId",
        select: "firstName lastName avatar rating completedTasks name",
        model: "User",
      })
      .sort({createdAt: -1}) // Sort by newest first
      .lean();

    // Format all offers
    const formattedOffers = offers.map((offer) => ({
      _id: offer._id,
      user: offer.taskTakerId
        ? {
            _id: offer.taskTakerId._id,
            name:
              `${offer.taskTakerId.firstName || ""} ${
                offer.taskTakerId.lastName || ""
              }`.trim() || offer.taskTakerId.name,
            avatar: offer.taskTakerId.avatar,
            rating: offer.taskTakerId.rating,
            completedTasks: offer.taskTakerId.completedTasks,
          }
        : null,
      amount: offer.offer.amount,
      currency: offer.offer.currency,
      formattedAmount: formatCurrency(offer.offer.amount, offer.offer.currency),
      currencyInfo: formatCurrencyObject(offer.offer.amount, offer.offer.currency),
      message: offer.offer.message,
      status: offer.status,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    }));

    // Enhanced date formatting with error handling and dateDisplay object
    let formattedDate;
    let dateDisplay;

    try {
      switch (task.dateType) {
        case "Easy":
          formattedDate = "Flexible date";
          dateDisplay = {
            type: "Easy",
            display: "Flexible date",
            original: task.date,
          };
          break;

        case "DoneBy":
          if (task.dateRange?.end) {
            const date = new Date(task.dateRange.end).toLocaleDateString(
              "en-AU",
              {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "Australia/Sydney",
              }
            );
            formattedDate = `Due by ${date}`;
            dateDisplay = {
              type: "DoneBy",
              display: formattedDate,
              original: task.dateRange.end,
            };
          }
          break;

        case "DoneOn":
          if (task.dateRange?.start) {
            const date = new Date(task.dateRange.start).toLocaleDateString(
              "en-AU",
              {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "Australia/Sydney",
              }
            );
            formattedDate = `On ${date}`;
            dateDisplay = {
              type: "DoneOn",
              display: formattedDate,
              original: task.dateRange.start,
            };
          }
          break;

        default:
          if (task.date) {
            const date = new Date(task.date).toLocaleDateString("en-AU", {
              timeZone: "Australia/Sydney",
            });
            formattedDate = date;
            dateDisplay = {
              type: "Standard",
              display: date,
              original: task.date,
            };
          }
      }
    } catch (error) {
      console.error("Date formatting error:", error);
      formattedDate = "Date not available";
      dateDisplay = {
        type: task.dateType,
        display: "Date not available",
        original: task.date,
      };
    }

    // Format the result with all the enhanced fields
    const result = {
      ...task,
      formattedDate,
      dateDisplay,
      date: task.date,
      dateRange: task.dateRange || {},
      // Task budget information (what the poster is willing to pay)
      taskBudget: task.budget,
      taskCurrency: task.currency,
      formattedTaskBudget: formatCurrency(task.budget, task.currency),
      taskCurrencyInfo: formatCurrencyObject(task.budget, task.currency),
      // Keep original budget fields for backward compatibility
      budget: task.budget,
      currency: task.currency,
      createdBy: task.createdBy
        ? {
            _id: task.createdBy._id,
            name: `${task.createdBy.firstName || ""} ${
              task.createdBy.lastName || ""
            }`.trim(),
            avatar: task.createdBy.avatar,
            rating: task.createdBy.rating,
            memberSince: task.createdBy.memberSince,
            verified: task.createdBy.verified,
            email: task.createdBy.email,
            phone: task.createdBy.phone,
          }
        : null,
      assignedTo: task.assignedTo
        ? {
            _id: task.assignedTo._id,
            name: `${task.assignedTo.firstName || ""} ${
              task.assignedTo.lastName || ""
            }`.trim(),
            avatar: task.assignedTo.avatar,
            rating: task.assignedTo.rating,
          }
        : null,
      offers: formattedOffers,
      offerCount: formattedOffers.length,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error fetching task with offers:", err);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: err.message,
    });
  }
};
