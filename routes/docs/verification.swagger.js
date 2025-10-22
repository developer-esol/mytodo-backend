/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: User identity verification endpoints using RatifyID
 */

/**
 * @swagger
 * /api/verify/ratify/initialize:
 *   post:
 *     summary: Initialize RatifyID verification process
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification session initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     verificationUrl:
 *                       type: string
 *                     sessionId:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error during initialization
 */

/**
 * @swagger
 * /api/verify/ratify/callback:
 *   post:
 *     summary: Handle RatifyID verification callback
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               verificationData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Verification callback processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error processing callback
 */

/**
 * @swagger
 * /api/verify/ratify/status:
 *   get:
 *     summary: Check verification status
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No verification session found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error checking status
 */
