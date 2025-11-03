const Review = require("../../models/review/Review");
const Task = require("../../models/task/Task");
const User = require("../../models/user/User");

const createReview = async (reviewData) => {
  const review = new Review(reviewData);
  return await review.save();
};

const canUserReview = async (taskId, reviewerId) => {
  return await Review.canUserReview(taskId, reviewerId);
};

const updateUserRating = async (revieweeId) => {
  return await Review.updateUserRating(revieweeId);
};

const populateReview = async (review) => {
  return await review.populate(
    "reviewer reviewee",
    "firstName lastName avatar"
  );
};

const populateReviewTask = async (review) => {
  return await review.populate("task", "title");
};

const findUserReviews = async (userId, role, skip, limit) => {
  const query = {
    reviewee: userId,
    isVisible: true,
  };

  if (role && ["poster", "tasker"].includes(role)) {
    query.revieweeRole = role;
  }

  return await Review.find(query)
    .populate("reviewer", "firstName lastName avatar")
    .populate("task", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countUserReviews = async (userId, role) => {
  const query = {
    reviewee: userId,
    isVisible: true,
  };

  if (role && ["poster", "tasker"].includes(role)) {
    query.revieweeRole = role;
  }

  return await Review.countDocuments(query);
};

const calculateUserRating = async (userId, role) => {
  return await Review.calculateUserRating(userId, role);
};

const findTaskReviews = async (taskId) => {
  return await Review.find({
    task: taskId,
    isVisible: true,
  })
    .populate("reviewer reviewee", "firstName lastName avatar")
    .sort({ createdAt: -1 });
};

const findRecentReviews = async (userId, limit = 5) => {
  return await Review.find({
    reviewee: userId,
    isVisible: true,
  })
    .populate("reviewer", "firstName lastName avatar")
    .populate("task", "title")
    .sort({ createdAt: -1 })
    .limit(limit);
};

const findUserById = async (userId) => {
  return await User.findById(userId);
};

const findReviewsByReviewee = async (userId, role = null) => {
  const query = { revieweeId: userId };
  if (role && ["poster", "tasker"].includes(role)) {
    query.reviewerRole = role;
  }
  return await Review.find(query);
};

const findUserReviewsPaginated = async (
  userId,
  role,
  skip,
  limit,
  populate
) => {
  const query = { revieweeId: userId };
  if (role && ["poster", "tasker"].includes(role)) {
    query.reviewerRole = role;
  }

  let reviewQuery = Review.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (populate === "reviewer") {
    reviewQuery = reviewQuery.populate(
      "reviewerId",
      "firstName lastName avatar"
    );
  }

  if (populate === "task") {
    reviewQuery = reviewQuery.populate("taskId", "title");
  }

  return await reviewQuery;
};

const countReviewsByReviewee = async (userId, role) => {
  const query = { revieweeId: userId };
  if (role && ["poster", "tasker"].includes(role)) {
    query.reviewerRole = role;
  }
  return await Review.countDocuments(query);
};

const findExistingReview = async (reviewerId, revieweeId, taskId) => {
  const query = {
    reviewerId,
    revieweeId,
  };

  if (taskId) {
    query.taskId = taskId;
  } else {
    query.$or = [{ taskId: null }, { taskId: { $exists: false } }];
  }

  return await Review.findOne(query);
};

module.exports = {
  createReview,
  canUserReview,
  updateUserRating,
  populateReview,
  populateReviewTask,
  findUserReviews,
  countUserReviews,
  calculateUserRating,
  findTaskReviews,
  findRecentReviews,
  findUserById,
  findReviewsByReviewee,
  findUserReviewsPaginated,
  countReviewsByReviewee,
  findExistingReview,
};
