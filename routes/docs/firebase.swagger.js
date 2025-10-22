/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat messages for tasks with file upload support
 */

/**
 * @swagger
 * /api/chats/{taskId}/messages:
 *   get:
 *     summary: Get chat messages for a specific task
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID to fetch chat messages for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: List of chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   text:
 *                     type: string
 *                   senderId:
 *                     type: string
 *                   senderName:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   messageType:
 *                     type: string
 *                     enum: [text, image, file, audio, video]
 *                   attachments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         fileName:
 *                           type: string
 *                         originalName:
 *                           type: string
 *                         fileUrl:
 *                           type: string
 *                         fileType:
 *                           type: string
 *                         fileSize:
 *                           type: integer
 *                         thumbnailUrl:
 *                           type: string
 *                   hasAttachments:
 *                     type: boolean
 *                   isRead:
 *                     type: boolean
 *                   isEdited:
 *                     type: boolean
 *       400:
 *         description: Invalid task ID
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chats/{taskId}/messages:
 *   post:
 *     summary: Send a new text message for a specific task
 *     tags: [Chats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - senderId
 *               - senderName
 *             properties:
 *               text:
 *                 type: string
 *                 description: The message text
 *               senderId:
 *                 type: string
 *                 description: ID of the message sender
 *               senderName:
 *                 type: string
 *                 description: Name of the message sender
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID for which message is sent
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Firebase message ID
 *                 mongoId:
 *                   type: string
 *                   description: MongoDB message ID
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Missing required fields or invalid task ID
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chats/{taskId}/upload:
 *   post:
 *     summary: Upload multiple files to a chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID for the chat
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *               - senderId
 *               - senderName
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 10 files, 25MB each)
 *               senderId:
 *                 type: string
 *                 description: ID of the message sender
 *               senderName:
 *                 type: string
 *                 description: Name of the message sender
 *               text:
 *                 type: string
 *                 description: Optional message text
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 id:
 *                   type: string
 *                 mongoId:
 *                   type: string
 *                 message:
 *                   type: string
 *                 attachments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fileName:
 *                         type: string
 *                       originalName:
 *                         type: string
 *                       fileUrl:
 *                         type: string
 *                       fileType:
 *                         type: string
 *                       fileSize:
 *                         type: integer
 *                 fileCount:
 *                   type: integer
 *       400:
 *         description: Invalid request or file type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chats/{taskId}/upload-single:
 *   post:
 *     summary: Upload a single file to a chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID for the chat
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - senderId
 *               - senderName
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 25MB)
 *               senderId:
 *                 type: string
 *                 description: ID of the message sender
 *               senderName:
 *                 type: string
 *                 description: Name of the message sender
 *               text:
 *                 type: string
 *                 description: Optional message text
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 id:
 *                   type: string
 *                 mongoId:
 *                   type: string
 *                 message:
 *                   type: string
 *                 attachment:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     fileSize:
 *                       type: integer
 *                 messageType:
 *                   type: string
 *       400:
 *         description: Invalid request or file type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chats/{taskId}/stats:
 *   get:
 *     summary: Get chat statistics for a task
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID to get stats for
 *     responses:
 *       200:
 *         description: Chat statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 chatId:
 *                   type: string
 *                 totalMessages:
 *                   type: integer
 *                 messagesWithFiles:
 *                   type: integer
 *                 recentMessages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       text:
 *                         type: string
 *                       senderName:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       messageType:
 *                         type: string
 *                       hasAttachments:
 *                         type: boolean
 *       400:
 *         description: Invalid task ID
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
