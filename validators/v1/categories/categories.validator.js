const { body, param, query } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

exports.createCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 }),
  body("description").optional().isString(),
  body("icon").optional().isString(),
  body("order").optional().isInt({ min: 0 }),
  validateRequest,
];

exports.updateCategory = [
  param("id").isMongoId().withMessage("Invalid category id"),
  body("name").optional().trim().isLength({ max: 100 }),
  body("description").optional().isString(),
  body("icon").optional().isString(),
  body("order").optional().isInt({ min: 0 }),
  validateRequest,
];

exports.getByLocation = [
  query("type")
    .optional()
    .isIn(["In-person", "Online"])
    .withMessage("Invalid type"),
  validateRequest,
];

exports.deleteCategory = [
  param("id").isMongoId().withMessage("Invalid category id"),
  validateRequest,
];
