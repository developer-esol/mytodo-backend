const { body } = require("express-validator");
const validateRequest = require("../../../middleware/validation/validationResult");

const signup = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number format"),
  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Invalid date format"),
  body("location").notEmpty().withMessage("Location is required"),
  body("location.country")
    .notEmpty()
    .withMessage("Country is required")
    .isIn(["AU", "NZ", "LK"])
    .withMessage("Country must be AU, NZ, or LK"),
  body("location.region").trim().notEmpty().withMessage("Region is required"),
  body("location.city").trim().notEmpty().withMessage("City is required"),
  validateRequest,
];

const login = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

const updateProfile = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number format"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
  body("location.country")
    .optional()
    .isIn(["AU", "NZ", "LK"])
    .withMessage("Country must be AU, NZ, or LK"),
  body("location.region")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Region cannot be empty if provided"),
  body("location.city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty if provided"),
  body("skills")
    .optional()
    .custom((value) => {
      // Accept both array (legacy) and object (structured) formats
      if (Array.isArray(value)) {
        return true;
      }
      if (typeof value === "object" && value !== null) {
        // Validate structured format
        const validKeys = [
          "goodAt",
          "transport",
          "languages",
          "qualifications",
          "experience",
        ];
        const keys = Object.keys(value);
        const invalidKeys = keys.filter((key) => !validKeys.includes(key));
        if (invalidKeys.length > 0) {
          throw new Error(
            `Invalid skill categories: ${invalidKeys.join(", ")}`
          );
        }
        // Validate each field is an array
        for (const key of keys) {
          if (!Array.isArray(value[key])) {
            throw new Error(`Skills.${key} must be an array`);
          }
        }
        return true;
      }
      throw new Error("Skills must be an array or object");
    }),
  validateRequest,
];

module.exports = {
  signup,
  login,
  updateProfile,
};
