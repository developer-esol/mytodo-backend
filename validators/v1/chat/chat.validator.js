const { body, validationResult } = require("express-validator");

const validateRequest = require("../../../middleware/validation/validationResult");

exports.createOrUpdateChat = [
  body("taskId")
    .notEmpty()
    .withMessage("Task ID is required.")
    .isMongoId()
    .withMessage("Invalid Task ID format. Must be a valid MongoDB ID."),

  body("offerId")
    .notEmpty()
    .withMessage("Offer ID is required.")
    .isMongoId()
    .withMessage("Invalid Offer ID format. Must be a valid MongoDB ID."),

  body("userId")
    .notEmpty()
    .withMessage("User ID is required.")
    .isMongoId()
    .withMessage("Invalid User ID format. Must be a valid MongoDB ID."),

  body("action")
    .notEmpty()
    .withMessage("Action is required.")
    .isIn(["accept_offer"])
    .withMessage('Invalid action value. Must be "accept_offer".'),

  body("chatStatus")
    .notEmpty()
    .withMessage("Chat Status is required.")
    .isIn(["accept"])
    .withMessage('Invalid chatStatus value. Must be "accept".'),

  validateRequest,
];
