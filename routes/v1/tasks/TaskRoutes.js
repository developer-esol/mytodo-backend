const express = require("express");
const router = express.Router();
const taskController = require("../../../controllers/taskController");
const { protect } = require("../../../middleware/authMiddleware");
const { uploadFiles } = require("../../../middleware/uploadMiddleware");
const {
  uploadQuestionImages,
  uploadAnswerImages,
  handleUploadError,
  logUploadedFiles,
} = require("../../../middleware/uploadQA");
const myTaskController = require("../../../controllers/myTaskController");
const validators = require("../../../validators/v1/tasks/tasks.validator");

// Route handlers
const createTaskHandler = [
  protect,
  uploadFiles,
  validators.createTask,
  taskController.createTask,
];

// Add search route before other routes
router.get("/search", taskController.searchTasks);

// Standard routes under /api/tasks
router
  .route("/")
  .post(createTaskHandler)
  .get(validators.getTasks, taskController.getTasks);

// Add specific route for post-task (to maintain backward compatibility)
router.post("/post-task", createTaskHandler);

// Add this new route for user's tasks
router.route("/my-tasks").get(
  protect,
  validators.getMyTasks,
  myTaskController.getMyTasks // Only call the main getMyTasks handler
);

// Add new route for user's offers
router
  .route("/my-offers")
  .get(protect, validators.getMyTasks, myTaskController.getMyTasks);

// Task acceptance route - add this before other routes
router.post("/:id/accept", protect);

router
  .route("/:id")
  .get(validators.getTaskById, taskController.getTask)
  .put(protect, validators.updateTask, taskController.updateTask)
  .delete(protect, validators.deleteTask, taskController.deleteTask);

// Offer-related routes
router
  .route("/:id/offers")
  .get(validators.getTaskById, taskController.getTaskWithOffers)
  .post(protect, validators.createOffer, taskController.createTaskOffer);

// Specific offer actions
router
  .route("/:taskId/offers/:offerId/accept")
  .post(
    protect,
    validators.acceptOffer,
    myTaskController.getMyTasks,
    myTaskController.acceptOffer
  ) // Accept an offer
  .put(protect, validators.acceptOffer, myTaskController.acceptOffer); // Accept an offer

// Legacy routes (duplicate for backward compatibility)
router.route("/").post(createTaskHandler); // This will handle POST /api/post-task

// Payment-related routes
router.post(
  "/:taskId/complete-payment",
  protect,
  validators.completePayment,
  taskController.completeTaskPayment
);

// Tasks with payment status
router.get(
  "/my-tasks/payment-status",
  protect,
  taskController.getTasksWithPaymentStatus
);
router
  .route("/:taskId/questions")
  .get(validators.completeTask, taskController.getTaskQuestions) // Get all questions for a task
  .post(
    protect,
    uploadQuestionImages,
    handleUploadError,
    logUploadedFiles,
    validators.createQuestion,
    taskController.createQuestion
  ); // Post new question with images

router
  .route("/:taskId/questions/:questionId/answer")
  .post(
    protect,
    uploadAnswerImages,
    handleUploadError,
    logUploadedFiles,
    validators.answerQuestion,
    taskController.answerQuestion
  ); // Answer a question with images
// router.post(/questions,
// protect,
// taskController.createQuestion
// );

// Add this route in TaskRoutes.js
router.patch(
  "/:taskId/complete",
  protect,
  validators.completeTask,
  myTaskController.completeTask
);
// Frontend expects PUT, so add PUT route as well
router.put(
  "/:taskId/complete",
  protect,
  validators.completeTask,
  myTaskController.completeTask
);

// Add completion status check route
router.get(
  "/:taskId/completion-status",
  protect,
  validators.completeTask,
  myTaskController.checkTaskCompletionStatus
);

// Add cancel route
router.put(
  "/:taskId/cancel",
  protect,
  validators.cancelTask,
  myTaskController.cancelTask
);

router
  .route("/:id/status")
  .put(protect, validators.updateTaskStatus, taskController.updateTaskStatus);

router
  .route("/:id/complete")
  .patch(protect, validators.completeTask, myTaskController.completeTask);

router.route("/:id/accept").post(protect, myTaskController.acceptOffer);

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
