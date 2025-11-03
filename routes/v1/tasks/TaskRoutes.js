const express = require("express");
const router = express.Router();
const myTaskController = require("../../../controllers/tasks/task.controller");
const { protect } = require("../../../middleware/authMiddleware");
const { uploadFiles } = require("../../../middleware/uploadMiddleware");
const {
  uploadQuestionImages,
  uploadAnswerImages,
  handleUploadError,
  logUploadedFiles,
} = require("../../../middleware/uploadQA");
const validators = require("../../../validators/v1/tasks/tasks.validator");

// Route handlers
const createTaskHandler = [
  protect,
  uploadFiles,
  validators.createTask,
  myTaskController.createTask,
];

// Add search route before other routes
router.get("/search", myTaskController.searchTasks);

// Standard routes under /api/tasks
router.post("/", createTaskHandler);
router.get("/", ...validators.getTasks, myTaskController.getTasks);

// Add specific route for post-task (to maintain backward compatibility)
router.post("/post-task", createTaskHandler);

// Add this new route for user's tasks
router.get(
  "/my-tasks",
  protect,
  ...validators.getMyTasks,
  myTaskController.getMyTasks
);

// Add new route for user's offers
router.get("/my-offers", protect, myTaskController.getMyOffers);

// Task acceptance route - add this before other routes
router.post("/:id/accept", protect);

// Task CRUD routes
router.get("/:id", ...validators.getTaskById, myTaskController.getTask);
router.put(
  "/:id",
  protect,
  ...validators.updateTask,
  myTaskController.updateTask
);
router.delete(
  "/:id",
  protect,
  ...validators.deleteTask,
  myTaskController.deleteTask
);

// Offer-related routes
router.get(
  "/:id/offers",
  ...validators.getTaskById,
  myTaskController.getTaskWithOffers
);
router.post(
  "/:id/offers",
  protect,
  ...validators.createOffer,
  myTaskController.createTaskOffer
);

// Specific offer actions
router.post(
  "/:taskId/offers/:offerId/accept",
  protect,
  ...validators.acceptOffer,
  myTaskController.acceptOffer
);

// Question and Answer routes
router.get(
  "/:taskId/questions",
  ...validators.completeTask,
  myTaskController.getTaskQuestions
);

router.post(
  "/:taskId/questions",
  protect,
  uploadQuestionImages,
  handleUploadError,
  logUploadedFiles,
  ...validators.createQuestion,
  myTaskController.createQuestion
);

router.post(
  "/:taskId/questions/:questionId/answer",
  protect,
  uploadAnswerImages,
  handleUploadError,
  logUploadedFiles,
  ...validators.answerQuestion,
  myTaskController.answerQuestion
);

// Task completion routes
router.patch(
  "/:taskId/complete",
  protect,
  ...validators.completeTask,
  myTaskController.completeTask
);

router.put(
  "/:taskId/complete",
  protect,
  ...validators.completeTask,
  myTaskController.completeTask
);

// Add completion status check route
router.get(
  "/:taskId/completion-status",
  protect,
  ...validators.completeTask,
  myTaskController.checkTaskCompletionStatus
);

// Add cancel route
router.put(
  "/:taskId/cancel",
  protect,
  ...validators.cancelTask,
  myTaskController.cancelTask
);

// Update task status route
router.put(
  "/:id/status",
  protect,
  ...validators.updateTaskStatus,
  myTaskController.updateTaskStatus
);

// Get task with all offers
router.get(
  "/:id/with-offers",
  ...validators.getTaskById,
  myTaskController.getTaskWithOffers
);

// Get tasks for a specific user
router
  .route("/user/:userId")
  .get(protect, validators.getUserTasks, async (req, res) => {
    try {
      const { userId } = req.params;
      const mongoose = require("mongoose");

      // Validate user ID
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Find tasks where user is creator or assigned
      const tasks = await require("../models/TaskDelete")
        .find({
          $or: [{ createdBy: userId }, { assignedTo: userId }],
        })
        .populate("createdBy", "firstName lastName avatar")
        .populate("assignedTo", "firstName lastName avatar")
        .sort({ createdAt: -1 })
        .lean();

      // Format tasks for frontend
      const formattedTasks = tasks.map((task) => ({
        _id: task._id,
        title: task.title,
        status: task.status,
        budget: task.budget,
        currency: task.currency || "USD",
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        date: task.dateRange?.start || task.createdAt,
        createdBy: task.createdBy,
        assignedTo: task.assignedTo,
        // Add mock rating and review for completed tasks
        rating:
          task.status === "completed"
            ? Math.floor(Math.random() * 2) + 4
            : undefined,
        review:
          task.status === "completed"
            ? [
                "Great work! Very professional and efficient.",
                "Excellent service. Would definitely hire again.",
                "Perfect job done on time and within budget.",
                "Outstanding quality work. Highly recommended!",
              ][Math.floor(Math.random() * 4)]
            : undefined,
      }));

      res.json({
        success: true,
        count: formattedTasks.length,
        data: formattedTasks,
      });
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching user tasks",
      });
    }
  });

module.exports = router;
