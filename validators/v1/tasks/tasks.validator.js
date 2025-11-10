const { body, param, query } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const createTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("category").notEmpty().withMessage("Category is required"),
  body("details")
    .trim()
    .notEmpty()
    .withMessage("Details are required")
    .isLength({ max: 2000 })
    .withMessage("Details cannot exceed 2000 characters"),
  body("budget")
    .notEmpty()
    .withMessage("Budget is required")
    .isNumeric()
    .withMessage("Budget must be a number")
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),
  body("currency")
    .optional()
    .isIn(["LKR", "USD", "AUD", "NZD", "EUR", "GBP"])
    .withMessage("Invalid currency code"),
  body("dateType")
    .notEmpty()
    .withMessage("Date type is required")
    .isIn(["Easy", "DoneBy", "DoneOn"])
    .withMessage("Date type must be Easy, DoneBy, or DoneOn"),
  body("date").optional().isISO8601().withMessage("Invalid date format"),
  body("time").optional().isString().withMessage("Time must be a string"),
  body("locationType")
    .optional()
    .isIn(["In-person", "Online"])
    .withMessage("Location type must be In-person or Online"),
  body("location")
    .if(body("locationType").equals("In-person"))
    .notEmpty()
    .withMessage("Location is required for In-person tasks"),
  validateRequest,
];

const getTasks = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("minBudget")
    .optional()
    .isNumeric()
    .withMessage("Min budget must be a number"),
  query("maxBudget")
    .optional()
    .isNumeric()
    .withMessage("Max budget must be a number"),
  query("status")
    .optional()
    .isIn([
      "open",
      "assigned",
      "in-progress",
      "completed",
      "cancelled",
      "expired",
    ])
    .withMessage("Invalid status value"),
  query("category")
    .optional()
    .isString()
    .withMessage("Category must be a string"),
  validateRequest,
];

const getTaskById = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

const updateTask = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),
  body("budget")
    .optional()
    .isNumeric()
    .withMessage("Budget must be a number")
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),
  body("currency")
    .optional()
    .isIn(["LKR", "USD", "AUD", "NZD", "EUR", "GBP"])
    .withMessage("Invalid currency code"),
  body("dateType")
    .optional()
    .isIn(["Easy", "DoneBy", "DoneOn"])
    .withMessage("Date type must be Easy, DoneBy, or DoneOn"),
  body("date").optional().isISO8601().withMessage("Invalid date format"),
  validateRequest,
];

const deleteTask = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

const createOffer = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  body("offerAmount")
    .notEmpty()
    .withMessage("Offer amount is required")
    .isNumeric()
    .withMessage("Offer amount must be a number")
    .isFloat({ min: 0 })
    .withMessage("Offer amount must be a positive number"),
  body("currency")
    .optional()
    .isIn(["LKR", "USD", "AUD", "NZD", "EUR", "GBP"])
    .withMessage("Invalid currency code"),
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 500 })
    .withMessage("Message cannot exceed 500 characters"),
  body("estimatedDuration")
    .optional()
    .isString()
    .withMessage("Estimated duration must be a string"),
  validateRequest,
];

const acceptOffer = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  param("offerId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid offer ID format"),
  validateRequest,
];

const updateTaskStatus = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "open",
      "assigned",
      "in-progress",
      "completed",
      "cancelled",
      "expired",
    ])
    .withMessage("Invalid status value"),
  validateRequest,
];

const completeTask = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

const cancelTask = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

const completePayment = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  body("paymentIntentId")
    .optional()
    .isString()
    .withMessage("Payment intent ID must be a string"),
  validateRequest,
];

const createQuestion = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  body("question")
    .trim()
    .notEmpty()
    .withMessage("Question is required")
    .isLength({ max: 1000 })
    .withMessage("Question cannot exceed 1000 characters"),
  validateRequest,
];

const answerQuestion = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  param("questionId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid question ID format"),
  body("answer")
    .trim()
    .notEmpty()
    .withMessage("Answer is required")
    .isLength({ max: 1000 })
    .withMessage("Answer cannot exceed 1000 characters"),
  validateRequest,
];

const getUserTasks = [
  param("userId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid user ID format"),
  validateRequest,
];

// Search tasks validator
const searchTasks = [
  query("q").optional().isString().withMessage("q must be a string"),
  query("search").optional().isString().withMessage("search must be a string"),
  query("categories")
    .optional()
    .isString()
    .withMessage("categories must be a string or CSV"),
  query("category")
    .optional()
    .isString()
    .withMessage("category must be a string"),
  query("location")
    .optional()
    .isString()
    .withMessage("location must be a string"),
  query("minPrice").optional().isString(),
  query("maxPrice").optional().isString(),
  query("minBudget").optional().isString(),
  query("maxBudget").optional().isString(),
  query("status")
    .optional()
    .isIn([
      "open",
      "assigned",
      "in-progress",
      "completed",
      "cancelled",
      "expired",
    ])
    .withMessage("Invalid status value"),
  query("sort")
    .optional()
    .isIn([
      "recommended",
      "newest",
      "newest_first",
      "oldest",
      "oldest_first",
      "lowest_budget",
      "highest_budget",
    ])
    .withMessage("Invalid sort option"),
  validateRequest,
];

// Similar offer tasks validator
const getSimilarOfferTasks = [
  param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("q").optional().isString().withMessage("Query must be a string"),
  validateRequest,
];

const getMyTasks = [
  query("status")
    .optional()
    .isIn([
      "open",
      "assigned",
      "in-progress",
      "completed",
      "cancelled",
      "expired",
    ])
    .withMessage("Invalid status value"),
  query("role")
    .optional()
    .isIn(["poster", "tasker"])
    .withMessage("Role must be either poster or tasker"),
  query("subSection")
    .optional()
    .isString()
    .withMessage("SubSection must be a string"),
  validateRequest,
];

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createOffer,
  acceptOffer,
  updateTaskStatus,
  completeTask,
  cancelTask,
  completePayment,
  createQuestion,
  answerQuestion,
  getUserTasks,
  getMyTasks,
  searchTasks,
  getSimilarOfferTasks,
};
