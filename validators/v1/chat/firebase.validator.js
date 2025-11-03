const { body, param, query } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const validateTaskId = [
  param("taskId")
    .exists()
    .withMessage("Task ID is required in the URL parameters.")
    .bail()
    .isMongoId()
    .withMessage("Invalid Task ID format."),
];

const validatePathId = [...validateTaskId, validateRequest];

const validateIndividualChatMessage = [
  ...validateTaskId,
  body("text")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Message content (text) is required and cannot be empty."),
  body("senderId")
    .exists()
    .withMessage("Sender ID is required in the request body.")
    .bail()
    .isMongoId()
    .withMessage("Invalid Sender ID format."),
  body("senderName")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Sender name is required."),
  validateRequest,
];

const validateGetGroupMessages = [
  ...validateTaskId,
  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 }) // Added reasonable max limit
    .withMessage("Limit must be an integer between 1 and 200.")
    .toInt(), // Convert to integer for route handler
  validateRequest,
];

/**
 * 4. Validation for POST /group-chats/:taskId/messages (Group Chat)
 */
const validateGroupChatMessage = [
  ...validateTaskId,
  body("text")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Message content (text) is required and cannot be empty."),
  body("messageType")
    .optional()
    .isIn(["text", "image", "file", "offer"]) // Common message types
    .withMessage("Invalid message type specified."),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be a valid JSON object."),
  validateRequest,
];

const validateSystemMessage = [
  ...validateTaskId,
  body("text")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("System message content (text) is required."),
  body("messageType")
    .optional()
    .isString()
    .withMessage("Message type must be a string."), // Allowing any string as per route logic
  body("triggerUserId")
    .optional()
    .bail()
    .isMongoId()
    .withMessage("Invalid Trigger User ID format."),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be a valid JSON object."),
  validateRequest,
];

module.exports = {
  validatePathId,
  validateIndividualChatMessage,
  validateGetGroupMessages,
  validateGroupChatMessage,
  validateSystemMessage,
};
