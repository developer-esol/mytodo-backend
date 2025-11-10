const mongoose = require("mongoose");
const reviewRepository = require("../../repository/review/review.repository");
const logger = require("../../config/logger");
const emailService = require("../../shared/services/email.service");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const submitReview = async (taskId, reviewerId, rating, reviewText) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const eligibility = await reviewRepository.canUserReview(taskId, reviewerId);

  if (!eligibility.canReview) {
    throw new Error(eligibility.message);
  }

  const review = await reviewRepository.createReview({
    task: taskId,
    reviewer: reviewerId,
    reviewee: eligibility.revieweeId,
    revieweeRole: eligibility.revieweeRole,
    rating: parseInt(rating),
    reviewText: reviewText ? reviewText.trim() : undefined,
  });

  await reviewRepository.updateUserRating(eligibility.revieweeId);
  await reviewRepository.populateReview(review);
  await reviewRepository.populateReviewTask(review);

  return review;
};

const getUserReviews = async (userId, role, page, limit) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await reviewRepository.findUserReviews(
    userId,
    role,
    skip,
    parseInt(limit)
  );
  const totalReviews = await reviewRepository.countUserReviews(userId, role);
  const ratingStats = await reviewRepository.calculateUserRating(
    userId,
    role || null
  );

  return {
    reviews,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / parseInt(limit)),
      totalReviews,
      limit: parseInt(limit),
    },
    ratingStats,
  };
};

const getTaskReviews = async (taskId) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  return await reviewRepository.findTaskReviews(taskId);
};

const getUserRatingStats = async (userId) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const user = await reviewRepository.findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const reviews = await reviewRepository.findReviewsByReviewee(userId);

  const stats = {
    overall: { average: 0, count: 0 },
    asPoster: { average: 0, count: 0 },
    asTasker: { average: 0, count: 0 },
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    stats.overall.average = Number((totalRating / reviews.length).toFixed(1));
    stats.overall.count = reviews.length;

    const posterReviews = reviews.filter((r) => r.reviewerRole === "poster");
    const taskerReviews = reviews.filter((r) => r.reviewerRole === "tasker");

    if (posterReviews.length > 0) {
      const posterTotal = posterReviews.reduce((sum, r) => sum + r.rating, 0);
      stats.asPoster.average = Number(
        (posterTotal / posterReviews.length).toFixed(1)
      );
      stats.asPoster.count = posterReviews.length;
    }

    if (taskerReviews.length > 0) {
      const taskerTotal = taskerReviews.reduce((sum, r) => sum + r.rating, 0);
      stats.asTasker.average = Number(
        (taskerTotal / taskerReviews.length).toFixed(1)
      );
      stats.asTasker.count = taskerReviews.length;
    }

    reviews.forEach((review) => {
      stats.distribution[review.rating]++;
    });
  }

  user.ratingStats = stats;
  user.save().catch((err) =>
    logger.error("Error caching rating stats", {
      service: "review.services",
      userId,
      error: err.message,
      stack: err.stack,
    })
  );

  return stats;
};

const getUserReviewsPaginated = async (userId, page, limit, role, populate) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await reviewRepository.findUserReviewsPaginated(
    userId,
    role,
    skip,
    parseInt(limit),
    populate
  );

  const totalCount = await reviewRepository.countReviewsByReviewee(
    userId,
    role
  );

  return {
    reviews,
    totalCount,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
  };
};

const submitUserReview = async (
  userId,
  reviewerId,
  rating,
  reviewText,
  taskId
) => {
  logger.info("Review submission request received", {
    service: "review.services",
    userId,
    reviewerId: reviewerId.toString(),
    rating,
    reviewTextLength: reviewText?.length,
    taskId,
  });

  if (!rating || rating < 1 || rating > 5) {
    logger.warn("Validation failed: Invalid rating", {
      service: "review.services",
      rating,
      userId,
      reviewerId: reviewerId.toString(),
    });
    throw new Error("Rating must be between 1 and 5");
  }

  if (!reviewText || reviewText.trim().length < 10) {
    logger.warn("Validation failed: Review text too short", {
      service: "review.services",
      reviewTextLength: reviewText?.length,
      trimmedLength: reviewText?.trim().length,
      userId,
      reviewerId: reviewerId.toString(),
    });
    throw new Error("Review text must be at least 10 characters");
  }

  if (reviewText.length > 500) {
    throw new Error("Review text must not exceed 500 characters");
  }

  if (reviewerId.toString() === userId) {
    throw new Error("You cannot review yourself");
  }

  const existingReview = await reviewRepository.findExistingReview(
    reviewerId,
    userId,
    taskId
  );

  if (existingReview) {
    throw new Error(
      taskId
        ? "You have already reviewed this user for this task"
        : "You have already submitted a general review for this user"
    );
  }

  const reviewer = await reviewRepository.findUserById(reviewerId);

  const review = await reviewRepository.createReview({
    revieweeId: userId,
    reviewerId: reviewerId,
    rating: parseInt(rating),
    reviewText: reviewText.trim(),
    taskId: taskId || null,
    reviewerRole: reviewer?.role || "user",
  });

  logger.info("Review created successfully", {
    service: "review.services",
    reviewId: review._id,
    userId,
    reviewerId: reviewerId.toString(),
    rating,
    taskId,
  });

  return review;
};

