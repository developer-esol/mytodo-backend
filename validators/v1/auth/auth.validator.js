const { body } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const hex64 = /^[a-fA-F0-9]{64}$/;

exports.googleAuth = [
  body("credential")
    .exists()
    .withMessage("Google credential is required")
    .bail()
    .isString()
    .withMessage("Google credential must be a string")
    .trim(),
  validateRequest,
];

exports.forgotPassword = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address"),
  // Removed .normalizeEmail() to preserve dots in email addresses
  validateRequest,
];

exports.resendForgotPassword = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address"),
  // Removed .normalizeEmail() to preserve dots in email addresses
  validateRequest,
];

exports.resetPassword = [
  body("token")
    .exists()
    .withMessage("Token is required")
    .bail()
    .isString()
    .withMessage("Token must be a string")
    .bail()
    .withMessage("Invalid token format"),
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address"),
  // Removed .normalizeEmail() to preserve dots in email addresses
  body("newPassword")
    .exists()
    .withMessage("New password is required")
    .isString()
    .withMessage("New password must be a string")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  validateRequest,
];

exports.validateResetToken = [
  body("token")
    .exists()
    .withMessage("Token is required")
    .bail()
    .isString()
    .withMessage("Token must be a string")
    .bail()
    .withMessage("Invalid token format"),
  validateRequest,
];
