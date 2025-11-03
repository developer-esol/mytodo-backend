const { body, param } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const submitReview = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("reviewText")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Review text cannot exceed 1000 characters"),
  validateRequest,
];

const getTaskReviews = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

const checkCanReview = [
  param("taskId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid task ID format"),
  validateRequest,
];

const updateReview = [
  param("reviewId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid review ID format"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("reviewText")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Review text cannot exceed 1000 characters"),
  validateRequest,
];

const deleteReview = [
  param("reviewId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid review ID format"),
  validateRequest,
];

const respondToReview = [
  param("reviewId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid review ID format"),
  body("responseText")
    .isLength({ min: 1, max: 500 })
    .withMessage("Response text is required and cannot exceed 500 characters"),
  validateRequest,
];

module.exports = {
  submitReview,
  getTaskReviews,
  checkCanReview,
  updateReview,
  deleteReview,
  respondToReview,
};
