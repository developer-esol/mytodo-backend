const chatService = require("../../servicesN/chat/chat.services");
const logger = require("../../config/logger");

exports.getChats = async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user._id;
    logger.debug("ChatApp getChats called", {
      controller: "chat.controller",
      userId,
    });

    const chats = await chatService.getUserChatsWithTasks(userId);

    logger.info("Chats fetched successfully", {
      controller: "chat.controller",
      userId,
      count: chats.length,
    });

    // Return empty array if no chats found
    if (!chats.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No chats found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    logger.error("Error fetching chats and tasks:", {
      controller: "chat.controller",
      error: error.message,
      stack: error.stack,
    });

    const statusCode =
      error.message === "Valid user ID is required" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Server error while fetching chats and tasks",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.createOrUpdateChat = async (req, res) => {
  try {
    const updateData = req.body;

    const updatedChat = await chatService.acceptOfferAndUpdateChat(updateData);

    logger.info("Chat updated successfully", {
      controller: "chat.controller",
      chatId: updatedChat._id,
      status: updateData.status,
    });

    return res.status(200).json({
      success: true,
      data: updatedChat,
      message: "Chat status updated to accept successfully",
    });
  } catch (error) {
    logger.error("Error updating chat status:", error);

    let statusCode = 500;
    if (
      error.message.includes("required") ||
      error.message.includes("Invalid")
    ) {
      statusCode = 400;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Server error while updating chat status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
