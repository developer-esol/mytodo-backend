
/**
 * @swagger
 * tags:
 *   name: TaskOffers
 *   description: Task management and offer handling
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [TaskOffers]
 *     responses:
 *       200:
 *         description: List of tasks fetched successfully
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID with offers
 *     tags: [TaskOffers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details with offers
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */



/**
 * @swagger
 * /api/tasks/{id}/offers:
 *   get:
 *     summary: Get offers for a specific task
 *     tags: [TaskOffers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: List of offers for the task
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tasks/{id}/offers:
 *   post:
 *     summary: Create an offer for a task
 *     tags: [TaskOffers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               offerAmount:
 *                 type: number
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Offer created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/tasks/{taskId}/offers/{offerId}/accept:
 *   put:
 *     summary: Accept an offer for a task
 *     tags: [TaskOffers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     responses:
 *       200:
 *         description: Offer accepted successfully
 *       404:
 *         description: Task or Offer not found
 *       500:
 *         description: Server error
 */