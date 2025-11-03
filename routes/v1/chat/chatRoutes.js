const express = require("express");
const router = express.Router();
const { protect } = require("../../../middleware/authMiddleware");
const controller = require("../../../controllers/chat/chat.controller");
const validators = require("../../../validators/v1/chat/chat.validator");

// Get all chats for authenticated user
router.get("/", protect, controller.getChats);

// Create or update chat when offer is accepted
router.post(
  "/create-or-update",
  protect,
  ...validators.createOrUpdateChat,
  controller.createOrUpdateChat
);

module.exports = router;
