/**
 * @swagger
 * tags:
 *   name: TwoFactorAuth
 *   description: Two-Factor Authentication Routes
 */

/**
 * @swagger
 * /api/auth/otp-verification:
 *   post:
 *     summary: Verify email OTP and send SMS OTP
 *     tags: [TwoFactorAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified, SMS OTP sent
 *       400:
 *         description: Invalid OTP or expired
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/sms-verification:
 *   post:
 *     summary: Verify SMS OTP and finalize account creation
 *     tags: [TwoFactorAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account verified and created successfully
 *       400:
 *         description: Invalid OTP or verification failed
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend new OTP to user (Email & SMS)
 *     tags: [TwoFactorAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 description: Phone number (optional if already provided)
 *     responses:
 *       200:
 *         description: New OTP sent successfully
 *       400:
 *         description: No pending verification found
 *       500:
 *         description: Failed to resend OTP
 */