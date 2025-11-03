const { body } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

exports.calculateServiceFee = [
  body("amount")
    .exists()
    .withMessage("amount is required")
    .bail()
    .isNumeric()
    .withMessage("amount must be a number")
    .bail()
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("amount must be greater than 0");
      }
      return true;
    }),
  body("currency")
    .optional()
    .isString()
    .withMessage("currency must be a string")
    .bail()
    .isLength({ min: 3, max: 3 })
    .withMessage("currency must be a 3-letter currency code")
    .toUpperCase(),
  validateRequest,
];

exports.updateServiceFeeConfig = [
  body("BASE_PERCENTAGE")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage(
      "BASE_PERCENTAGE must be a decimal between 0 and 1 (e.g., 0.10 for 10%)"
    ),
  body("MIN_FEE_USD")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("MIN_FEE_USD must be a positive number"),
  body("MAX_FEE_USD")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("MAX_FEE_USD must be a positive number")
    .bail()
    .custom((value, { req }) => {
      if (req.body.MIN_FEE_USD && value < req.body.MIN_FEE_USD) {
        throw new Error(
          "MAX_FEE_USD must be greater than or equal to MIN_FEE_USD"
        );
      }
      return true;
    }),
  validateRequest,
];
