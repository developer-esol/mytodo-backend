// validators/v1/auth/twofactor.validator.js
const { body } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const otp6 = /^[0-9]{6}$/;
const phoneE164 = /^\+?[1-9]\d{1,14}$/;

exports.otpVerification = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("otp")
    .exists()
    .withMessage("OTP is required")
    .bail()
    .isString()
    .withMessage("OTP must be a string")
    .bail()
    .matches(otp6)
    .withMessage("OTP must be a 6-digit numeric code"),

  validateRequest,
];

exports.smsVerification = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("otp")
    .exists()
    .withMessage("SMS OTP is required")
    .bail()
    .isString()
    .withMessage("SMS OTP must be a string")
    .bail()
    .matches(otp6)
    .withMessage("SMS OTP must be a 6-digit numeric code"),

  validateRequest,
];

exports.resendOtp = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .bail()
    .matches(phoneE164)
    .withMessage("Invalid phone number; use E.164 format like +15551234567"),

  validateRequest,
];

exports.sendEmail = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  validateRequest,
];

exports.checkAvailability = [
  // Ensure at least one of email or phone is provided
  body().custom((_, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error("Provide email or phone to check availability");
    }
    return true;
  }),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .bail()
    .matches(phoneE164)
    .withMessage("Invalid phone number; use E.164 format like +15551234567"),

  validateRequest,
];
