const reviewService = require("../../servicesN/reviews/review.services");
const logger = require("../../config/logger");

exports.submitReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user._id;
    const { rating, reviewText } = req.body;

    const review = await reviewService.submitReview(
      taskId,
      reviewerId,
      rating,
      reviewText
    );

    logger.info("Review submitted successfully", {
      controller: "review.controller",
      reviewId: review._id,
      taskId,
      reviewerId,
      rating,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: "Review submitted successfully",
    });
  } catch (error) {
    logger.error("Error submitting review:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this task",
      });
    }

    const statusCode = error.message.includes("Invalid") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to submit review",
    });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, page = 1, limit = 10 } = req.query;

    const result = await reviewService.getUserReviews(
      userId,
      role,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error getting user reviews:", error);
    const statusCode = error.message === "Invalid user ID" ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to get reviews",
    });
  }
};

exports.getTaskReviews = async (req, res) => {
  try {
    const { taskId } = req.params;

    const reviews = await reviewService.getTaskReviews(taskId);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    logger.error("Error getting task reviews:", error);
    const statusCode = error.message === "Invalid task ID" ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to get task reviews",
    });
  }
};

exports.getUserRatingStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await reviewService.getUserRatingStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching rating stats:", error);
    const statusCode =
      error.message === "Invalid user ID"
        ? 400
        : error.message === "User not found"
        ? 404
        : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.getUserReviewsPaginated = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, role, populate } = req.query;

    const result = await reviewService.getUserReviewsPaginated(
      userId,
      page,
      limit,
      role,
      populate
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching reviews:", error);
    const statusCode = error.message === "Invalid user ID" ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.submitUserReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating, reviewText, taskId } = req.body;
    const reviewerId = req.user._id;

    const review = await reviewService.submitUserReview(
      userId,
      reviewerId,
      rating,
      reviewText,
      taskId
    );

    res.status(201).json({
      success: true,
      data: review,
      message: "Review submitted successfully",
    });
  } catch (error) {
    logger.error("❌ Review submission error:", error);

    const statusCode =
      error.message.includes("Invalid") ||
      error.message.includes("must be") ||
      error.message.includes("cannot review")
        ? 400
        : error.message.includes("already")
        ? 409
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDetailedRatingStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await reviewService.getDetailedRatingStats(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error getting rating stats:", error);
    const statusCode = error.message === "Invalid user ID" ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to get rating statistics",
    });
  }
};

exports.checkCanReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const eligibility = await reviewService.checkCanReview(taskId, userId);

    res.status(200).json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    logger.error("Error checking review eligibility:", error);
    const statusCode = error.message === "Invalid task ID" ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to check review eligibility",
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const { rating, reviewText } = req.body;

    const review = await reviewService.updateReview(
      reviewId,
      userId,
      rating,
      reviewText
    );

    res.status(200).json({
      success: true,
      data: review,
      message: "Review updated successfully",
    });
  } catch (error) {
    logger.error("Error updating review:", error);
    const statusCode =
      error.message === "Invalid review ID"
        ? 400
        : error.message === "Review not found"
        ? 404
        : error.message.includes("only update your own")
        ? 403
        : error.message.includes("must be between")
        ? 400
        : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update review",
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    await reviewService.deleteReview(reviewId, userId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting review:", error);
    const statusCode =
      error.message === "Invalid review ID"
        ? 400
        : error.message === "Review not found"
        ? 404
        : error.message.includes("only delete your own")
        ? 403
        : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete review",
    });
  }
};

exports.respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const { responseText } = req.body;

    const review = await reviewService.respondToReview(
      reviewId,
      userId,
      responseText
    );

    res.status(200).json({
      success: true,
      data: review,
      message: "Response added successfully",
    });
  } catch (error) {
    logger.error("Error responding to review:", error);
    const statusCode =
      error.message === "Invalid review ID"
        ? 400
        : error.message === "Response text is required"
        ? 400
        : error.message === "Review not found"
        ? 404
        : error.message.includes("only respond to reviews about you")
        ? 403
        : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to add response",
    });
  }
};

exports.canReviewUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviewerId = req.user._id;

    const result = await reviewService.canReviewUser(userId, reviewerId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error checking review eligibility:", error);
    const statusCode = error.message === "User not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.requestReview = async (req, res) => {
  try {
    const { method, recipient, message } = req.body;
    const userId = req.user._id;

    await reviewService.requestReview(userId, method, recipient, message);

    res.json({
      success: true,
      message: `Review request sent via ${method}`,
    });
  } catch (error) {
    logger.error("Error sending review request:", error);
    const statusCode =
      error.message === "User not found"
        ? 404
        : error.message.includes("Invalid method")
        ? 400
        : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to send review request",
    });
  }
};

