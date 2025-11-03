const { body, param } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const objectId = /^[0-9a-fA-F]{24}$/;

exports.createPaymentIntent = [
  body("taskId")
    .exists()
    .withMessage("taskId is required")
    .bail()
    .isString()
    .withMessage("taskId must be a string")
    .bail()
    .matches(objectId)
    .withMessage("Invalid taskId format (must be a 24-character hex string)"),
  body("offerId")
    .exists()
    .withMessage("offerId is required")
    .bail()
    .isString()
    .withMessage("offerId must be a string")
    .bail()
    .matches(objectId)
    .withMessage("Invalid offerId format (must be a 24-character hex string)"),
  validateRequest,
];

exports.verifyPayment = [
  body("paymentIntentId")
    .exists()
    .withMessage("paymentIntentId is required")
    .bail()
    .isString()
    .withMessage("paymentIntentId must be a string")
    .bail()
    .matches(/^pi_[a-zA-Z0-9_]+$/)
    .withMessage(
      "Invalid paymentIntentId format (must be a valid Stripe payment intent ID)"
    ),
  body("taskId")
    .exists()
    .withMessage("taskId is required")
    .bail()
    .isString()
    .withMessage("taskId must be a string")
    .bail()
    .matches(objectId)
    .withMessage("Invalid taskId format (must be a 24-character hex string)"),
  validateRequest,
];

exports.confirmTaskCompletion = [
  param("taskId")
    .exists()
    .withMessage("taskId is required in the URL parameters")
    .bail()
    .isString()
    .withMessage("taskId must be a string")
    .bail()
    .matches(objectId)
    .withMessage("Invalid taskId format (must be a 24-character hex string)"),
  validateRequest,
];
