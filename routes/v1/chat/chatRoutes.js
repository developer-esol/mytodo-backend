const express = require("express");
const router = express.Router();
const { protect } = require("../../../middleware/authMiddleware");
const { uploadFiles } = require("../../../middleware/uploadMiddleware");
const chatController = require("../../../controllers/chatController");
const validators = require("../../../validators/v1/chat/chat.validator");
// Route handlers

// Add search route before other routes - now with authentication
router.get("/", protect, chatController.getChats);

// Create or update chat endpoint
router.post(
  "/create-or-update",
  protect,
  validators.createOrUpdateChat,
  chatController.createOrUpdateChat
);

module.exports = router;
