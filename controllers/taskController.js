// task controller.js
const mongoose = require("mongoose");
const Chat = require("../models/chat/Chat");
const Task = require("../models/task/Task");
const Offer = require("../models/task/Offer");
const User = require("../models/user/User");
const Question = require("../models/task/Question");
const Transaction = require("../models/payment/TransActions");
const Payment = require("../models/payment/Payment");
const {
  formatUserObject,
  formatCurrency,
  formatCurrencyObject,
} = require("../utils/userUtils");
const {
  generateReceiptsForCompletedTask,
} = require("../services/receiptService");
const notificationService = require("../services/notificationService");

// @desc    Create an offer for a task
// @route   POST /api/tasks/:id/offers
// @access  Private

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newStatus } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, error: "Invalid task ID" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
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

        // Send notification to poster and tasker about task completion
        try {
          const [tasker, poster] = await Promise.all([
            User.findById(task.assignedTo),
            User.findById(task.createdBy),
          ]);

          await notificationService.notifyTaskCompleted(task, tasker, poster);
          console.log("Task completion notifications sent successfully");
        } catch (notificationError) {
          console.error(
            "Error sending task completion notifications:",
            notificationError
          );
          // Don't fail the request if notification fails
        }
        break;

      case "completed":
        if (userId.toString() !== task.createdBy.toString()) {
          return res.status(403).json({
            success: false,
            error: "Only task creator can confirm completion",
          });
        }
        task.completedAt = new Date();

        // CRITICAL: Update payment status FIRST before generating receipts
        // This ensures payment is marked "completed" before receipt generation tries to find it
        console.log(
          `💳 Updating payment status to completed for task ${taskId}...`
        );
        await Payment.updateMany(
          { task: taskId },
          { $set: { status: "completed", updatedAt: new Date() } }
        );
        console.log(`✅ Payment status updated to completed`);

        // Update related offer and transaction (can run in parallel)
        await Promise.all([
          Offer.findOneAndUpdate(
            { taskId, status: "accepted" },
            { status: "completed", completedAt: new Date() }
          ),
          Transaction.updateMany(
            { taskId },
            { $set: { taskStatus: "completed" } }
          ),
        ]);

        // Generate receipts for both poster and tasker when task is completed
        try {
          console.log(
            `🔄 Attempting to generate receipts for completed task ${taskId}...`
          );
          const receipts = await generateReceiptsForCompletedTask(taskId);
          console.log(
            `✅ Receipts successfully generated for task ${taskId}:`,
            {
              paymentReceipt: receipts.paymentReceipt.receiptNumber,
              earningsReceipt: receipts.earningsReceipt.receiptNumber,
            }
          );

          // Send receipt ready notifications
          if (receipts.paymentReceipt) {
            try {
              const poster = await User.findById(task.createdBy);
              await notificationService.notifyReceiptReady(
                receipts.paymentReceipt,
                task,
                poster
              );
            } catch (notifError) {
              console.error(
                "Error sending poster receipt notification:",
                notifError
              );
            }
          }

          if (receipts.earningsReceipt) {
            try {
              const tasker = await User.findById(task.assignedTo);
              await notificationService.notifyReceiptReady(
                receipts.earningsReceipt,
                task,
                tasker
              );
            } catch (notifError) {
              console.error(
                "Error sending tasker receipt notification:",
                notifError
              );
            }
          }
        } catch (receiptError) {
          console.error(`❌ Failed to generate receipts for task ${taskId}:`, {
            error: receiptError.message,
            stack: receiptError.stack,
          });
          // Don't fail the task completion if receipt generation fails
          // Receipts can be generated later via the API
        }
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
      await Transaction.updateMany(
        { taskId },
        { $set: { taskStatus: newStatus } }
      );
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
};
exports.createTaskOffer = async (req, res) => {
  try {
    console.log("Incoming offer creation request:", {
      body: req.body,
      params: req.params,
      user: req.user,
    });

    const { amount, message } = req.body;
    const taskId = req.params.id;
    const taskTakerId = req.user._id; // From authenticated user

    // Validate required fields
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required",
      });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be positive",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Check if task is still open
    if (task.status !== "open") {
      return res.status(400).json({
        success: false,
        error: "Task is no longer accepting offers",
      });
    }

    // Check for existing offer from this user
    // const existingOffer = await Offer.findOne({
    //   taskId: taskId,
    //   taskTakerId: taskTakerId,
    // });

    // if (existingOffer) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "You've already made an offer for this task",
    //   });
    // }

    // Validate questions if provided
    // let validatedQuestions = [];
    // if (questions && Array.isArray(questions)) {
    //   validatedQuestions = questions
    //     .map((q) => ({
    //       question: q.question?.trim(),
    //       answer: q.answer?.trim(),
    //     }))
    //     .filter((q) => q.question); // Only keep questions with non-empty text
    // }

    // Debug logging
    console.log("Creating offer for task:", {
      taskId: taskId,
      taskCurrency: task.currency,
      taskBudget: task.budget,
      offerAmount: amount,
    });

    // Ensure we have a valid currency from the task
    const offerCurrency = task.currency || "USD";

    // Create new offer with the updated schema
    const newOffer = new Offer({
      taskId: taskId,
      taskCreatorId: task.createdBy, // From the task document
      taskTakerId: taskTakerId, // From the authenticated user
      offer: {
        amount: Number(amount),
        currency: offerCurrency, // Use task's currency
        message: message?.trim(),
      },
      // questions: validatedQuestions,
      status: "pending",
    });

    // Save the offer
    await newOffer.save();

    // Add offer to task's offers array (if your Task schema has this field)
    if (task.offers) {
      task.offers.push(newOffer._id);
      await task.save();
    }

    // Create individual chat record (legacy support)
    const newChat = new Chat({
      taskId: taskId,
      posterId: task.createdBy, // Task creator
      taskerId: taskTakerId, // User making the offer
      chatStatus: "offer", // Initial status is 'offer'
      status: "active", // Chat is active
    });

    await newChat.save();

    // Populate the offer details for response
    const populatedOffer = await Offer.findById(newOffer._id)
      .populate("taskTakerId", "firstName lastName avatar rating")
      .populate("taskCreatorId", "firstName lastName")
      .lean();

    // Send notification to task poster about the new offer
    try {
      // Use regular notification
      await notificationService.notifyOfferMade(
        populatedOffer,
        task,
        populatedOffer.taskTakerId,
        populatedOffer.taskCreatorId
      );
      console.log("Offer notification sent successfully");
    } catch (notificationError) {
      console.error("Error sending offer notification:", notificationError);
      // Don't fail the request if notification fails
    }

    console.log("Offer created successfully:", populatedOffer);
    res.status(201).json({
      success: true,
      data: populatedOffer,
    });
  } catch (err) {
    console.error("Error in createTaskOffer:", {
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: "Server Error JNI: " + err.message,
    });
  }
};
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    console.log("Creating task with data:", {
      body: req.body,
      files: req.files,
      user: req.user?._id,
    });

    const {
      title,
      category,
      date,
      time: rawTime,
      location,
      details,
      budget,
      currency = "LKR",
      dateType,
      locationType, // NEW: In-person or Online
      // Moving-specific fields for mobile
      isMovingTask,
      pickupLocation,
      pickupPostalCode,
      dropoffLocation,
      dropoffPostalCode,
    } = req.body;

    // Handle empty time field - default to "Anytime"
    const time = rawTime && rawTime.trim() !== "" ? rawTime : "Anytime";

    // Detect if request is from mobile app
    const userAgent = req.headers["user-agent"] || "";
    const isMobileApp =
      userAgent.includes("MyToDoo-Mobile") ||
      userAgent.includes("Expo") ||
      req.headers["x-platform"] === "mobile";

    console.log("Request platform detection:", {
      userAgent,
      isMobileApp,
      isMovingTask,
      xPlatform: req.headers["x-platform"],
    });

    // Validate dateType is one of the expected values
    if (!["Easy", "DoneBy", "DoneOn"].includes(dateType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid dateType provided",
      });
    }

    // Default locationType to "In-person" for backward compatibility
    const effectiveLocationType = locationType || "In-person";

    // Validate locationType if provided
    if (locationType && !["In-person", "Online"].includes(locationType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid locationType. Must be 'In-person' or 'Online'",
      });
    }

    // Validate required fields with more specific messages
    const missingFields = [];
    if (!title || title.trim() === "") missingFields.push("title");
    if (!category || category.trim() === "") missingFields.push("category");
    // time now defaults to "Anytime" if empty

    // Location is required only for In-person tasks
    if (
      effectiveLocationType === "In-person" &&
      (!location || location.trim() === "")
    ) {
      missingFields.push("location (required for In-person tasks)");
    }

    if (!details || details.trim() === "") missingFields.push("details");
    if (!budget || isNaN(Number(budget))) missingFields.push("budget");

    // Validate moving-specific fields for mobile moving tasks
    if (isMobileApp && isMovingTask) {
      console.log("Validating moving task fields:", {
        pickupLocation,
        pickupPostalCode,
        dropoffLocation,
        dropoffPostalCode,
      });

      if (!pickupLocation) missingFields.push("pickupLocation");
      if (!pickupPostalCode) missingFields.push("pickupPostalCode");
      if (!dropoffLocation) missingFields.push("dropoffLocation");
      if (!dropoffPostalCode) missingFields.push("dropoffPostalCode");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        missingFields,
        message: `Please provide: ${missingFields.join(", ")}`,
      });
    }

    // Parse coordinates if provided
    const coordinates = req.body.coordinates
      ? typeof req.body.coordinates === "string"
        ? JSON.parse(req.body.coordinates)
        : req.body.coordinates
      : undefined;

    // Initialize date range variables
    let startDate, endDate;

    // Handle different date types
    switch (dateType) {
      case "Easy":
        startDate = new Date();
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        break;

      case "DoneBy":
        if (!date) {
          return res.status(400).json({
            success: false,
            error: "Date is required for DoneBy tasks",
          });
        }
        startDate = new Date();
        endDate = new Date(date);
        break;

      case "DoneOn":
        if (!date) {
          return res.status(400).json({
            success: false,
            error: "Date is required for DoneOn tasks",
          });
        }
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid dateType provided",
        });
    }

    // Create location object conditionally
    const locationObj = {
      address:
        effectiveLocationType === "Online"
          ? "Remote"
          : Array.isArray(location)
          ? location[0]
          : location,
    };

    // Only add coordinates if they exist and it's an In-person task
    // IMPORTANT: Don't add coordinates field at all for Online tasks to avoid validation errors
    if (coordinates && effectiveLocationType === "In-person") {
      locationObj.coordinates = {
        type: "Point",
        coordinates: [coordinates.lng || coordinates.lon, coordinates.lat],
      };
    }
    // For Online tasks, don't add coordinates at all (not even undefined)

    // Create new task
    const taskData = {
      title,
      categories: Array.isArray(category)
        ? category.map((c) => c.trim())
        : category.includes(",")
        ? category.split(",").map((c) => c.trim())
        : [category.trim()],
      locationType: effectiveLocationType, // Use the effective location type
      date: endDate,
      time,
      location: locationObj,
      details,
      budget: Number(budget),
      currency,
      images: req.files?.map((file) => file.location) || [],
      status: "open",
      createdBy: req.user._id,
      dateType,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    // Add moving-specific fields for mobile moving tasks
    if (isMobileApp && isMovingTask) {
      taskData.isMovingTask = true;
      taskData.movingDetails = {
        pickupLocation: {
          address: pickupLocation,
          postalCode: pickupPostalCode,
        },
        dropoffLocation: {
          address: dropoffLocation,
          postalCode: dropoffPostalCode,
        },
      };

      console.log("Adding moving details to task:", taskData.movingDetails);
    }

    const task = new Task(taskData);

    await task.save();

    // Populate user details in response
    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "email firstName lastName avatar rating")
      .exec();

    // Send notification to the poster about successful task creation
    try {
      await notificationService.notifyTaskPosted(
        populatedTask,
        populatedTask.createdBy
      );
      console.log("Task creation notification sent successfully");
    } catch (notificationError) {
      console.error(
        "Error sending task creation notification:",
        notificationError
      );
      // Don't fail the request if notification fails
    }

    console.log("Task created successfully:", populatedTask._id);

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
exports.getTasks = async (req, res) => {
  try {
    const {
      category,
      minBudget,
      maxBudget,
      location,
      radius,
      status,
      search,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query = {};

    // Category filter
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    // Status filter
    if (status) {
      query.status = status;
    } else {
      query.status = "open";
    }

    // Budget range filter
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }

    // Search in title or details
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
      ];
    }

    // Location-based filtering
    if (location && radius) {
      const [lat, lng] = location.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        query["location.coordinates"] = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: radius * 1000,
          },
        };
      }
    }

    // Execute query with pagination
    const tasksQuery = Task.find(query)
      .populate("createdBy", "firstName lastName avatar rating")
      .populate("assignedTo", "firstName lastName avatar")
      .lean();

    // Sorting
    if (sort) {
      const sortFields = sort.split(",").join(" ");
      tasksQuery.sort(sortFields);
    } else {
      tasksQuery.sort("-createdAt");
    }

    const startIndex = (page - 1) * limit;
    tasksQuery.skip(startIndex).limit(limit);

    const tasks = await tasksQuery.exec();

    // Get offer counts for all tasks in one query
    const taskIds = tasks.map((task) => task._id);
    const offerCounts = await Offer.aggregate([
      {
        $match: {
          taskId: { $in: taskIds },
        },
      },
      {
        $group: {
          _id: "$taskId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a map of taskId to offer count
    const offerCountMap = offerCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    // Add offer count to each task
    const tasksWithOfferCounts = tasks.map((task) => ({
      ...task,
      offerCount: offerCountMap[task._id.toString()] || 0,
    }));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: tasksWithOfferCounts, // Now includes offerCount
    });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get tasks posted by the current user
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { status, role, subSection } = req.query;
    const userId = req.user._id;

    // Build base query
    let query = {};
    if (role === "poster") {
      query.createdBy = userId;
    } else if (role === "tasker") {
      query.assignedTo = userId;
    }

    // Get tasks with populated data
    const tasks = await Task.find(query)
      .populate("createdBy", "name avatar rating")
      .populate("assignedTo", "name avatar rating")
      .sort("-createdAt")
      .lean()
      .exec();

    // Apply additional filtering based on subSection if provided
    const filteredTasks = subSection
      ? filterAllTasks(tasks, subSection, userId)
      : tasks;

    // Format dates as before
    const formattedTasks = filteredTasks.map((task) => {
      const dateRange = task.dateRange || {};

      let formattedDate;
      switch (task.dateType) {
        case "Easy":
          formattedDate = "Flexible date";
          break;
        case "DoneBy":
          formattedDate = dateRange.end
            ? new Date(dateRange.end).toISOString()
            : task.date;
          break;
        case "DoneOn":
          formattedDate = dateRange.start
            ? new Date(dateRange.start).toISOString()
            : task.date;
          break;
        default:
          formattedDate = task.date;
      }

      return {
        ...task,
        date: formattedDate,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: formattedTasks,
    });
  } catch (err) {
    console.error("Error fetching user tasks:", err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Public
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name avatar rating firstName lastName")
      .populate("assignedTo", "name avatar")
      .lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Format the date based on dateType
    let formattedDate;
    switch (task.dateType) {
      case "Easy":
        formattedDate = "Flexible date";
        break;
      case "DoneBy":
        formattedDate = task.dateRange?.end
          ? `Due by ${new Date(task.dateRange.end).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}`
          : new Date(task.date).toLocaleDateString();
        break;
      case "DoneOn":
        formattedDate = task.dateRange?.start
          ? `On ${new Date(task.dateRange.start).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}`
          : new Date(task.date).toLocaleDateString();
        break;
      default:
        formattedDate = new Date(task.date).toLocaleDateString();
    }

    // Add formatted date to task object
    const taskWithFormattedDate = {
      ...task,
      formattedDate,
      dateRange: {
        start: task.dateRange?.start,
        end: task.dateRange?.end,
      },
    };

    console.log("Task date formatting:", {
      dateType: task.dateType,
      originalDate: task.date,
      dateRange: task.dateRange,
      formattedDate,
    });

    const user = await User.findById(task.createdBy);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: taskWithFormattedDate,
      user,
    });
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (task owner)
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    console.log("Update task request:", { taskId, updates });

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Check if user is task owner
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to update this task",
      });
    }

    // Handle date updates based on dateType
    let dateRange = task.dateRange; // Default to existing dateRange
    let dateType = updates.dateType || task.dateType; // Use provided or existing dateType

    // Only recalculate dateRange if dateType or date is being updated
    if (updates.dateType || updates.date) {
      switch (dateType) {
        case "Easy":
          dateRange = {
            start: new Date(),
            end: new Date(new Date().setMonth(new Date().getMonth() + 3)),
          };
          break;
        case "DoneBy":
          const doneByDate = updates.date || task.date;
          if (!doneByDate) {
            return res.status(400).json({
              success: false,
              error: "Date is required for DoneBy tasks",
            });
          }
          dateRange = {
            start: new Date(),
            end: new Date(doneByDate),
          };
          break;
        case "DoneOn":
          const doneOnDate = updates.date || task.date;
          if (!doneOnDate) {
            return res.status(400).json({
              success: false,
              error: "Date is required for DoneOn tasks",
            });
          }
          const specificDate = new Date(doneOnDate);
          const startDate = new Date(specificDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(specificDate);
          endDate.setHours(23, 59, 59, 999);
          dateRange = {
            start: startDate,
            end: endDate,
          };
          break;
      }
    }

    // Prepare update object - only include fields that are provided
    const updateData = {
      dateType: dateType, // Always include resolved dateType
      dateRange: dateRange, // Always include resolved dateRange
    };

    // Conditionally add fields if they are provided
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (dateRange.end) updateData.date = dateRange.end;

    // Handle location updates
    if (updates.location?.address || updates.location) {
      updateData["location.address"] =
        updates.location?.address || updates.location;
    }
    if (updates.location?.coordinates || updates.coordinates) {
      updateData["location.coordinates"] =
        updates.location?.coordinates || updates.coordinates;
    }

    console.log("Update data to be applied:", updateData);

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("createdBy", "name avatar rating");

    console.log("Task updated successfully:", {
      taskId: updatedTask._id,
      dateType: updatedTask.dateType,
      dateRange: updatedTask.dateRange,
    });

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Server Error",
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (task owner)
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;

    console.log("Delete task request:", { taskId, userId });

    // Validate ObjectId format
    if (!require("mongoose").Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    // First, check if the task exists at all
    const taskExists = await Task.findById(taskId);
    if (!taskExists) {
      console.log("Task not found in database:", taskId);
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Check if the current user is the owner of the task
    if (taskExists.createdBy.toString() !== userId.toString()) {
      console.log("Unauthorized delete attempt:", {
        taskCreator: taskExists.createdBy.toString(),
        requestingUser: userId.toString(),
      });
      return res.status(403).json({
        success: false,
        error: "Unauthorized: You can only delete tasks you created",
      });
    }

    // Find task and check ownership
    const task = await Task.findOne({
      _id: taskId,
      createdBy: userId,
    });

    console.log("Task found for deletion:", task ? task._id : "Not found");

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or unauthorized",
      });
    }

    // Check if task can be deleted based on status
    const deletableStatuses = ["open", "expired"];
    if (!deletableStatuses.includes(task.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete task with status '${task.status}'. Only tasks with status 'open' or 'expired' can be deleted.`,
      });
    }

    // Delete associated offers first
    console.log("Deleting offers for taskId:", taskId);
    const offerDeleteResult = await Offer.deleteMany({ taskId: taskId });
    console.log("Deleted offers:", offerDeleteResult.deletedCount);

    // Delete the task
    console.log("Deleting task:", taskId);
    await Task.findByIdAndDelete(taskId);
    console.log("Task deleted successfully");

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({
      success: false,
      error: "Error deleting task",
    });
  }
};

// @desc    Get single task with offers
// @route   GET /api/tasks/:id
// @access  Public
exports.getTaskWithOffers = async (req, res) => {
  try {
    // First get the task with populated user details
    const task = await Task.findById(req.params.id)
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

    // Debug logging for task details
    console.log("Task details for getTaskWithOffers:", {
      taskId: task._id,
      taskBudget: task.budget,
      taskCurrency: task.currency,
      taskStatus: task.status,
    });

    // Get all offers with populated user details - remove uniqueness filtering
    const offers = await Offer.find({
      taskId: req.params.id,
      status: { $ne: "withdrawn" }, // Only exclude withdrawn offers
    })
      .populate({
        path: "taskTakerId",
        select: "firstName lastName avatar rating completedTasks name",
        model: "User",
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    // Format all offers without filtering for uniqueness
    const formattedOffers = offers.map((offer) => {
      // Debug logging for offer currency
      console.log("Formatting offer:", {
        offerId: offer._id,
        amount: offer.offer.amount,
        currency: offer.offer.currency,
        taskCurrency: task.currency,
      });

      return {
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
        formattedAmount: formatCurrency(
          offer.offer.amount,
          offer.offer.currency
        ),
        currencyInfo: formatCurrencyObject(
          offer.offer.amount,
          offer.offer.currency
        ),
        message: offer.offer.message,
        status: offer.status,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      };
    });

    // Format the date based on dateType
    let formattedDate;
    switch (task.dateType) {
      case "Easy":
        formattedDate = "Flexible date";
        break;
      case "DoneBy":
        formattedDate = task.dateRange?.end
          ? `Due by ${new Date(task.dateRange.end).toLocaleDateString("en-AU", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "Australia/Sydney",
            })}`
          : task.date;
        break;
      case "DoneOn":
        formattedDate = task.dateRange?.start
          ? `On ${new Date(task.dateRange.start).toLocaleDateString("en-AU", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "Australia/Sydney",
            })}`
          : task.date;
        break;
      default:
        formattedDate = task.date;
    }

    // Format the result
    const result = {
      ...task,
      formattedDate,
      formattedBudget: formatCurrency(task.budget, task.currency),
      budgetInfo: formatCurrencyObject(task.budget, task.currency),
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
    });
  }
};
// @desc    Create an offer for a task
// @route   POST /api/tasks/:id/offers
// @access  Private
// Update the createTaskOffer controller
// In taskController.js
// exports.createTaskOffer = async (req, res) => {
//   try {
//     console.log("Incoming offer creation request:", {
//       body: req.body,
//       params: req.params,
//       user: req.user,
//     });

//     const {amount, message} = req.body;
//     const taskId = req.params.id;
//     const userId = req.user._id;

//     // Validate required fields
//     if (!amount || isNaN(Number(amount))) {
//       console.log("Invalid amount:", amount);
//       return res.status(400).json({
//         success: false,
//         error: "Valid amount is required",
//       });
//     }

//     const task = await Task.findById(taskId);
//     if (!task) {
//       console.log("Task not found:", taskId);
//       return res.status(404).json({
//         success: false,
//         error: "Task not found",
//       });
//     }

//     // Check if task is still open
//     if (task.status !== "open") {
//       console.log("Task not open:", task.status);
//       return res.status(400).json({
//         success: false,
//         error: "Task is no longer accepting offers",
//       });
//     }

//     // Check for existing offer from this user

//     // Create new offer
//     const newOffer = {
//       user: userId,
//       amount: Number(amount),
//       message: message || "I'd like to help with this task",
//       status: "pending",
//     };

//     // Add offer to task
//     task.offers.push(newOffer);
//     await task.save();

//     // Populate the offer details
//     const populatedTask = await Task.findById(task._id)
//       .populate("offers.user", "name avatar rating")
//       .lean();

//     const createdOffer = populatedTask.offers.find(
//       (offer) => offer.user._id.toString() === userId.toString()
//     );

//     console.log("Offer created successfully:", createdOffer);
//     res.status(201).json({
//       success: true,
//       data: createdOffer,
//     });
//   } catch (err) {
//     console.error("Error in createTaskOffer:", {
//       error: err,
//       stack: err.stack,
//       request: {
//         body: req.body,
//         params: req.params,
//         user: req.user,
//       },
//     });
//     res.status(500).json({
//       success: false,
//       error: "Jan Error",
//     });
//   }
// };

// @desc    Accept an offer for a task
// @route   PUT /api/tasks/:taskId/offers/:offerId/accept
// @access  Private (task owner)
exports.acceptTaskOffer = async (req, res) => {
  try {
    const { taskId, offerId } = req.params;
    const userId = req.user._id;

    console.log("Accepting offer:", { taskId, offerId, userId });

    // First fetch the task and offer
    const task = await Task.findById(taskId);
    const offer = await Offer.findById(offerId);

    if (!task || !offer) {
      return res.status(404).json({
        success: false,
        error: "Task or offer not found",
      });
    }

    // Verify ownership and status
    if (task.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only task owner can accept offers",
      });
    }

    if (task.status !== "open") {
      return res.status(400).json({
        success: false,
        error: "Task is not in a state to accept offers",
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update task
      task.status = "assigned";
      task.assignedTo = offer.taskTakerId;
      await task.save({ session });

      // Update the accepted offer
      offer.status = "accepted";
      await offer.save({ session });

      // Reject all other offers for this task
      await Offer.updateMany(
        {
          taskId: taskId,
          _id: { $ne: offerId },
        },
        {
          $set: { status: "rejected" },
        },
        { session }
      );

      await session.commitTransaction();

      // Get updated task with populated fields
      const updatedTask = await Task.findById(taskId)
        .populate("createdBy", "name avatar rating")
        .populate("assignedTo", "name avatar rating")
        .lean();

      // Send notifications for offer acceptance
      try {
        // Populate offer with user data for notifications
        const populatedOffer = await Offer.findById(offerId)
          .populate("taskTakerId", "firstName lastName avatar")
          .populate("taskCreatorId", "firstName lastName avatar");

        // Use regular notification for offer acceptance
        await notificationService.notifyOfferAccepted(
          populatedOffer,
          updatedTask,
          populatedOffer.taskTakerId,
          populatedOffer.taskCreatorId
        );

        // Notify the tasker that task is assigned to them
        await notificationService.notifyTaskAssigned(
          updatedTask,
          populatedOffer.taskTakerId
        );

        console.log("Offer acceptance notifications sent successfully");
      } catch (notificationError) {
        console.error(
          "Error sending offer acceptance notifications:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

      res.status(200).json({
        success: true,
        data: updatedTask,
        message: "Offer accepted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("Error accepting offer:", err);
    res.status(500).json({
      success: false,
      error: "Failed to accept offer",
    });
  }
};

// @desc    Accept a task
// @route   POST /api/tasks/:id/accept
// @access  Private
// @desc    Accept a task
// @route   POST /api/tasks/:id/accept
// @access  Private
exports.acceptTask = async (req, res) => {
  try {
    const { message } = req.body;
    const taskId = req.params.id;
    const userId = req.user._id;

    console.log("Accept task request:", {
      taskId,
      userId,
      body: req.body,
    });

    // Validate acceptance message
    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Acceptance message must be at least 10 characters",
      });
    }

    // Find and update task in one atomic operation
    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        status: "open", // Only accept if task is still open
      },
      {
        $set: {
          status: "assigned",
          assignedTo: userId,
          assignedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("createdBy assignedTo", "name avatar rating");

    if (!task) {
      return res.status(400).json({
        success: false,
        error: "Task not found or already assigned",
      });
    }

    console.log("Task assigned successfully:", {
      taskId: task._id,
      assignedTo: task.assignedTo,
    });

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    console.error("Error in acceptTask:", {
      error: err.message,
      stack: err.stack,
      params: req.params,
      body: req.body,
      user: req.user,
    });
    res.status(500).json({
      success: false,
      error: "Failed to accept task",
    });
  }
};

// @desc    Get tasks posted by the current user
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { status, role, subSection } = req.query;
    const userId = req.user._id;

    // Build base query
    let query = {};
    if (role === "poster") {
      query.createdBy = userId;
    } else if (role === "tasker") {
      query.assignedTo = userId;
    }

    // Get tasks with populated data
    const tasks = await Task.find(query)
      .populate("createdBy", "name avatar rating")
      .populate("assignedTo", "name avatar rating")
      .sort("-createdAt")
      .lean()
      .exec();

    // Apply additional filtering based on subSection if provided
    const filteredTasks = subSection
      ? filterAllTasks(tasks, subSection, userId)
      : tasks;

    // Format dates as before
    const formattedTasks = filteredTasks.map((task) => {
      const dateRange = task.dateRange || {};

      let formattedDate;
      switch (task.dateType) {
        case "Easy":
          formattedDate = "Flexible date";
          break;
        case "DoneBy":
          formattedDate = dateRange.end
            ? new Date(dateRange.end).toISOString()
            : task.date;
          break;
        case "DoneOn":
          formattedDate = dateRange.start
            ? new Date(dateRange.start).toISOString()
            : task.date;
          break;
        default:
          formattedDate = task.date;
      }

      return {
        ...task,
        date: formattedDate,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: formattedTasks,
    });
  } catch (err) {
    console.error("Error fetching user tasks:", err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get user's offers
// @route   GET /api/tasks/my-offers
// @access  Private
exports.getMyOffers = async (req, res) => {
  try {
    // Query offers directly from Offer model
    const Offer = require("../models/task/Offer");
    const offers = await Offer.find({
      taskTakerId: req.user._id,
    })
      .populate("taskId")
      .populate("taskCreatorId", "name avatar")
      .lean();

    // Group offers by task
    const tasksMap = {};
    offers.forEach((offer) => {
      if (offer.taskId) {
        const taskId = offer.taskId._id.toString();
        if (!tasksMap[taskId]) {
          tasksMap[taskId] = {
            ...offer.taskId,
            offers: [],
          };
        }
        tasksMap[taskId].offers.push(offer);
      }
    });

    const filteredTasks = Object.values(tasksMap);

    res.json({
      success: true,
      data: filteredTasks,
    });
  } catch (error) {
    console.error("Error fetching user offers:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Complete task payment
// @route   POST /api/tasks/:taskId/complete-payment
// @access  Private
exports.completeTaskPayment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { paymentIntentId, offerId } = req.body;
    const userId = req.user._id;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: "Payment not completed",
      });
    }

    // Verify metadata matches
    if (
      paymentIntent.metadata.taskId !== taskId ||
      paymentIntent.metadata.offerId !== offerId ||
      paymentIntent.metadata.userId !== userId.toString()
    ) {
      return res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }

    // Update task status
    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        createdBy: userId,
        "offers._id": offerId,
        status: "assigned",
      },
      {
        $set: {
          status: "completed",
          "payment.status": "completed",
          "payment.paymentIntentId": paymentIntentId,
          "payment.amount": paymentIntent.amount / 100,
          "payment.currency": paymentIntent.currency,
          "payment.paidAt": new Date(),
          "offers.$.status": "paid",
        },
      },
      { new: true }
    ).populate("createdBy assignedTo", "name avatar");

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or unauthorized",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Payment completion error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Payment completion failed",
    });
  }
};

// @desc    Get tasks with payment status
// @route   GET /api/tasks/my-tasks/payment-status
// @access  Private
exports.getTasksWithPaymentStatus = async (req, res) => {
  try {
    const tasks = await Task.find({
      createdBy: req.user._id,
      "payment.status": { $exists: true },
    }).populate("assignedTo", "name avatar");

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks with payment status:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Search and filter tasks
// @route   GET /api/tasks/search
// @access  Public
exports.searchTasks = async (req, res) => {
  try {
    const {
      search,
      categories,
      location,
      minPrice,
      maxPrice,
      filters,
      sort = "recommended",
    } = req.query;

    console.log("Search params received:", { categories, filters });

    // Remove hardcoded status filter to allow all task statuses in search results
    const query = {};
    let categoryArray = [];

    // Handle filters
    if (filters) {
      const filterArray = Array.isArray(filters) ? filters : [filters];

      filterArray.forEach((filter) => {
        switch (filter) {
          case "Remote tasks only":
            query.isRemote = true;
            break;
          case "Local tasks only":
            query.isRemote = false;
            break;
          case "With photos only":
            query.images = { $exists: true, $ne: [] };
            break;
          case "Urgent tasks only":
            query.isUrgent = true;
            break;
        }
      });
    }

    // Rest of your existing category handling
    if (categories) {
      if (Array.isArray(categories)) {
        categoryArray = categories;
      } else if (typeof categories === "string") {
        categoryArray = categories.split(",");
      }

      categoryArray = [
        ...new Set(categoryArray.filter((c) => c.trim() !== "")),
      ];

      if (categoryArray.length > 0) {
        query.$and = categoryArray.map((category) => ({
          categories: { $regex: new RegExp(`\\b${category.trim()}\\b`, "i") },
        }));
      }
    }

    // Price range handling
    if (minPrice !== "undefined" || maxPrice !== "undefined") {
      if (minPrice !== "All" && maxPrice !== "All") {
        query.budget = {};

        if (minPrice && minPrice !== "undefined") {
          const min = parseFloat(minPrice);
          if (!isNaN(min)) {
            query.budget.$gte = min;
          }
        }

        if (maxPrice && maxPrice !== "undefined") {
          if (maxPrice.includes("+")) {
            // Handle 500+ case - only set minimum, no maximum
            const minValue = parseFloat(maxPrice.replace("+", ""));
            if (!isNaN(minValue)) {
              query.budget = { $gte: minValue };
            }
          } else {
            const max = parseFloat(maxPrice);
            if (!isNaN(max)) {
              query.budget.$lte = max;
            }
          }
        }

        // Remove empty budget query
        if (Object.keys(query.budget).length === 0) {
          delete query.budget;
        }
      }
    }

    // Location handling with consideration for remote/local filter
    if (location && location !== "undefined") {
      if (location.toLowerCase() === "remote") {
        query.isRemote = true;
      } else {
        query["location.address"] = { $regex: location, $options: "i" };
      }
    }

    // Search handling
    if (search && search !== "undefined") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    // Rest of your existing aggregation pipeline
    const tasks = await Task.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser",
        },
      },
      {
        $lookup: {
          from: "offers",
          localField: "_id",
          foreignField: "taskId",
          as: "offers",
        },
      },
      {
        $addFields: {
          offerCount: { $size: "$offers" },
          createdBy: { $arrayElemAt: ["$createdByUser", 0] },
          formattedDate: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$dateType", "Easy"] },
                  then: "Flexible date",
                },
                {
                  case: { $eq: ["$dateType", "DoneBy"] },
                  then: {
                    $concat: [
                      "Due by ",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$dateRange.end",
                          // Remove timezone conversion to preserve original date
                          timezone: "Australia/Sydney", // Or your local timezone
                        },
                      },
                    ],
                  },
                },
                {
                  case: { $eq: ["$dateType", "DoneOn"] },
                  then: {
                    $concat: [
                      "On ",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$dateRange.start",
                          // Remove timezone conversion to preserve original date
                          timezone: "Australia/Sydney", // Or your local timezone
                        },
                      },
                    ],
                  },
                },
              ],
              default: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$date",
                  // Remove timezone conversion to preserve original date
                  timezone: "Australia/Sydney", // Or your local timezone
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          categories: 1,
          date: 1,
          dateType: 1,
          dateRange: 1,
          formattedDate: 1,
          time: 1,
          location: 1,
          budget: 1,
          currency: 1,
          status: 1,
          offerCount: 1,
          details: 1,
          isRemote: 1,
          isUrgent: 1,
          images: 1,
          createdAt: 1,
          "createdBy._id": 1,
          "createdBy.name": 1,
          "createdBy.avatar": 1,
          "createdBy.rating": 1,
        },
      },
      {
        $sort: getSortQueryForAggregation(sort),
      },
    ]);

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      filters: {
        appliedCategories: categoryArray,
        appliedFilters: filters || [],
        appliedPriceRange: {
          min: query.budget?.$gte || null,
          max: query.budget?.$lte || null,
        },
      },
    });
  } catch (error) {
    console.error("Search tasks error:", error);
    res.status(500).json({
      success: false,
      error: "Error searching tasks",
      message: error.message,
    });
  }
};

// Improved sort query helper from first code
const getSortQuery = (sort) => {
  switch (sort) {
    case "newest":
    case "newest_first":
    case "recommended": // Treat recommended as newest
      return { createdAt: -1 };
    case "oldest":
    case "oldest_first":
      return { createdAt: 1 };
    case "lowest_budget":
      return { budget: 1 };
    case "highest_budget":
      return { budget: -1 };
    default:
      return { createdAt: -1 };
  }
};

// Get all questions for a task
exports.getTaskQuestions = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Get questions with populated user data
    const questions = await Question.find({ taskId: taskId })
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email")
      .sort("-createdAt")
      .lean();

    // Transform the data to match frontend expectations
    // Frontend expects 'answers' array, but we store as 'answer' object
    const formattedQuestions = questions.map((question) => {
      const formatted = {
        ...question,
        answers: [], // Initialize answers array
      };

      // If there's an answer, convert it to an array format
      if (question.answer && question.answer.text) {
        formatted.answers = [
          {
            _id: question._id + "_answer", // Create a pseudo ID for the answer
            questionId: question._id,
            answer: question.answer.text,
            images: question.answer.images || [],
            answeredBy: question.answer.answeredBy,
            createdAt: question.answer.timestamp || question.updatedAt,
          },
        ];
      }

      return formatted;
    });

    console.log(`✅ Returning ${formattedQuestions.length} questions`);
    formattedQuestions.forEach((q) => {
      console.log(`   Question ${q._id}: ${q.answers.length} answer(s)`);
    });

    res.status(200).json({
      success: true,
      count: formattedQuestions.length,
      data: formattedQuestions,
    });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({
      success: false,
      error: "Server error while fetching questions",
    });
  }
};

// Create new question
exports.createQuestion = async (req, res) => {
  try {
    const { taskId } = req.params;
    // Check multiple possible field names from frontend
    const questionText =
      req.body.questionText || req.body.text || req.body.question;

    // Add detailed logging for debugging
    console.log("🔍 CREATE QUESTION DEBUG:");
    console.log("- Task ID:", taskId);
    console.log("- Request body:", JSON.stringify(req.body, null, 2));
    console.log("- Question text received:", questionText);
    console.log("- Question text type:", typeof questionText);
    console.log("- Content-Type:", req.headers["content-type"]);
    console.log("- Files uploaded:", req.files?.length || 0);

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      console.log("❌ Invalid task ID format");
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    // Validate question text
    if (!questionText || questionText.trim().length === 0) {
      console.log("❌ Missing or empty question text");
      console.log('📝 Expected: { "questionText": "your question" }');
      console.log(
        '📝 Also accepts: { "text": "your question" } or { "question": "your question" }'
      );
      return res.status(400).json({
        success: false,
        error:
          "Question text is required. Use 'questionText', 'text', or 'question' field.",
      });
    }

    if (questionText.trim().length > 500) {
      console.log("❌ Question text too long:", questionText.trim().length);
      return res.status(400).json({
        success: false,
        error: "Question text cannot exceed 500 characters",
      });
    }

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      console.log("❌ Task not found");
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    console.log("✅ All validations passed, creating question");

    // Get uploaded image URLs from multer-s3
    const imageUrls = req.files ? req.files.map((file) => file.location) : [];

    if (imageUrls.length > 0) {
      console.log(`✅ ${imageUrls.length} images uploaded to S3:`);
      imageUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    }

    // Create new question with images
    const question = new Question({
      taskId: taskId,
      userId: req.user._id,
      posterId: task.createdBy,
      question: {
        text: questionText.trim(),
        images: imageUrls, // ✅ Save S3 URLs to MongoDB
      },
    });

    await question.save();
    console.log("✅ Question saved to database with images");

    // Populate the question for response
    const populatedQuestion = await Question.findById(question._id)
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .lean();

    console.log("✅ Question created successfully");
    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: populatedQuestion,
    });
  } catch (err) {
    console.error("Error creating question:", err);
    res.status(500).json({
      success: false,
      error: "Server error while creating question",
    });
  }
};

// Answer a question
exports.answerQuestion = async (req, res) => {
  try {
    const { taskId, questionId } = req.params;
    // Check multiple possible field names from frontend
    const answerText = req.body.answerText || req.body.text || req.body.answer;

    // Add detailed logging for debugging
    console.log("🔍 ANSWER QUESTION DEBUG:");
    console.log("- Task ID:", taskId);
    console.log("- Question ID:", questionId);
    console.log("- Request body:", JSON.stringify(req.body, null, 2));
    console.log("- Answer text received:", answerText);
    console.log("- Answer text type:", typeof answerText);
    console.log("- Content-Type:", req.headers["content-type"]);
    console.log("- User ID:", req.user?._id);
    console.log("- Files uploaded:", req.files?.length || 0);

    // Validate IDs format
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(questionId)
    ) {
      console.log(
        "❌ Invalid ID format - TaskID valid:",
        mongoose.Types.ObjectId.isValid(taskId),
        "QuestionID valid:",
        mongoose.Types.ObjectId.isValid(questionId)
      );
      return res.status(400).json({
        success: false,
        error: "Invalid task ID or question ID format",
      });
    }

    // Validate answer text
    if (!answerText || answerText.trim().length === 0) {
      console.log("❌ Missing or empty answer text");
      console.log('📝 Expected: { "answerText": "your answer" }');
      console.log(
        '📝 Also accepts: { "text": "your answer" } or { "answer": "your answer" }'
      );
      return res.status(400).json({
        success: false,
        error:
          "Answer text is required. Use 'answerText', 'text', or 'answer' field.",
      });
    }

    if (answerText.trim().length > 1000) {
      console.log("❌ Answer text too long:", answerText.trim().length);
      return res.status(400).json({
        success: false,
        error: "Answer text cannot exceed 1000 characters",
      });
    }

    console.log("✅ Basic validation passed, checking question existence");

    // Find the question and populate task data
    const question = await Question.findOne({
      _id: questionId,
      taskId: taskId,
    }).populate("taskId");

    if (!question) {
      console.log("❌ Question not found");
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    const task = question.taskId;
    console.log("✅ Question found, checking authorization");
    console.log(
      "- Question poster ID (task creator):",
      question.posterId.toString()
    );
    console.log("- Question asker ID:", question.userId.toString());
    console.log("- Current user ID:", req.user._id.toString());
    console.log(
      "- Is task creator?:",
      question.posterId.toString() === req.user._id.toString()
    );
    console.log(
      "- Is question asker?:",
      question.userId.toString() === req.user._id.toString()
    );

    // Check if task has an assigned user
    const isAssignedTasker =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    console.log("- Task assigned to:", task.assignedTo?.toString() || "No one");
    console.log("- Is assigned tasker?:", isAssignedTasker);

    // Check if user has made an offer on this task (is a task taker)
    const userOffer = await Offer.findOne({
      taskId: taskId,
      taskTakerId: req.user._id,
    });
    const isTaskTaker = !!userOffer;
    console.log("- Has made offer (task taker)?:", isTaskTaker);

    // Open Q&A System: Allow any authenticated user to answer questions
    // This promotes marketplace-style discussion and community engagement
    const isTaskPoster =
      question.posterId.toString() === req.user._id.toString();
    const isQuestionAsker =
      question.userId.toString() === req.user._id.toString();

    // For an open marketplace Q&A system, we allow any authenticated user to answer
    console.log(
      "✅ Authorization passed - open Q&A system allows all authenticated users to answer"
    );

    // For open Q&A, allow updating existing answers or adding new ones
    if (question.status === "answered") {
      console.log(
        "ℹ️ Question already has an answer - updating with new answer"
      );
    }

    console.log("✅ All validations passed, updating question with answer");

    // Get uploaded image URLs from multer-s3
    const imageUrls = req.files ? req.files.map((file) => file.location) : [];

    if (imageUrls.length > 0) {
      console.log(`✅ ${imageUrls.length} images uploaded to S3 for answer:`);
      imageUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    }

    // Update question with answer and images (include answerer info for open Q&A tracking)
    question.answer = {
      text: answerText.trim(),
      timestamp: new Date(),
      answeredBy: req.user._id, // Track who answered in open Q&A system
      images: imageUrls, // ✅ Save S3 URLs to MongoDB
    };
    question.status = "answered";

    await question.save();
    console.log("✅ Question updated and saved to database with answer images");

    // Populate the question for response including answer details
    const populatedQuestion = await Question.findById(question._id)
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email")
      .lean();

    console.log("✅ Answer created successfully");
    res.status(200).json({
      success: true,
      message: "Question answered successfully",
      data: populatedQuestion,
    });
  } catch (err) {
    console.error("Error answering question:", err);
    res.status(500).json({
      success: false,
      error: "Server error while answering question",
    });
  }
};

const filterAllTasks = (tasks, subSection, userId) => {
  if (!userId) return [];

  switch (subSection) {
    case "open":
      // Show all open tasks to both posters and taskers
      return tasks.filter((task) => task.status === "open");

    case "todo":
      return tasks.filter(
        (task) =>
          task.status === "assigned" &&
          (task.createdBy._id === userId || task.assignedTo?._id === userId)
      );

    case "completed":
      return tasks.filter(
        (task) =>
          task.status === "completed" &&
          (task.createdBy._id === userId || task.assignedTo?._id === userId)
      );

    case "overdue":
      return tasks.filter((task) => {
        if (!task.date || task.status === "completed") return false;
        const dueDate = new Date(task.date);
        return (
          dueDate < new Date() &&
          (task.createdBy._id === userId || task.assignedTo?._id === userId)
        );
      });

    case "expired":
      return tasks.filter((task) => {
        if (!task.date || task.assignedTo) return false;
        const dueDate = new Date(task.date);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return task.status === "open" && dueDate < twoWeeksAgo;
      });

    default:
      return tasks;
  }
};

// Update the searchTasks function to properly handle filters
exports.searchTasks = async (req, res) => {
  try {
    const {
      search,
      categories,
      location,
      minPrice,
      maxPrice,
      filters,
      sort = "recommended",
    } = req.query;

    console.log("Search params received:", { categories, filters });

    // Remove hardcoded status filter to allow all task statuses in search results
    const query = {};
    let categoryArray = [];

    // Handle filters
    if (filters) {
      const filterArray = Array.isArray(filters) ? filters : [filters];

      filterArray.forEach((filter) => {
        switch (filter) {
          case "Remote tasks only":
            query.isRemote = true;
            break;
          case "Local tasks only":
            query.isRemote = false;
            break;
          case "With photos only":
            query.images = { $exists: true, $ne: [] };
            break;
          case "Urgent tasks only":
            query.isUrgent = true;
            break;
        }
      });
    }

    // Rest of your existing category handling
    if (categories) {
      if (Array.isArray(categories)) {
        categoryArray = categories;
      } else if (typeof categories === "string") {
        categoryArray = categories.split(",");
      }

      categoryArray = [
        ...new Set(categoryArray.filter((c) => c.trim() !== "")),
      ];

      if (categoryArray.length > 0) {
        query.$and = categoryArray.map((category) => ({
          categories: { $regex: new RegExp(`\\b${category.trim()}\\b`, "i") },
        }));
      }
    }

    // Price range handling
    if (minPrice !== "undefined" || maxPrice !== "undefined") {
      if (minPrice !== "All" && maxPrice !== "All") {
        query.budget = {};

        if (minPrice && minPrice !== "undefined") {
          const min = parseFloat(minPrice);
          if (!isNaN(min)) {
            query.budget.$gte = min;
          }
        }

        if (maxPrice && maxPrice !== "undefined") {
          if (maxPrice.includes("+")) {
            // Handle 500+ case - only set minimum, no maximum
            const minValue = parseFloat(maxPrice.replace("+", ""));
            if (!isNaN(minValue)) {
              query.budget = { $gte: minValue };
            }
          } else {
            const max = parseFloat(maxPrice);
            if (!isNaN(max)) {
              query.budget.$lte = max;
            }
          }
        }

        // Remove empty budget query
        if (Object.keys(query.budget).length === 0) {
          delete query.budget;
        }
      }
    }

    // Location handling with consideration for remote/local filter
    if (location && location !== "undefined") {
      if (location.toLowerCase() === "remote") {
        query.isRemote = true;
      } else {
        query["location.address"] = { $regex: location, $options: "i" };
      }
    }

    // Search handling
    if (search && search !== "undefined") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    // Rest of your existing aggregation pipeline
    const tasks = await Task.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser",
        },
      },
      {
        $lookup: {
          from: "offers",
          localField: "_id",
          foreignField: "taskId",
          as: "offers",
        },
      },
      {
        $addFields: {
          offerCount: { $size: "$offers" },
          createdBy: { $arrayElemAt: ["$createdByUser", 0] },
          formattedDate: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$dateType", "Easy"] },
                  then: "Flexible date",
                },
                {
                  case: { $eq: ["$dateType", "DoneBy"] },
                  then: {
                    $concat: [
                      "Due by ",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$dateRange.end",
                          // Remove timezone conversion to preserve original date
                          timezone: "Australia/Sydney", // Or your local timezone
                        },
                      },
                    ],
                  },
                },
                {
                  case: { $eq: ["$dateType", "DoneOn"] },
                  then: {
                    $concat: [
                      "On ",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$dateRange.start",
                          // Remove timezone conversion to preserve original date
                          timezone: "Australia/Sydney", // Or your local timezone
                        },
                      },
                    ],
                  },
                },
              ],
              default: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$date",
                  // Remove timezone conversion to preserve original date
                  timezone: "Australia/Sydney", // Or your local timezone
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          categories: 1,
          date: 1,
          dateType: 1,
          dateRange: 1,
          formattedDate: 1,
          time: 1,
          location: 1,
          budget: 1,
          currency: 1,
          status: 1,
          offerCount: 1,
          details: 1,
          isRemote: 1,
          isUrgent: 1,
          images: 1,
          createdAt: 1,
          "createdBy._id": 1,
          "createdBy.name": 1,
          "createdBy.avatar": 1,
          "createdBy.rating": 1,
        },
      },
      {
        $sort: getSortQueryForAggregation(sort),
      },
    ]);

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      filters: {
        appliedCategories: categoryArray,
        appliedFilters: filters || [],
        appliedPriceRange: {
          min: query.budget?.$gte || null,
          max: query.budget?.$lte || null,
        },
      },
    });
  } catch (error) {
    console.error("Search tasks error:", error);
    res.status(500).json({
      success: false,
      error: "Error searching tasks",
      message: error.message,
    });
  }
};

// Add this new helper function for aggregation sorting
const getSortQueryForAggregation = (sort) => {
  switch (sort?.toLowerCase()) {
    case "recommended":
      return {
        isUrgent: -1, // Urgent tasks first
        offerCount: 1, // Tasks with fewer offers
        createdAt: -1, // Newer tasks
      };
    case "newest":
    case "newest_first":
      return { createdAt: -1 };
    case "oldest":
    case "oldest_first":
      return { createdAt: 1 };
    case "lowest_budget":
      return { budget: 1 };
    case "highest_budget":
      return { budget: -1 };
    default:
      return { createdAt: -1 };
  }
};
