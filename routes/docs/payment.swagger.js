/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment related operations
 */

/**
 * @swagger
 * /api/payments/tasks/{taskId}/create-payment-intent:
 *   post:
 *     summary: Create a payment intent for a task
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payments/tasks/{taskId}/complete-payment:
 *   post:
 *     summary: Complete payment after success
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *     responses:
 *       200:
 *         description: Payment completed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payments/status/{paymentIntentId}:
 *   get:
 *     summary: Get payment status by payment intent ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment Intent ID
 *     responses:
 *       200:
 *         description: Payment status fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