const getDetailedRatingStats = async (userId) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const overallStats = await reviewRepository.calculateUserRating(userId);
  const posterStats = await reviewRepository.calculateUserRating(
    userId,
    "poster"
  );
  const taskerStats = await reviewRepository.calculateUserRating(
    userId,
    "tasker"
  );
  const recentReviews = await reviewRepository.findRecentReviews(userId, 5);

  return {
    overall: overallStats,
    asPoster: posterStats,
    asTasker: taskerStats,
    recentReviews,
  };
};

const checkCanReview = async (taskId, userId) => {
  if (!isValidObjectId(taskId)) {
    throw new Error("Invalid task ID");
  }

  return await reviewRepository.canUserReview(taskId, userId);
};

const updateReview = async (reviewId, userId, rating, reviewText) => {
  if (!isValidObjectId(reviewId)) {
    throw new Error("Invalid review ID");
  }

  const Review = require("../../models/review/Review");
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.reviewer.toString() !== userId.toString()) {
    throw new Error("You can only update your own reviews");
  }

  if (rating) {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    review.rating = parseInt(rating);
  }

  if (reviewText !== undefined) {
    review.reviewText = reviewText.trim();
  }

  await review.save();
  await reviewRepository.updateUserRating(review.reviewee);
  await reviewRepository.populateReview(review);
  await reviewRepository.populateReviewTask(review);

  return review;
};

const deleteReview = async (reviewId, userId) => {
  if (!isValidObjectId(reviewId)) {
    throw new Error("Invalid review ID");
  }

  const Review = require("../../models/review/Review");
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.reviewer.toString() !== userId.toString()) {
    throw new Error("You can only delete your own reviews");
  }

  const revieweeId = review.reviewee;

  await Review.findByIdAndDelete(reviewId);
  await reviewRepository.updateUserRating(revieweeId);

  return true;
};

const respondToReview = async (reviewId, userId, responseText) => {
  if (!isValidObjectId(reviewId)) {
    throw new Error("Invalid review ID");
  }

  if (!responseText || responseText.trim().length === 0) {
    throw new Error("Response text is required");
  }

  const Review = require("../../models/review/Review");
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.reviewee.toString() !== userId.toString()) {
    throw new Error("You can only respond to reviews about you");
  }

  review.response = {
    text: responseText.trim(),
    respondedAt: new Date(),
  };

  await review.save();
  await reviewRepository.populateReview(review);
  await reviewRepository.populateReviewTask(review);

  return review;
};

const canReviewUser = async (userId, reviewerId) => {
  if (reviewerId.toString() === userId) {
    return {
      canReview: false,
      reason: "You cannot review yourself",
    };
  }

  const user = await reviewRepository.findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const Review = require("../../models/review/Review");
  const existingReview = await Review.findOne({
    reviewerId,
    revieweeId: userId,
    taskId: { $exists: false },
  });

  if (existingReview) {
    return {
      canReview: false,
      reason: "You have already reviewed this user",
    };
  }

  return {
    canReview: true,
    reason: "You can leave a review",
  };
};

const requestReview = async (userId, method, recipient, message) => {
  const user = await reviewRepository.findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const reviewLink = `${process.env.FRONTEND_URL}/review/${userId}`;

  const fullMessage =
    message ||
    `Hi! ${user.firstName} ${user.lastName} would appreciate your feedback. Please leave a review here: ${reviewLink}`;

  if (method === "email") {
    await emailService.sendReviewRequestEmail({
      to: recipient,
      subject: `Review Request from ${user.firstName} ${user.lastName}`,
      text: fullMessage,
      html: `
        <h2>Review Request</h2>
        <p>${fullMessage.replace(
          reviewLink,
          `<a href="${reviewLink}">${reviewLink}</a>`
        )}</p>
      `,
      context: {
        service: "review.services",
        function: "requestReview",
        userId,
      },
    });
  } else if (method === "sms") {
    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: fullMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipient,
    });
  } else {
    throw new Error('Invalid method. Use "email" or "sms"');
  }

  return true;
};

module.exports = {
  submitReview,
  getUserReviews,
  getTaskReviews,
  getUserRatingStats,
  getUserReviewsPaginated,
  submitUserReview,
  getDetailedRatingStats,
  checkCanReview,
  updateReview,
  deleteReview,
  respondToReview,
  canReviewUser,
  requestReview,
};
