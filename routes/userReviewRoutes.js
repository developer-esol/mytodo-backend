const express = require("express");
const router = express.Router();
const userReviewController = require("../controllers/userReviewController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/users/{userId}/rating-stats:
 *   get:
 *     summary: Get user rating statistics
 *     tags: [User Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Rating statistics retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/users/:userId/rating-stats", userReviewController.getUserRatingStats);

/**
 * @swagger
 * /api/users/{userId}/reviews:
 *   get:
 *     summary: Get user reviews (paginated)
 *     tags: [User Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [poster, tasker]
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [reviewer, task]
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get("/users/:userId/reviews", userReviewController.getUserReviews);

/**
 * @swagger
 * /api/users/{userId}/reviews:
 *   post:
 *     summary: Submit a review for a user
 *     tags: [User Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - reviewText
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               reviewText:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               taskId:
 *                 type: string
 *                 description: Optional task ID
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Invalid request
 */
router.post("/users/:userId/reviews", protect, userReviewController.submitUserReview);

/**
 * @swagger
 * /api/users/{userId}/can-review:
 *   get:
 *     summary: Check if current user can review another user
 *     tags: [User Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to check
 *     responses:
 *       200:
 *         description: Review eligibility information
 */
router.get("/users/:userId/can-review", protect, userReviewController.canReviewUser);

/**
 * @swagger
 * /api/users/request-review:
 *   post:
 *     summary: Send review request via email or SMS
 *     tags: [User Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - recipient
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [email, sms]
 *               recipient:
 *                 type: string
 *                 description: Email address or phone number
 *               message:
 *                 type: string
 *                 description: Optional custom message
 *     responses:
 *       200:
 *         description: Review request sent successfully
 */
router.post("/users/request-review", protect, userReviewController.requestReview);

module.exports = router;
