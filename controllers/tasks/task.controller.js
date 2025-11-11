const mongoose = require("mongoose");
const Task = require("../../models/task/Task");
const Offer = require("../../models/task/Offer");
const User = require("../../models/user/User");
const Question = require("../../models/task/Question");
const Chat = require("../../models/chat/Chat");
const logger = require("../../config/logger");
// Image upload helpers (S3)
const { uploadBase64Array } = require("../../utils/imageUpload");
const taskServices = require("../../servicesN/tasks/tasks.services");

const taskService = require("../../servicesN/tasks/tasks.services");
const taskRepository = require("../../repository/task/task.repository");
const notificationService = require("../../shared/services/notificationService");
// Image upload helpers (S3)
const { uploadBase64Array } = require("../../utils/imageUpload");

exports.createTask = async (req, res) => {
  try {
    logger.debug("Creating task", {
      controller: "task.controller",
      userId: req.user?._id,
      category: req.body.category,
      budget: req.body.budget,
      fileCount: req.files?.length || 0,
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
      locationType,
      isMovingTask,
      pickupLocation,
      pickupPostalCode,
      dropoffLocation,
      dropoffPostalCode,
    } = req.body;

    const time = rawTime && rawTime.trim() !== "" ? rawTime : "Anytime";

    const userAgent = req.headers["user-agent"] || "";
    const isMobileApp =
      userAgent.includes("MyToDoo-Mobile") ||
      userAgent.includes("Expo") ||
      req.headers["x-platform"] === "mobile";

    logger.debug("Request platform detection:", {
      controller: "task.controller",
      userAgent,
      isMobileApp,
      isMovingTask,
      xPlatform: req.headers["x-platform"],
    });

    if (!["Easy", "DoneBy", "DoneOn"].includes(dateType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid dateType provided",
      });
    }

    const effectiveLocationType = locationType || "In-person";

    if (locationType && !["In-person", "Online"].includes(locationType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid locationType. Must be 'In-person' or 'Online'",
      });
    }

    const missingFields = [];
    if (!title || title.trim() === "") missingFields.push("title");
    if (!category || category.trim() === "") missingFields.push("category");

    if (
      effectiveLocationType === "In-person" &&
      (!location || location.trim() === "")
    ) {
      missingFields.push("location (required for In-person tasks)");
    }

    if (!details || details.trim() === "") missingFields.push("details");
    if (!budget || isNaN(Number(budget))) missingFields.push("budget");

    if (isMobileApp && isMovingTask) {
      logger.debug("Validating moving task fields:", {
        controller: "task.controller",
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

    // Safe parse helper
    const safeParse = (val) => {
      if (typeof val !== "string") return val;
      const trimmed = val.trim();
      // Only attempt JSON.parse if it looks like JSON
      if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return val;
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        logger.warn("safeParse JSON failed", {
          controller: "task.controller",
          fieldSample: trimmed.substring(0, 50),
          error: e.message,
        });
        return val; // Return original string; caller can handle differently
      }
    };

    const coordinatesRaw = req.body.coordinates;
    const coordinatesParsed = safeParse(coordinatesRaw);
    const coordinates =
      coordinatesParsed && typeof coordinatesParsed === "object"
        ? coordinatesParsed
        : undefined;

    let startDate, endDate;

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

    const locationObj = {
      address:
        effectiveLocationType === "Online"
          ? "Remote"
          : Array.isArray(location)
          ? location[0]
          : location,
    };

    if (coordinates && effectiveLocationType === "In-person") {
      locationObj.coordinates = {
        type: "Point",
        coordinates: [coordinates.lng || coordinates.lon, coordinates.lat],
      };
    }

    // Build image URL array (prefer multipart; fallback to base64 -> S3)
    let imageUrls = [];
    if (req.files?.length) {
      imageUrls = req.files.map((f) => f.location);
      logger.debug("Using multipart uploaded images", {
        controller: "task.controller",
        count: imageUrls.length,
      });
    } else if (req.body.images) {
      let rawImages = req.body.images;
      if (typeof rawImages === "string") {
        const trimmed = rawImages.trim();
        // If it's a pure base64 data URL, wrap as array directly
        if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(trimmed)) {
          rawImages = [trimmed];
        } else if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          // Attempt JSON parse only if it appears to be JSON
          const parsed = safeParse(trimmed);
          rawImages = Array.isArray(parsed)
            ? parsed
            : typeof parsed === "object" &&
              parsed.images &&
              Array.isArray(parsed.images)
            ? parsed.images
            : trimmed.includes(",")
            ? trimmed.split(",").map((s) => s.trim())
            : [trimmed];
        } else {
          // Comma-separated or single value
          rawImages = trimmed.includes(",")
            ? trimmed.split(",").map((s) => s.trim())
            : [trimmed];
        }
      }

      if (Array.isArray(rawImages)) {
        logger.debug("Processed rawImages candidate array", {
          controller: "task.controller",
          count: rawImages.length,
        });
        const base64List = rawImages.filter((img) =>
          /^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(img)
        );
        const nonBase64 = rawImages.filter(
          (img) => !/^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(img)
        );
        if (nonBase64.length) {
          logger.warn("Ignoring non-base64 images strings in images field", {
            controller: "task.controller",
            ignoredCount: nonBase64.length,
          });
        }
        if (base64List.length) {
          try {
            const uploaded = await uploadBase64Array(base64List, {
              folder: "tasks",
            });
            imageUrls = imageUrls.concat(uploaded);
            logger.info("Converted base64 task images to S3 URLs", {
              controller: "task.controller",
              uploadedCount: uploaded.length,
            });
          } catch (imgErr) {
            logger.error("Failed converting base64 images", {
              controller: "task.controller",
              error: imgErr.message,
            });
          }
        }
      }
    }

    const taskData = {
      title,
      categories: Array.isArray(category)
        ? category.map((c) => c.trim())
        : category.includes(",")
        ? category.split(",").map((c) => c.trim())
        : [category.trim()],
      locationType: effectiveLocationType,
      date: endDate,
      time,
      location: locationObj,
      details,
      budget: Number(budget),
      currency,
      images: imageUrls,
      status: "open",
      createdBy: req.user._id,
      dateType,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

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

      logger.debug("Adding moving details to task", {
        controller: "task.controller",
        movingDetails: taskData.movingDetails,
      });
    }

    const task = new Task(taskData);

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "email firstName lastName avatar rating")
      .exec();

    try {
      await notificationService.notifyTaskPosted(
        populatedTask,
        populatedTask.createdBy
      );
      logger.info("Task creation notification sent successfully");
    } catch (notificationError) {
      logger.warn("Error sending task creation notification", {
        controller: "task.controller",
        error: notificationError.message,
      });
    }

    logger.info("Task created successfully", {
      controller: "task.controller",
      taskId: populatedTask._id,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (err) {
    logger.error("Error creating task", {
      controller: "task.controller",
      error: err.message,
      stack: err.stack,
    });
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

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

    const query = { isActive: 1 };

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (status) {
      query.status = status;
    } else {
      query.status = "open";
    }

    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
      ];
    }

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

    const tasksQuery = Task.find(query)
      .populate("createdBy", "firstName lastName avatar rating")
      .populate("assignedTo", "firstName lastName avatar")
      .lean();

    if (sort) {
      const sortFields = sort.split(",").join(" ");
      tasksQuery.sort(sortFields);
    } else {
      tasksQuery.sort("-createdAt");
    }

    const startIndex = (page - 1) * limit;
    tasksQuery.skip(startIndex).limit(limit);

    const tasks = await tasksQuery.exec();

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

    const offerCountMap = offerCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

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
      data: tasksWithOfferCounts,
    });
  } catch (err) {
    logger.error("Error fetching tasks", {
      controller: "task.controller",
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isActive: 1 })
      .populate("createdBy", "name avatar rating firstName lastName")
      .populate("assignedTo", "name avatar")
      .lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

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

    const taskWithFormattedDate = {
      ...task,
      formattedDate,
      dateRange: {
        start: task.dateRange?.start,
        end: task.dateRange?.end,
      },
    };

    logger.debug("Task date formatting");

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
    logger.error("Error fetching task", {
      controller: "task.controller",
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    logger.debug("Update task request", {
      controller: "task.controller",
      taskId,
      updates,
    });

    const task = await Task.findOne({ _id: taskId, isActive: 1 });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to update this task",
      });
    }

    let dateRange = task.dateRange;
    let dateType = updates.dateType || task.dateType;

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

    const updateData = {
      dateType: dateType,
      dateRange: dateRange,
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (dateRange.end) updateData.date = dateRange.end;

    if (updates.location?.address || updates.location) {
      updateData["location.address"] =
        updates.location?.address || updates.location;
    }
    if (updates.location?.coordinates || updates.coordinates) {
      updateData["location.coordinates"] =
        updates.location?.coordinates || updates.coordinates;
    }

    logger.debug("Update data to be applied", {
      controller: "task.controller",
      updateData,
    });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, isActive: 1 },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("createdBy", "name avatar rating");

    logger.info("Task updated successfully");

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (err) {
    logger.error("Error updating task", {
      controller: "task.controller",
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: err.message || "Server Error",
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;

    logger.debug("Delete task request", {
      controller: "task.controller",
      taskId,
      userId,
    });

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    const taskExists = await Task.findOne({ _id: taskId, isActive: 1 });
    if (!taskExists) {
      logger.warn("Task not found in database", {
        controller: "task.controller",
        taskId,
      });
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    if (taskExists.createdBy.toString() !== userId.toString()) {
      logger.warn("Unauthorized delete attempt");
      return res.status(403).json({
        success: false,
        error: "Unauthorized: You can only delete tasks you created",
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      createdBy: userId,
      isActive: 1,
    });

    logger.debug("Task found for deletion", {
      controller: "task.controller",
      taskId: task ? task._id : null,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or unauthorized",
      });
    }

    const deletableStatuses = ["open", "expired"];
    if (!deletableStatuses.includes(task.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete task with status '${task.status}'. Only tasks with status 'open' or 'expired' can be deleted.`,
      });
    }

    logger.debug("Soft deleting offers for taskId", {
      controller: "task.controller",
      taskId,
    });
    const offerDeleteResult = await taskRepository.softDeleteOffers(taskId);
    logger.debug("Soft deleted offers", {
      controller: "task.controller",
      count: offerDeleteResult.modifiedCount,
    });

    logger.debug("Soft deleting task", {
      controller: "task.controller",
      taskId,
    });
    await taskRepository.softDeleteTask(taskId, userId);
    logger.info("Task soft deleted successfully", {
      controller: "task.controller",
      taskId,
      userId,
    });

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (err) {
    logger.error("Error deleting task", {
      controller: "task.controller",
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      error: "Error deleting task",
    });
  }
};

exports.createTaskOffer = async (req, res) => {
  try {
    logger.debug("Incoming offer creation request");

    const { offerAmount, amount, currency, message, estimatedDuration } =
      req.body;
    const taskId = req.params.id;
    const taskTakerId = req.user._id;

    const selectedAmount =
      offerAmount !== undefined && offerAmount !== null && offerAmount !== ""
        ? offerAmount
        : amount;

    if (
      selectedAmount === undefined ||
      selectedAmount === null ||
      selectedAmount === ""
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required",
      });
    }

    const numericAmount = Number(selectedAmount);

    if (Number.isNaN(numericAmount)) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required",
      });
    }

    if (numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be positive",
      });
    }

    const task = await Task.findOne({ _id: taskId, isActive: 1 });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    if (task.status !== "open") {
      return res.status(400).json({
        success: false,
        error: "Task is no longer accepting offers",
      });
    }

    logger.debug("Creating offer for task");

    const offerCurrency = currency || task.currency || "LKR";

    const newOffer = new Offer({
      taskId: taskId,
      taskCreatorId: task.createdBy,
      taskTakerId: taskTakerId,
      offer: {
        amount: numericAmount,
        currency: offerCurrency,
        message: message?.trim(),
        estimatedDuration: estimatedDuration?.trim?.() || undefined,
      },
      status: "pending",
    });

    await newOffer.save();

    if (task.offers) {
      task.offers.push(newOffer._id);
      await task.save();
    }

    const newChat = new Chat({
      taskId: taskId,
      posterId: task.createdBy,
      taskerId: taskTakerId,
      chatStatus: "offer",
      status: "active",
    });

    await newChat.save();

    const populatedOffer = await Offer.findById(newOffer._id)
      .populate("taskTakerId", "firstName lastName avatar rating")
      .populate("taskCreatorId", "firstName lastName")
      .lean();

    try {
      await notificationService.notifyOfferMade(
        populatedOffer,
        task,
        populatedOffer.taskTakerId,
        populatedOffer.taskCreatorId
      );
      logger.info("Offer notification sent successfully", {
        controller: "task.controller",
        taskId,
        providerId: req.user._id,
      });
    } catch (notificationError) {
      logger.warn("Error sending offer notification", {
        controller: "task.controller",
        error: notificationError.message,
        taskId,
      });
    }

    logger.info("Offer created successfully", {
      controller: "task.controller",
      offerId: populatedOffer._id,
    });
    res.status(201).json({
      success: true,
      data: populatedOffer,
    });
  } catch (err) {
    logger.error("Error in createTaskOffer");
    res.status(500).json({
      success: false,
      error: "Server Error JNI: " + err.message,
    });
  }
};

exports.searchTasks = async (req, res) => {
  try {
    const {
      search, // primary search param (may be undefined)
      q, // alias commonly used by clients
      term, // another occasional alias
      categories,
      category, // alias
      location,
      minPrice,
      maxPrice,
      minBudget, // alias
      maxBudget, // alias
      status, // optional explicit status
      filters,
      sort = "recommended",
    } = req.query;

    logger.debug("Search params received", {
      controller: "task.controller",
      categories: categories || category,
      filters,
    });

    const query = { isActive: 1 };
    let categoryArray = [];

    // Default to only open tasks unless explicitly requested otherwise
    if (status) {
      query.status = status;
    } else {
      query.status = "open";
    }

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

    const incomingCategories = categories || category;
    if (incomingCategories) {
      if (Array.isArray(incomingCategories)) {
        categoryArray = incomingCategories;
      } else if (typeof incomingCategories === "string") {
        // try to parse JSON array first, else comma-split
        const trimmed = incomingCategories.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) categoryArray = parsed;
          } catch (_) {
            categoryArray = incomingCategories.split(",");
          }
        } else {
          categoryArray = incomingCategories.split(",");
        }
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

    const effMin = minPrice ?? minBudget;
    const effMax = maxPrice ?? maxBudget;
    if (effMin !== "undefined" || effMax !== "undefined") {
      if (effMin !== "All" && effMax !== "All") {
        query.budget = {};

        if (effMin && effMin !== "undefined") {
          const min = parseFloat(effMin);
          if (!isNaN(min)) {
            query.budget.$gte = min;
          }
        }

        if (effMax && effMax !== "undefined") {
          if (typeof effMax === "string" && effMax.includes("+")) {
            const minValue = parseFloat(effMax.replace("+", ""));
            if (!isNaN(minValue)) {
              query.budget = { $gte: minValue };
            }
          } else {
            const max = parseFloat(effMax);
            if (!isNaN(max)) {
              query.budget.$lte = max;
            }
          }
        }

        if (Object.keys(query.budget).length === 0) {
          delete query.budget;
        }
      }
    }

    if (location && location !== "undefined") {
      if (location.toLowerCase() === "remote") {
        query.isRemote = true;
      } else {
        query["location.address"] = { $regex: location, $options: "i" };
      }
    }

    // Resolve keyword from search | q | term
    const rawKeyword = (search ?? q ?? term ?? "").toString().trim();
    const hasKeyword = rawKeyword.length > 0 && rawKeyword !== "undefined";
    if (hasKeyword) {
      query.$or = [
        { title: { $regex: rawKeyword, $options: "i" } },
        { details: { $regex: rawKeyword, $options: "i" } },
      ];
    }

    logger.debug("Final query", {
      controller: "task.controller",
      query,
    });

    const getSortQueryForAggregation = (sort) => {
      switch (sort) {
        case "newest":
        case "newest_first":
        case "recommended":
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
                          timezone: "Australia/Sydney",
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
                          timezone: "Australia/Sydney",
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
                  timezone: "Australia/Sydney",
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
    logger.error("Search tasks error:");
    res.status(500).json({
      success: false,
      error: "Error searching tasks",
      message: error.message,
    });
  }
};

exports.getTaskQuestions = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    const task = await Task.findOne({ _id: taskId, isActive: 1 });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    const questions = await Question.find({ taskId: taskId })
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email")
      .sort("-createdAt")
      .lean();

    const formattedQuestions = questions.map((question) => {
      const formatted = {
        ...question,
        answers: [],
      };

      if (question.answer && question.answer.text) {
        formatted.answers = [
          {
            _id: question._id + "_answer",
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

    formattedQuestions.forEach((q) => {});

    res.status(200).json({
      success: true,
      count: formattedQuestions.length,
      data: formattedQuestions,
    });
  } catch (err) {
    logger.error("Error fetching questions:");
    res.status(500).json({
      success: false,
      error: "Server error while fetching questions",
    });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const questionText =
      req.body.questionText || req.body.text || req.body.question;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    if (!questionText || questionText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Question text is required. Use 'questionText', 'text', or 'question' field.",
      });
    }

    if (questionText.trim().length > 500) {
      return res.status(400).json({
        success: false,
        error: "Question text cannot exceed 500 characters",
      });
    }

    const task = await Task.findOne({ _id: taskId, isActive: 1 });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Images: prefer multipart; fallback to base64 data URLs in body
    let imageUrls = req.files ? req.files.map((file) => file.location) : [];
    if (!imageUrls.length && req.body.images) {
      let rawImages = req.body.images;
      if (typeof rawImages === "string") {
        try {
          rawImages = JSON.parse(rawImages);
        } catch (e) {
          rawImages = rawImages.includes(",")
            ? rawImages.split(",").map((s) => s.trim())
            : [rawImages.trim()];
        }
      }
      if (Array.isArray(rawImages)) {
        const base64List = rawImages.filter((img) =>
          /^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(img)
        );
        if (base64List.length) {
          try {
            const uploaded = await uploadBase64Array(base64List, {
              folder: "qa",
            });
            imageUrls = imageUrls.concat(uploaded);
            logger.info("Question base64 images uploaded", {
              controller: "task.controller",
              uploadedCount: uploaded.length,
            });
          } catch (imgErr) {
            logger.error("Failed uploading question base64 images", {
              controller: "task.controller",
              error: imgErr.message,
            });
          }
        }
      }
    }

    const question = new Question({
      taskId: taskId,
      userId: req.user._id,
      posterId: task.createdBy,
      question: {
        text: questionText.trim(),
        images: imageUrls,
      },
    });

    await question.save();

    const populatedQuestion = await Question.findById(question._id)
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .lean();

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: populatedQuestion,
    });
  } catch (err) {
    logger.error("Error creating question:");
    res.status(500).json({
      success: false,
      error: "Server error while creating question",
    });
  }
};

exports.answerQuestion = async (req, res) => {
  try {
    const { taskId, questionId } = req.params;
    const answerText = req.body.answerText || req.body.text || req.body.answer;

    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(questionId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID or question ID format",
      });
    }

    if (!answerText || answerText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Answer text is required. Use 'answerText', 'text', or 'answer' field.",
      });
    }

    if (answerText.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Answer text cannot exceed 1000 characters",
      });
    }

    const question = await Question.findOne({
      _id: questionId,
      taskId: taskId,
    }).populate("taskId");

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    let imageUrls = req.files ? req.files.map((file) => file.location) : [];
    if (!imageUrls.length && req.body.images) {
      let rawImages = req.body.images;
      if (typeof rawImages === "string") {
        try {
          rawImages = JSON.parse(rawImages);
        } catch (e) {
          rawImages = rawImages.includes(",")
            ? rawImages.split(",").map((s) => s.trim())
            : [rawImages.trim()];
        }
      }
      if (Array.isArray(rawImages)) {
        const base64List = rawImages.filter((img) =>
          /^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(img)
        );
        if (base64List.length) {
          try {
            const uploaded = await uploadBase64Array(base64List, {
              folder: "qa",
            });
            imageUrls = imageUrls.concat(uploaded);
            logger.info("Answer base64 images uploaded", {
              controller: "task.controller",
              uploadedCount: uploaded.length,
            });
          } catch (imgErr) {
            logger.error("Failed uploading answer base64 images", {
              controller: "task.controller",
              error: imgErr.message,
            });
          }
        }
      }
    }

    question.answer = {
      text: answerText.trim(),
      images: imageUrls,
      answeredBy: req.user._id,
      timestamp: new Date(),
    };

    await question.save();

    const populatedQuestion = await Question.findById(questionId)
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Answer posted successfully",
      data: populatedQuestion,
    });
  } catch (err) {
    logger.error("Error answering question:");
    res.status(500).json({
      success: false,
      error: "Server error while answering question",
    });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { section, subsection, subSection, status, role } = req.query;

    const tasks = await taskService.getMyTasksWithOffers(userId, {
      section,
      subsection,
      subSection,
      status,
      role,
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    logger.error("Error fetching tasks", {
      controller: "task.controller",
      error: error.message,
      stack: error.stack,
    });

    const statusCode = error.message === "Invalid user ID" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newStatus } = req.body;
    const userId = req.user._id;

    const task = await taskService.updateTaskStatusService(
      taskId,
      userId,
      newStatus,
      req.body.reason
    );

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error("Error updating task status:");

    let statusCode = 500;
    if (
      error.message.includes("Invalid") ||
      error.message.includes("transition")
    ) {
      statusCode = 400;
    } else if (error.message === "Task not found") {
      statusCode = 404;
    } else if (error.message.includes("Only")) {
      statusCode = 403;
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message || "Server error",
    });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const offers = await taskService.getUserOffers(userId, status);

    return res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    logger.error("Error fetching offers:");

    const statusCode = error.message === "Invalid user ID" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await taskService.completeTaskService(taskId, userId);

    return res.status(200).json({
      success: true,
      data: task,
      message: "Task completed successfully",
    });
  } catch (error) {
    logger.error("Error completing task:");

    let statusCode = 500;
    if (error.message.includes("Invalid")) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to complete task",
    });
  }
};

exports.checkTaskCompletionStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const completionStatus = await taskService.checkTaskCompletionStatus(
      taskId,
      userId
    );

    return res.status(200).json({
      success: true,
      data: completionStatus,
    });
  } catch (error) {
    logger.error("Error checking task completion status:");

    let statusCode = 500;
    if (error.message.includes("Invalid")) {
      statusCode = 400;
    } else if (error.message === "Task not found") {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.cancelTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await taskService.cancelTaskService(taskId, userId);

    return res.status(200).json({
      success: true,
      data: task,
      message: "Task cancelled successfully",
    });
  } catch (error) {
    logger.error("Error cancelling task:");

    let statusCode = 500;
    if (error.message.includes("Invalid")) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (error.message.includes("cannot be cancelled")) {
      statusCode = 403;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to cancel task",
    });
  }
};

exports.acceptOffer = async (req, res) => {
  try {
    const { taskId, offerId } = req.params;
    const userId = req.user._id;

    const result = await taskService.acceptOfferService(
      taskId,
      offerId,
      userId
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Offer accepted successfully",
    });
  } catch (error) {
    logger.error("Error accepting offer:");

    let statusCode = 500;
    if (
      error.message.includes("required") ||
      error.message.includes("Invalid")
    ) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (
      error.message.includes("Only") ||
      error.message.includes("not available") ||
      error.message.includes("does not belong")
    ) {
      statusCode = 403;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to accept offer",
    });
  }
};

exports.getTaskWithOffers = async (req, res) => {
  try {
    const taskId = req.params.id;

    const taskWithOffers = await taskService.getTaskWithOffersService(taskId);

    return res.status(200).json({
      success: true,
      data: taskWithOffers,
    });
  } catch (error) {
    logger.error("Error fetching task with offers:");

    let statusCode = 500;
    if (error.message.includes("Invalid")) {
      statusCode = 400;
    } else if (error.message === "Task not found") {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch task with offers",
    });
  }
};

// New: get similar tasks that have offers
exports.getSimilarOfferTasks = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { q, limit } = req.query;

    const results = await taskServices.getSimilarOfferTasksService(taskId, {
      q,
      limit: limit ? Number(limit) : 10,
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    logger.error("Error fetching similar offer tasks:", {
      controller: "task.controller",
      error: error.message,
      stack: error.stack,
    });
    let status = 500;
    if (error.message.includes("Invalid task ID")) status = 400;
    if (error.message.includes("Task not found")) status = 404;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * Filter and sort tasks with comprehensive options
 * @route GET /api/tasks/filter
 * @query {string} sortBy - price-high, price-low, earliest, latest, oldest, nearest
 * @query {number} lat - User latitude (required for nearest)
 * @query {number} lng - User longitude (required for nearest)
 * @query {number} radius - Search radius in km (default: 50)
 * @query {string} categories - Comma-separated categories
 * @query {number} minBudget - Minimum budget
 * @query {number} maxBudget - Maximum budget
 * @query {string} status - Task status (default: open)
 * @query {string} locationType - In-person or Online
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 */
exports.filterTasks = async (req, res) => {
  try {
    const {
      sortBy = "latest",
      lat,
      lng,
      radius = 50,
      categories,
      minBudget,
      maxBudget,
      status = "open",
      locationType,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    logger.info("Filter tasks request", {
      controller: "task.controller",
      sortBy,
      lat,
      lng,
      radius,
      categories,
      status,
    });

    // Build query
    const query = { isActive: 1, status };

    // Category filter
    if (categories) {
      const categoryArray = categories.split(",").map((c) => c.trim());
      if (categoryArray.length > 0) {
        query.categories = { $in: categoryArray };
      }
    }

    // Budget filter
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }

    // Location type filter
    if (locationType) {
      query.locationType = locationType;
    }

    // Search filter
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort options
    let sortOptions = {};
    let useGeoSearch = false;

    switch (sortBy) {
      case "price-high":
      case "price-high-to-low":
      case "highest-budget":
        sortOptions = { budget: -1, createdAt: -1 };
        break;

      case "price-low":
      case "price-low-to-high":
      case "lowest-budget":
        sortOptions = { budget: 1, createdAt: -1 };
        break;

      case "earliest":
        sortOptions = { "dateRange.start": 1, createdAt: -1 };
        break;

      case "latest":
      case "newest":
        sortOptions = { createdAt: -1 };
        break;

      case "oldest":
        sortOptions = { createdAt: 1 };
        break;

      case "nearest":
      case "closest":
        useGeoSearch = true;
        if (!lat || !lng) {
          return res.status(400).json({
            success: false,
            error: "Latitude and longitude are required for nearest sorting",
          });
        }
        break;

      default:
        sortOptions = { createdAt: -1 };
    }

    let tasks;
    let total;

    if (useGeoSearch && lat && lng) {
      // Geo-spatial search for nearest tasks
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusInMeters = parseFloat(radius) * 1000;

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({
          success: false,
          error: "Invalid latitude or longitude",
        });
      }

      // Use aggregation for geospatial search
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [userLng, userLat],
            },
            distanceField: "distance",
            maxDistance: radiusInMeters,
            spherical: true,
            query: query,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByUser",
          },
        },
        {
          $addFields: {
            createdBy: { $arrayElemAt: ["$createdByUser", 0] },
          },
        },
        {
          $project: {
            createdByUser: 0,
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) },
      ];

      tasks = await Task.aggregate(pipeline);

      // Get total count for pagination
      const countPipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [userLng, userLat],
            },
            distanceField: "distance",
            maxDistance: radiusInMeters,
            spherical: true,
            query: query,
          },
        },
        { $count: "total" },
      ];

      const countResult = await Task.aggregate(countPipeline);
      total = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      // Regular query with sorting
      const skip = (page - 1) * limit;

      tasks = await Task.find(query)
        .populate("createdBy", "firstName lastName avatar rating")
        .populate("assignedTo", "firstName lastName avatar rating")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      total = await Task.countDocuments(query);
    }

    const totalPages = Math.ceil(total / limit);

    logger.info("Filter tasks response", {
      controller: "task.controller",
      count: tasks.length,
      total,
      page,
      totalPages,
    });

    return res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error filtering tasks", {
      controller: "task.controller",
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      error: "Server error while filtering tasks",
      message: error.message,
    });
  }
};
