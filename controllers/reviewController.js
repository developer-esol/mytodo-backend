const Review = require("../models/Review");
const Task = require("../models/Task");
const User = require("../models/User");
const mongoose = require("mongoose");

const isValidObjectId = mongoose.Types.ObjectId.isValid;

/**
 * Submit a review for a completed task
 * POST /api/tasks/:taskId/reviews
 */
exports.submitReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user._id;
    const { rating, reviewText } = req.body;

    // Validate task ID
    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if user can review this task
    const eligibility = await Review.canUserReview(taskId, reviewerId);
    
    if (!eligibility.canReview) {
      return res.status(400).json({
        success: false,
        message: eligibility.message
      });
    }

    // Create the review
    const review = new Review({
      task: taskId,
      reviewer: reviewerId,
      reviewee: eligibility.revieweeId,
      revieweeRole: eligibility.revieweeRole,
      rating: parseInt(rating),
      reviewText: reviewText ? reviewText.trim() : undefined
    });

    await review.save();

    // Update the reviewee's rating
    await Review.updateUserRating(eligibility.revieweeId);

    // Populate reviewer and reviewee details
    await review.populate('reviewer reviewee', 'firstName lastName avatar');
    await review.populate('task', 'title');

    res.status(201).json({
      success: true,
      data: review,
      message: "Review submitted successfully"
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this task"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit review"
    });
  }
};

/**
 * Get all reviews for a specific user
 * GET /api/users/:userId/reviews
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, page = 1, limit = 10 } = req.query;

    // Validate user ID
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Build query
    const query = {
      reviewee: userId,
      isVisible: true
    };

    if (role && ['poster', 'tasker'].includes(role)) {
      query.revieweeRole = role;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews
    const reviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalReviews = await Review.countDocuments(query);

    // Get rating statistics
    const ratingStats = await Review.calculateUserRating(userId, role || null);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          limit: parseInt(limit)
        },
        ratingStats
      }
    });
  } catch (error) {
    console.error("Error getting user reviews:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get reviews"
    });
  }
};

/**
 * Get reviews for a specific task
 * GET /api/tasks/:taskId/reviews
 */
exports.getTaskReviews = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Validate task ID
    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    // Get all reviews for this task
    const reviews = await Review.find({
      task: taskId,
      isVisible: true
    })
      .populate('reviewer reviewee', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error("Error getting task reviews:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get task reviews"
    });
  }
};

/**
 * Get detailed rating statistics for a user
 * GET /api/users/:userId/rating-stats
 */
exports.getUserRatingStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Get overall stats
    const overallStats = await Review.calculateUserRating(userId);
    
    // Get poster stats (reviews received when acting as task creator)
    const posterStats = await Review.calculateUserRating(userId, 'poster');
    
    // Get tasker stats (reviews received when acting as task doer)
    const taskerStats = await Review.calculateUserRating(userId, 'tasker');

    // Get recent reviews
    const recentReviews = await Review.find({
      reviewee: userId,
      isVisible: true
    })
      .populate('reviewer', 'firstName lastName avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats,
        asPoster: posterStats,
        asTasker: taskerStats,
        recentReviews
      }
    });
  } catch (error) {
    console.error("Error getting rating stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get rating statistics"
    });
  }
};

/**
 * Check if current user can review a task
 * GET /api/tasks/:taskId/can-review
 */
exports.checkCanReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    // Validate task ID
    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    const eligibility = await Review.canUserReview(taskId, userId);

    res.status(200).json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check review eligibility"
    });
  }
};

/**
 * Update a review (only the reviewer can update)
 * PUT /api/reviews/:reviewId
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const { rating, reviewText } = req.body;

    // Validate review ID
    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID"
      });
    }

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user is the reviewer
    if (review.reviewer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews"
      });
    }

    // Update fields
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5"
        });
      }
      review.rating = parseInt(rating);
    }

    if (reviewText !== undefined) {
      review.reviewText = reviewText.trim();
    }

    await review.save();

    // Update the reviewee's rating
    await Review.updateUserRating(review.reviewee);

    // Populate details
    await review.populate('reviewer reviewee', 'firstName lastName avatar');
    await review.populate('task', 'title');

    res.status(200).json({
      success: true,
      data: review,
      message: "Review updated successfully"
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update review"
    });
  }
};

/**
 * Delete a review (only the reviewer can delete)
 * DELETE /api/reviews/:reviewId
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    // Validate review ID
    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID"
      });
    }

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user is the reviewer
    if (review.reviewer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews"
      });
    }

    const revieweeId = review.reviewee;

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update the reviewee's rating
    await Review.updateUserRating(revieweeId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete review"
    });
  }
};

/**
 * Add a response to a review (only the reviewee can respond)
 * POST /api/reviews/:reviewId/response
 */
exports.respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const { responseText } = req.body;

    // Validate review ID
    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID"
      });
    }

    if (!responseText || responseText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Response text is required"
      });
    }

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user is the reviewee
    if (review.reviewee.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only respond to reviews about you"
      });
    }

    // Add response
    review.response = {
      text: responseText.trim(),
      respondedAt: new Date()
    };

    await review.save();

    // Populate details
    await review.populate('reviewer reviewee', 'firstName lastName avatar');
    await review.populate('task', 'title');

    res.status(200).json({
      success: true,
      data: review,
      message: "Response added successfully"
    });
  } catch (error) {
    console.error("Error responding to review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add response"
    });
  }
};
