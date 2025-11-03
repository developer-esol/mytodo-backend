const { body, param, query } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const getUserRatingStats = [
  param("userId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid user ID format"),
  validateRequest,
];

const getUserReviews = [
  param("userId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid user ID format"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("role")
    .optional()
    .isIn(["poster", "tasker"])
    .withMessage("Role must be either poster or tasker"),
  query("populate")
    .optional()
    .isIn(["reviewer", "task"])
    .withMessage("Populate must be either reviewer or task"),
  validateRequest,
];

const submitUserReview = [
  param("userId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid user ID format"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("reviewText")
    .trim()
    .notEmpty()
    .withMessage("Review text is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Review text must be between 10 and 500 characters"),
  body("taskId")
    .optional()
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

const canReviewUser = [
  param("userId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid user ID format"),
  validateRequest,
];

const requestReview = [
  body("method")
    .notEmpty()
    .withMessage("Method is required")
    .isIn(["email", "sms"])
    .withMessage("Method must be either email or sms"),
  body("recipient")
    .notEmpty()
    .withMessage("Recipient is required")
    .custom((value, { req }) => {
      if (req.body.method === "email") {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Invalid email address");
        }
      } else if (req.body.method === "sms") {
        // Phone number validation (basic)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(value)) {
          throw new Error("Invalid phone number format");
        }
      }
      return true;
    }),
  body("message")
    .optional()
    .isString()
    .withMessage("Message must be a string")
    .isLength({ max: 500 })
    .withMessage("Message cannot exceed 500 characters"),
  validateRequest,
];

module.exports = {
  getUserRatingStats,
  getUserReviews,
  submitUserReview,
  canReviewUser,
  requestReview,
};
