const { body, param, query } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const objectId = /^[0-9a-fA-F]{24}$/;
const allowedPriorities = ["low", "normal", "high", "urgent"];

exports.webhookNotification = [
  body("userId")
    .exists()
    .withMessage("userId is required")
    .bail()
    .isString()
    .withMessage("userId must be a string")
    .notEmpty()
    .withMessage("userId cannot be empty")
    .trim(),
  body("type")
    .exists()
    .withMessage("type is required")
    .bail()
    .isString()
    .withMessage("type must be a string")
    .notEmpty()
    .withMessage("type cannot be empty")
    .trim(),
  body("title")
    .exists()
    .withMessage("title is required")
    .bail()
    .isString()
    .withMessage("title must be a string")
    .notEmpty()
    .withMessage("title cannot be empty")
    .trim(),
  body("message")
    .exists()
    .withMessage("message is required")
    .bail()
    .isString()
    .withMessage("message must be a string")
    .notEmpty()
    .withMessage("message cannot be empty")
    .trim(),
  body("priority")
    .optional()
    .isString()
    .withMessage("Priority must be a string")
    .toUpperCase()
    .isIn(allowedPriorities.map((p) => p.toUpperCase()))
    .withMessage(`Priority must be one of: ${allowedPriorities.join(", ")}`),
  body("actionUrl")
    .optional()
    .isURL()
    .withMessage("actionUrl must be a valid URL"),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("metadata must be a JSON object"),
  validateRequest,
];

exports.getNotifications = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be an integer greater than 0")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }) // Enforce a reasonable max limit
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),
  query("unreadOnly")
    .optional()
    .isBoolean()
    .withMessage("unreadOnly must be a boolean value ('true' or 'false')"),
  query("type")
    .optional()
    .isString()
    .withMessage("Type filter must be a string")
    .trim(),
  validateRequest,
];

exports.getNotificationsByType = [
  param("type")
    .exists()
    .withMessage("Notification type is required in the URL parameters")
    .bail()
    .isString()
    .withMessage("Notification type must be a string")
    .notEmpty()
    .withMessage("Notification type cannot be empty")
    .trim(),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be an integer greater than 0")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),
  validateRequest,
];

exports.validateNotificationId = [
  param("notificationId")
    .exists()
    .withMessage("Notification ID is required in the URL parameters")
    .bail()
    .isString()
    .withMessage("Notification ID must be a string")
    .bail()
    .matches(objectId)
    .withMessage(
      "Invalid Notification ID format (must be a 24-character hex string)"
    ),
  validateRequest,
];

exports.testNotification = [
  body("type")
    .optional()
    .isString()
    .withMessage("Type must be a string")
    .trim(),
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .trim(),
  body("message")
    .optional()
    .isString()
    .withMessage("Message must be a string")
    .trim(),
  validateRequest,
];

exports.testSoundNotification = [
  body("type")
    .optional()
    .isString()
    .withMessage("Type must be a string")
    .trim(),
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .trim(),
  body("message")
    .optional()
    .isString()
    .withMessage("Message must be a string")
    .trim(),
  body("priority")
    .optional()
    .isString()
    .withMessage("Priority must be a string")
    .toUpperCase()
    .isIn(allowedPriorities.map((p) => p.toUpperCase()))
    .withMessage(`Priority must be one of: ${allowedPriorities.join(", ")}`),
  validateRequest,
];
