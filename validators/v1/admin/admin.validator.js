const { body, param, query } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

// Admin Authentication
exports.adminLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

// User Management
exports.getUsers = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("role")
    .optional()
    .isIn(["user", "poster", "tasker", "admin", "superadmin", "all", ""])
    .withMessage("Invalid role value"),
  query("status")
    .optional()
    .isIn(["active", "inactive", "suspended", "all", ""])
    .withMessage("Invalid status value"),
  validateRequest,
];

exports.getUserById = [
  param("userId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid user ID format"),
  validateRequest,
];

// Task Management
exports.getTasks = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("status")
    .optional()
    .isIn(["open", "assigned", "in-progress", "completed", "cancelled", ""])
    .withMessage("Invalid status value"),
  query("category")
    .optional()
    .isString()
    .withMessage("Category must be a string"),
  validateRequest,
];

exports.getTaskById = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

exports.updateTaskStatus = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["open", "assigned", "in-progress", "completed", "cancelled"])
    .withMessage("Invalid status value"),
  validateRequest,
];

// Analytics
exports.getAnalytics = [
  query("timeRange")
    .optional()
    .isIn(["7d", "30d", "90d", "1y"])
    .withMessage("Time range must be 7d, 30d, 90d, or 1y"),
  validateRequest,
];

// Commission Settings
exports.updateCommissionSettings = [
  body("commissionRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission rate must be between 0 and 100"),
  body("minimumFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum fee must be a positive number"),
  body("maximumFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum fee must be a positive number"),
  body("currencyRates")
    .optional()
    .isObject()
    .withMessage("Currency rates must be an object"),
  validateRequest,
];
