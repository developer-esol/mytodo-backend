const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

// NOTE: Global protect middleware removed to prevent conflicts with userReviewRoutes
// Each route now applies protect middleware individually as needed

/**
 * @swagger
 * /api/tasks/{taskId}/reviews:
 *   post:
 *     summary: Submit a review for a completed task
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               reviewText:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional review text
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Invalid request or user cannot review this task
 *       404:
 *         description: Task not found
 */
router.post("/tasks/:taskId/reviews", protect, reviewController.submitReview);

/**
 * @swagger
 * /api/tasks/{taskId}/reviews:
 *   get:
 *     summary: Get all reviews for a specific task
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     responses:
 *       200:
 *         description: List of reviews for the task
 *       404:
 *         description: Task not found
 */
router.get("/tasks/:taskId/reviews", protect, reviewController.getTaskReviews);

/**
 * @swagger
 * /api/tasks/{taskId}/can-review:
 *   get:
 *     summary: Check if current user can review a task
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Review eligibility information
 */
router.get("/tasks/:taskId/can-review", protect, reviewController.checkCanReview);

// NOTE: User review routes moved to userReviewRoutes.js (new system)
// These old routes are commented out to avoid conflicts with the new system
// The new routes support public access (no auth required) and better structure

// /**
//  * @swagger
//  * /api/users/{userId}/reviews:
//  *   get:
//  *     summary: Get all reviews for a specific user (DEPRECATED - Use userReviewRoutes)
//  */
// router.get("/users/:userId/reviews", reviewController.getUserReviews);

// /**
//  * @swagger
//  * /api/users/{userId}/rating-stats:
//  *   get:
//  *     summary: Get detailed rating statistics for a user (DEPRECATED - Use userReviewRoutes)
//  */
// router.get("/users/:userId/rating-stats", reviewController.getUserRatingStats);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update a review (only by the reviewer)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               reviewText:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Unauthorized to update this review
 *       404:
 *         description: Review not found
 */
router.put("/reviews/:reviewId", protect, reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review (only by the reviewer)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Unauthorized to delete this review
 *       404:
 *         description: Review not found
 */
router.delete("/reviews/:reviewId", protect, reviewController.deleteReview);

/**
 * @swagger
 * /api/reviews/{reviewId}/response:
 *   post:
 *     summary: Add a response to a review (only by the reviewee)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responseText
 *             properties:
 *               responseText:
 *                 type: string
 *                 maxLength: 500
 *                 description: Response text
 *     responses:
 *       200:
 *         description: Response added successfully
 *       403:
 *         description: Unauthorized to respond to this review
 *       404:
 *         description: Review not found
 */
router.post("/reviews/:reviewId/response", protect, reviewController.respondToReview);

module.exports = router;
