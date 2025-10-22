const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const Task = require("../models/Task");
const Offer = require("../models/Offer");
const { formatUserObject } = require('../utils/userUtils');

exports.getChats = async (req, res) => {
  try {
    // Get userId from authenticated user instead of query parameter
    const userId = req.user._id;
    console.log("ChatApp getChats called for userId:", userId);

    // Validate userId exists and is valid
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId provided:", userId);
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // Find all chats where the user is involved with lean() for better performance
    console.log("Searching for chats with userId:", userId);
    const chats = await Chat.find({
      $or: [{posterId: userId}, {taskerId: userId}],
    })
      .populate("posterId", "firstName lastName avatar rating")
      .populate("taskerId", "firstName lastName avatar rating")
      .sort({createdAt: -1})
      .lean(); // Convert to plain JS objects for better performance
    
    console.log("Found chats count:", chats.length);

    // Early return if no chats found
    if (!chats.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No chats found for this user",
      });
    }

    // Extract valid task IDs and remove duplicates
    const taskIds = chats
      .map((chat) => chat.taskId)
      .filter((taskId) => taskId && mongoose.Types.ObjectId.isValid(taskId));

    const uniqueTaskIds = [...new Set(taskIds)];

    // Fetch related tasks in a single query
    const tasks = await Task.find({
      _id: {$in: uniqueTaskIds},
    }).lean();

    // Create a task map for faster lookup
    const taskMap = tasks.reduce((acc, task) => {
      acc[task._id.toString()] = task;
      return acc;
    }, {});

    // Combine chat and task information
    const result = chats.map((chat) => {
      const task = chat.taskId ? taskMap[chat.taskId.toString()] : null;

      // Determine the other participant (not the current user)
      const otherParticipant =
        chat.posterId && chat.posterId._id && chat.posterId._id.toString() === userId.toString() 
          ? chat.taskerId 
          : chat.posterId;

      return {
        chat: {
          ...chat,
          posterId: formatUserObject(chat.posterId),
          taskerId: formatUserObject(chat.taskerId),
          otherParticipant: formatUserObject(otherParticipant),
        },
        task: task || null,
        lastMessage: chat.lastMessage || null,
        unreadCount: chat.unreadCount || 0,
      };
    });
    
    console.log("Formatted result count:", result.length);

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching chats and tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching chats and tasks",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create or update chat when offer is accepted
exports.createOrUpdateChat = async (req, res) => {
  try {
    const { taskId, offerId, userId, action, chatStatus } = req.body;

    // Validate required fields
    if (!taskId || !offerId || !userId) {
      return res.status(400).json({
        success: false,
        message: "TaskId, offerId, and userId are required",
      });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(taskId) || 
        !mongoose.Types.ObjectId.isValid(offerId) ||
        !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid taskId, offerId, or userId",
      });
    }

    // Find the offer to get the task taker ID
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // Find the task to get the poster ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Update the chat status when offer is accepted
    if (action === "accept_offer" && chatStatus === "accept") {
      const updatedChat = await Chat.findOneAndUpdate(
        {
          taskId: taskId,
          $or: [
            { posterId: task.createdBy, taskerId: offer.taskTakerId },
            { posterId: offer.taskTakerId, taskerId: task.createdBy }
          ]
        },
        {
          $set: {
            chatStatus: "accept",
            status: "active",
            updatedAt: new Date()
          }
        },
        {
          new: true,
          upsert: false // Don't create if doesn't exist
        }
      );

      if (!updatedChat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found for this task and offer",
        });
      }

      console.log("Chat status updated to 'accept' for taskId:", taskId);

      res.status(200).json({
        success: true,
        data: updatedChat,
        message: "Chat status updated to accept successfully"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action or chatStatus",
      });
    }

  } catch (error) {
    console.error("Error updating chat status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating chat status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
