const { param, query } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const objectId = /^[0-9a-fA-F]{24}$/;

exports.getMyReceipts = [
  query("receiptType")
    .optional()
    .isString()
    .withMessage("receiptType must be a string")
    .bail()
    .isIn(["payment", "earnings"])
    .withMessage("receiptType must be either 'payment' or 'earnings'"),
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

exports.getTaskReceipts = [
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

exports.getReceiptById = [
  param("receiptId")
    .exists()
    .withMessage("receiptId is required in the URL parameters")
    .bail()
    .isString()
    .withMessage("receiptId must be a string")
    .bail()
    .matches(objectId)
    .withMessage(
      "Invalid receiptId format (must be a 24-character hex string)"
    ),
  validateRequest,
];

exports.downloadReceiptPDF = [
  param("receiptId")
    .exists()
    .withMessage("receiptId is required in the URL parameters")
    .bail()
    .isString()
    .withMessage("receiptId must be a string")
    .bail()
    .matches(objectId)
    .withMessage(
      "Invalid receiptId format (must be a 24-character hex string)"
    ),
  validateRequest,
];
