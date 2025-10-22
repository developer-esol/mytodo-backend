const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const {protect} = require("../middleware/authMiddleware");
const {uploadFiles} = require("../middleware/uploadMiddleware");
const {uploadQuestionImages, uploadAnswerImages, handleUploadError, logUploadedFiles} = require("../middleware/uploadQA");
const myTaskController = require("../controllers/myTaskController");

// Route handlers
const createTaskHandler = [protect, uploadFiles, taskController.createTask];

// Add search route before other routes
router.get("/search", taskController.searchTasks);

// Standard routes under /api/tasks
router.route("/").post(createTaskHandler).get(taskController.getTasks);

// Add specific route for post-task (to maintain backward compatibility)
router.post("/post-task", createTaskHandler);

// Add this new route for user's tasks
router.route("/my-tasks").get(
  protect,
  myTaskController.getMyTasks // Only call the main getMyTasks handler
);

// Add new route for user's offers
router.route("/my-offers").get(protect, myTaskController.getMyTasks);

// Task acceptance route - add this before other routes
router.post("/:id/accept", protect);

router
  .route("/:id")
  .get(taskController.getTask)
  .put(protect, taskController.updateTask)
  .delete(protect, taskController.deleteTask);

// Offer-related routes
router
  .route("/:id/offers")
  .get(taskController.getTaskWithOffers)
  .post(protect, taskController.createTaskOffer);

// Specific offer actions
router
  .route("/:taskId/offers/:offerId/accept")
  .post(protect, myTaskController.getMyTasks, myTaskController.acceptOffer) // Accept an offer
  .put(protect, myTaskController.acceptOffer); // Accept an offer

// Legacy routes (duplicate for backward compatibility)
router.route("/").post(createTaskHandler); // This will handle POST /api/post-task

// Payment-related routes
router.post(
  "/:taskId/complete-payment",
  protect,
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
  .get(taskController.getTaskQuestions) // Get all questions for a task
  .post(protect, uploadQuestionImages, handleUploadError, logUploadedFiles, taskController.createQuestion); // Post new question with images

router
  .route("/:taskId/questions/:questionId/answer")
  .post(protect, uploadAnswerImages, handleUploadError, logUploadedFiles, taskController.answerQuestion); // Answer a question with images
// router.post(/questions,
// protect,
// taskController.createQuestion
// );

// Add this route in TaskRoutes.js
router.patch("/:taskId/complete", protect, myTaskController.completeTask);
// Frontend expects PUT, so add PUT route as well
router.put("/:taskId/complete", protect, myTaskController.completeTask);

// Add completion status check route
router.get("/:taskId/completion-status", protect, myTaskController.checkTaskCompletionStatus);

// Add cancel route
router.put("/:taskId/cancel", protect, myTaskController.cancelTask);

router.route("/:id/status").put(protect, taskController.updateTaskStatus);

router.route("/:id/complete").patch(protect, myTaskController.completeTask);

router.route("/:id/accept").post(protect, myTaskController.acceptOffer);

// Get tasks for a specific user
router.route("/user/:userId").get(protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require('mongoose');
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Find tasks where user is creator or assigned
    const tasks = await require('../models/Task').find({
      $or: [
        { createdBy: userId },
        { assignedTo: userId }
      ]
    })
    .populate('createdBy', 'firstName lastName avatar')
    .populate('assignedTo', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .lean();

    // Format tasks for frontend
    const formattedTasks = tasks.map(task => ({
      _id: task._id,
      title: task.title,
      status: task.status,
      budget: task.budget,
      currency: task.currency || 'USD',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      date: task.dateRange?.start || task.createdAt,
      createdBy: task.createdBy,
      assignedTo: task.assignedTo,
      // Add mock rating and review for completed tasks
      rating: task.status === 'completed' ? Math.floor(Math.random() * 2) + 4 : undefined,
      review: task.status === 'completed' ? 
        [
          "Great work! Very professional and efficient.",
          "Excellent service. Would definitely hire again.",
          "Perfect job done on time and within budget.",
          "Outstanding quality work. Highly recommended!"
        ][Math.floor(Math.random() * 4)] : undefined
    }));

    res.json({
      success: true,
      count: formattedTasks.length,
      data: formattedTasks
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user tasks"
    });
  }
});

module.exports = router;
