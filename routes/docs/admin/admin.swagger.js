/**
 * @swagger
 * tags:
 *   - name: Admin - Analytics
 *     description: Admin analytics and reporting endpoints
 *   - name: Admin - Authentication
 *     description: Admin authentication and authorization
 *   - name: Admin - Dashboard
 *     description: Admin dashboard statistics and overview
 *   - name: Admin - User Management
 *     description: Admin user management operations
 *   - name: Admin - Task Management
 *     description: Admin task management and monitoring
 *   - name: Admin - Commission Settings
 *     description: Commission and fee management
 *   - name: Admin - Metadata
 *     description: System metadata and configuration
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     AdminBearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Admin JWT token for authentication
 *
 *   schemas:
 *     AdminUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "admin@example.com"
 *         role:
 *           type: string
 *           enum: [admin, superadmin]
 *           example: "admin"
 *
 *     AnalyticsOverview:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           example: 1250
 *           description: Total number of registered users
 *         totalTasks:
 *           type: integer
 *           example: 3420
 *           description: Total number of tasks created
 *         totalRevenue:
 *           type: number
 *           format: float
 *           example: 45678.90
 *           description: Total revenue in selected period
 *         activeUsers:
 *           type: integer
 *           example: 850
 *           description: Number of active users
 *         userGrowth:
 *           type: number
 *           format: float
 *           example: 12.5
 *           description: User growth percentage
 *         taskGrowth:
 *           type: number
 *           format: float
 *           example: 8.3
 *           description: Task growth percentage
 *         revenueGrowth:
 *           type: number
 *           format: float
 *           example: 15.7
 *           description: Revenue growth percentage
 *         activeUserGrowth:
 *           type: number
 *           format: float
 *           example: 5.2
 *           description: Active user growth percentage
 *
 *     UserStats:
 *       type: object
 *       properties:
 *         posters:
 *           type: integer
 *           example: 650
 *           description: Number of users with poster role
 *         taskers:
 *           type: integer
 *           example: 580
 *           description: Number of users with tasker role
 *         admins:
 *           type: integer
 *           example: 20
 *           description: Number of admin users
 *         newUsersThisMonth:
 *           type: integer
 *           example: 125
 *           description: New users registered this month
 *
 *     TaskStats:
 *       type: object
 *       properties:
 *         open:
 *           type: integer
 *           example: 450
 *           description: Number of open tasks
 *         assigned:
 *           type: integer
 *           example: 320
 *           description: Number of assigned tasks
 *         completed:
 *           type: integer
 *           example: 2500
 *           description: Number of completed tasks
 *         cancelled:
 *           type: integer
 *           example: 150
 *           description: Number of cancelled tasks
 *         averageTaskValue:
 *           type: number
 *           format: float
 *           example: 125.50
 *           description: Average task budget value
 *         completionRate:
 *           type: number
 *           format: float
 *           example: 73.2
 *           description: Task completion rate percentage
 *
 *     RevenueStats:
 *       type: object
 *       properties:
 *         thisMonth:
 *           type: number
 *           format: float
 *           example: 5678.90
 *           description: Revenue for current month
 *         lastMonth:
 *           type: number
 *           format: float
 *           example: 4890.50
 *           description: Revenue for previous month
 *         commissions:
 *           type: number
 *           format: float
 *           example: 1234.56
 *           description: Total commission earned
 *         averageOrderValue:
 *           type: number
 *           format: float
 *           example: 89.45
 *           description: Average order value
 *
 *     DayDataPoint:
 *       type: object
 *       properties:
 *         _id:
 *           type: object
 *           properties:
 *             year:
 *               type: integer
 *               example: 2025
 *             month:
 *               type: integer
 *               example: 10
 *             day:
 *               type: integer
 *               example: 15
 *         count:
 *           type: integer
 *           example: 25
 *
 *     RevenueDataPoint:
 *       type: object
 *       properties:
 *         _id:
 *           type: object
 *           properties:
 *             year:
 *               type: integer
 *               example: 2025
 *             month:
 *               type: integer
 *               example: 10
 *             day:
 *               type: integer
 *               example: 15
 *         totalRevenue:
 *           type: number
 *           format: float
 *           example: 456.78
 *         totalPayments:
 *           type: number
 *           format: float
 *           example: 5678.90
 *         transactionCount:
 *           type: integer
 *           example: 15
 *         avgPayment:
 *           type: number
 *           format: float
 *           example: 378.59
 *
 *     CategoryPerformance:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "cleaning"
 *           description: Category ID/name
 *         taskCount:
 *           type: integer
 *           example: 125
 *           description: Number of tasks in category
 *         completedCount:
 *           type: integer
 *           example: 98
 *           description: Number of completed tasks
 *         completionRate:
 *           type: number
 *           format: float
 *           example: 78.4
 *           description: Completion rate percentage
 *         avgBudget:
 *           type: number
 *           format: float
 *           example: 125.50
 *           description: Average task budget
 *         totalBudget:
 *           type: number
 *           format: float
 *           example: 15687.50
 *           description: Total budget for category
 *
 *     MonthlyTrend:
 *       type: object
 *       properties:
 *         month:
 *           type: string
 *           example: "2025-10"
 *           description: Month in YYYY-MM format
 *         newUsers:
 *           type: integer
 *           example: 125
 *           description: New users in month
 *         tasksCreated:
 *           type: integer
 *           example: 320
 *           description: Tasks created in month
 *         revenue:
 *           type: number
 *           format: float
 *           example: 5678.90
 *           description: Revenue for month
 *
 *     AnalyticsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             overview:
 *               $ref: '#/components/schemas/AnalyticsOverview'
 *             userStats:
 *               $ref: '#/components/schemas/UserStats'
 *             taskStats:
 *               $ref: '#/components/schemas/TaskStats'
 *             revenueStats:
 *               $ref: '#/components/schemas/RevenueStats'
 *             charts:
 *               type: object
 *               properties:
 *                 userRegistrations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DayDataPoint'
 *                 taskCreations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DayDataPoint'
 *                 taskCompletions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DayDataPoint'
 *                 revenueData:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RevenueDataPoint'
 *                 monthlyRevenue:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                           month:
 *                             type: integer
 *                       revenue:
 *                         type: number
 *                       payments:
 *                         type: number
 *                       count:
 *                         type: integer
 *             topCategories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryPerformance'
 *             monthlyTrends:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonthlyTrend'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Failed to fetch analytics data"
 */

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get comprehensive analytics data
 *     description: |
 *       Retrieve detailed analytics including user statistics, task performance,
 *       revenue data, category performance, and trends over time.
 *
 *       **Features:**
 *       - User registration and growth metrics
 *       - Task creation and completion statistics
 *       - Revenue and payment analytics
 *       - Category performance analysis
 *       - Time-series data for charts
 *       - Monthly trends
 *
 *       **Time Range Options:**
 *       - `7d` - Last 7 days
 *       - `30d` - Last 30 days (default)
 *       - `90d` - Last 90 days
 *       - `1y` - Last 1 year
 *     tags:
 *       - Admin - Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time range for analytics data
 *         example: 30d
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsResponse'
 *             example:
 *               success: true
 *               data:
 *                 overview:
 *                   totalUsers: 1250
 *                   totalTasks: 3420
 *                   totalRevenue: 45678.90
 *                   activeUsers: 850
 *                   userGrowth: 12.5
 *                   taskGrowth: 8.3
 *                   revenueGrowth: 15.7
 *                   activeUserGrowth: 5.2
 *                 userStats:
 *                   posters: 650
 *                   taskers: 580
 *                   admins: 20
 *                   newUsersThisMonth: 125
 *                 taskStats:
 *                   open: 450
 *                   assigned: 320
 *                   completed: 2500
 *                   cancelled: 150
 *                   averageTaskValue: 125.50
 *                   completionRate: 73.2
 *                 revenueStats:
 *                   thisMonth: 5678.90
 *                   lastMonth: 4890.50
 *                   commissions: 1234.56
 *                   averageOrderValue: 89.45
 *                 charts:
 *                   userRegistrations:
 *                     - _id: { year: 2025, month: 10, day: 15 }
 *                       count: 25
 *                     - _id: { year: 2025, month: 10, day: 16 }
 *                       count: 30
 *                   taskCreations:
 *                     - _id: { year: 2025, month: 10, day: 15 }
 *                       count: 45
 *                   taskCompletions:
 *                     - _id: { year: 2025, month: 10, day: 15 }
 *                       count: 38
 *                   revenueData:
 *                     - _id: { year: 2025, month: 10, day: 15 }
 *                       totalRevenue: 456.78
 *                       totalPayments: 5678.90
 *                       transactionCount: 15
 *                       avgPayment: 378.59
 *                   monthlyRevenue:
 *                     - _id: { year: 2025, month: 10 }
 *                       revenue: 1234.56
 *                       payments: 15678.90
 *                       count: 42
 *                 topCategories:
 *                   - _id: "cleaning"
 *                     taskCount: 125
 *                     completedCount: 98
 *                     completionRate: 78.4
 *                     avgBudget: 125.50
 *                     totalBudget: 15687.50
 *                   - _id: "moving"
 *                     taskCount: 98
 *                     completedCount: 75
 *                     completionRate: 76.5
 *                     avgBudget: 250.00
 *                     totalBudget: 24500.00
 *                 monthlyTrends:
 *                   - month: "2025-10"
 *                     newUsers: 125
 *                     tasksCreated: 320
 *                     revenue: 5678.90
 *                   - month: "2025-09"
 *                     newUsers: 110
 *                     tasksCreated: 295
 *                     revenue: 4890.50
 *       401:
 *         description: Unauthorized - Invalid or missing admin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Authentication required"
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Admin access required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Failed to fetch analytics data"
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate admin user and receive JWT token
 *     tags:
 *       - Admin - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/AdminUser'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve key metrics and statistics for admin dashboard
 *     tags:
 *       - Admin - Dashboard
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve paginated list of all users with filtering and search
 *     tags:
 *       - Admin - User Management
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [poster, tasker, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/admin/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve paginated list of all tasks with filtering
 *     tags:
 *       - Admin - Task Management
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, assigned, completed, cancelled]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/admin/commission-settings:
 *   get:
 *     summary: Get commission settings
 *     description: Retrieve current commission and fee settings
 *     tags:
 *       - Admin - Commission Settings
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: Commission settings retrieved
 *
 *   put:
 *     summary: Update commission settings
 *     description: Update platform commission rates and fees
 *     tags:
 *       - Admin - Commission Settings
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceFeePercentage:
 *                 type: number
 *                 example: 10.5
 *               minimumFee:
 *                 type: number
 *                 example: 5.00
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */

module.exports = {};
