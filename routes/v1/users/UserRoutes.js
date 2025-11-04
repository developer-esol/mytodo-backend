const express = require("express");
const multer = require("multer");
const { protect } = require("../../../middleware/authMiddleware");
const validators = require("../../../validators/v1/users/userRoutes.validator");
const userController = require("../../../controllers/users/users.controller");

const router = express.Router();

/**
 * Configure multer for avatar upload (in-memory storage)
 */
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit to prevent large base64 strings
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ===========================
// Public Routes
// ===========================

/**
 * @route   POST /api/v1/users/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/signup",
  validators.signup,
  userController.signup.bind(userController)
);

/**
 * @route   POST /api/v1/users/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post(
  "/login",
  validators.login,
  userController.login.bind(userController)
);

/**
 * @route   GET /api/v1/users/firebase-token
 * @desc    Generate Firebase custom token from JWT
 * @access  Public (requires JWT in header)
 */
router.get(
  "/firebase-token",
  userController.getFirebaseToken.bind(userController)
);

// ===========================
// Protected Routes
// ===========================

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/profile", protect, userController.getProfile.bind(userController));

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  "/profile",
  protect,
  validators.updateProfile,
  userController.updateProfile.bind(userController)
);

/**
 * @route   POST /api/v1/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  "/avatar",
  protect,
  avatarUpload.single("avatar"),
  userController.uploadAvatar.bind(userController)
);

module.exports = router;
