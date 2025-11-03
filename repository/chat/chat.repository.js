const Chat = require("../../models/chat/Chat");
const Task = require("../../models/task/Task");
const Offer = require("../../models/task/Offer");

const findChatsByUserId = async (userId) => {
  return await Chat.find({
    $or: [{ posterId: userId }, { taskerId: userId }],
  })
    .populate("posterId", "firstName lastName avatar rating")
    .populate("taskerId", "firstName lastName avatar rating")
    .sort({ createdAt: -1 })
    .lean();
};

const findTasksByIds = async (taskIds) => {
  return await Task.find({
    _id: { $in: taskIds },
  }).lean();
};

const findOfferById = async (offerId) => {
  return await Offer.findById(offerId);
};

const findTaskById = async (taskId) => {
  return await Task.findById(taskId);
};

const updateChatStatus = async (taskId, posterId, taskerId, newStatus) => {
  return await Chat.findOneAndUpdate(
    {
      taskId: taskId,
      $or: [
        { posterId: posterId, taskerId: taskerId },
        { posterId: taskerId, taskerId: posterId },
      ],
    },
    {
      $set: {
        chatStatus: newStatus,
        status: "active",
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: false,
    }
  );
};

module.exports = {
  findChatsByUserId,
  findTasksByIds,
  findOfferById,
  findTaskById,
  updateChatStatus,
};
