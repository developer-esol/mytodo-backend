const Review = require("../models/Review");
const User = require("../models/User");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const isValidObjectId = mongoose.Types.ObjectId.isValid;

/**
 * Get user rating statistics
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
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Calculate fresh statistics from reviews
    const reviews = await Review.find({ revieweeId: userId });
    
    const stats = {
      overall: { average: 0, count: 0 },
      asPoster: { average: 0, count: 0 },
      asTasker: { average: 0, count: 0 },
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    if (reviews.length > 0) {
      // Calculate overall stats
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      stats.overall.average = Number((totalRating / reviews.length).toFixed(1));
      stats.overall.count = reviews.length;
      
      // Calculate role-based stats
      const posterReviews = reviews.filter(r => r.reviewerRole === 'poster');
      const taskerReviews = reviews.filter(r => r.reviewerRole === 'tasker');
      
      if (posterReviews.length > 0) {
        const posterTotal = posterReviews.reduce((sum, r) => sum + r.rating, 0);
        stats.asPoster.average = Number((posterTotal / posterReviews.length).toFixed(1));
        stats.asPoster.count = posterReviews.length;
      }
      
      if (taskerReviews.length > 0) {
        const taskerTotal = taskerReviews.reduce((sum, r) => sum + r.rating, 0);
        stats.asTasker.average = Number((taskerTotal / taskerReviews.length).toFixed(1));
        stats.asTasker.count = taskerReviews.length;
      }
      
      // Calculate distribution
      reviews.forEach(review => {
        stats.distribution[review.rating]++;
      });
    }
    
    // Update cached stats in user document (async - don't wait)
    user.ratingStats = stats;
    user.save().catch(err => console.error('Error caching stats:', err));
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get user reviews (paginated)
 * GET /api/users/:userId/reviews
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, role, populate } = req.query;
    
    // Validate user ID
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }
    
    // Build query
    const query = { revieweeId: userId };
    if (role && ['poster', 'tasker'].includes(role)) {
      query.reviewerRole = role;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build population options
    let reviewQuery = Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Populate reviewer data if requested
    if (populate === 'reviewer') {
      reviewQuery = reviewQuery.populate('reviewerId', 'firstName lastName avatar');
    }
    
    // Populate task data if requested
    if (populate === 'task') {
      reviewQuery = reviewQuery.populate('taskId', 'title');
    }
    
    // Fetch reviews
    const reviews = await reviewQuery;
    
    // Get total count
    const totalCount = await Review.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        reviews,
        totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Submit user review
 * POST /api/users/:userId/reviews
 */
exports.submitUserReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating, reviewText, taskId } = req.body;
    const reviewerId = req.user._id;
    
    // Debug logging
    console.log('📥 Review submission request:', {
      userId,
      reviewerId: reviewerId.toString(),
      body: req.body,
      rating,
      reviewText: reviewText ? `"${reviewText}" (length: ${reviewText.length})` : 'undefined',
      taskId
    });
    
    // Validation
    if (!rating || rating < 1 || rating > 5) {
      console.log('❌ Validation failed: Invalid rating:', rating);
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    if (!reviewText || reviewText.trim().length < 10) {
      console.log('❌ Validation failed: Review text too short:', {
        reviewText,
        length: reviewText?.length,
        trimmedLength: reviewText?.trim().length
      });
      return res.status(400).json({
        success: false,
        message: 'Review text must be at least 10 characters'
      });
    }
    
    if (reviewText.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Review text must not exceed 500 characters'
      });
    }
    
    // Can't review yourself
    if (reviewerId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself'
      });
    }
    
    // Check if already reviewed
    const existingReviewQuery = {
      reviewerId,
      revieweeId: userId
    };
    
    // If taskId provided, check for review on specific task
    // If no taskId, check for general profile review (taskId: null or undefined)
    if (taskId) {
      existingReviewQuery.taskId = taskId;
    } else {
      existingReviewQuery.$or = [
        { taskId: null },
        { taskId: { $exists: false } }
      ];
    }
    
    const existingReview = await Review.findOne(existingReviewQuery);
    
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: taskId 
          ? 'You have already reviewed this user for this task'
          : 'You have already submitted a general review for this user'
      });
    }
    
    // Get reviewer to determine role
    const reviewer = await User.findById(reviewerId);
    
    // Determine reviewer role based on context
    // If taskId provided, fetch task to determine if they were poster or tasker
    // Otherwise, default to 'tasker'
    let reviewerRole = 'tasker';
    
    if (taskId) {
      const Task = require('../models/Task');
      const task = await Task.findById(taskId);
      
      if (task) {
        // If reviewer was the task poster, they're reviewing as 'poster'
        // If reviewer was the assigned tasker, they're reviewing as 'tasker'
        if (task.posterId && task.posterId.toString() === reviewerId.toString()) {
          reviewerRole = 'poster';
        } else if (task.assignedTo && task.assignedTo.toString() === reviewerId.toString()) {
          reviewerRole = 'tasker';
        }
      }
    }
    
    // Create review
    const review = new Review({
      revieweeId: userId,
      reviewerId,
      taskId: taskId || undefined,
      rating,
      reviewText: reviewText.trim(),
      reviewerRole
    });
    
    await review.save();
    
    // Populate reviewer data for response
    await review.populate('reviewerId', 'firstName lastName avatar');
    if (taskId) {
      await review.populate('taskId', 'title');
    }
    
    // Update user's cached rating stats (async - don't wait)
    updateUserRatingStats(userId).catch(err =>
      console.error('Error updating stats:', err)
    );
    
    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully'
    });
    
  } catch (error) {
    console.error('Error submitting review:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      userId: req.params.userId,
      reviewerId: req.user?._id
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check review eligibility
 * GET /api/users/:userId/can-review
 */
exports.canReviewUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviewerId = req.user._id;
    
    // Can't review yourself
    if (reviewerId.toString() === userId) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: 'You cannot review yourself'
        }
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if already reviewed (general profile review)
    const existingReview = await Review.findOne({
      reviewerId,
      revieweeId: userId,
      taskId: { $exists: false }
    });
    
    if (existingReview) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: 'You have already reviewed this user'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        canReview: true,
        reason: 'You can leave a review'
      }
    });
    
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Send review request (Email/SMS)
 * POST /api/users/request-review
 */
exports.requestReview = async (req, res) => {
  try {
    const { method, recipient, message } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate review link
    const reviewLink = `${process.env.FRONTEND_URL}/review/${userId}`;
    
    // Prepare message
    const fullMessage = message ||
      `Hi! ${user.firstName} ${user.lastName} would appreciate your feedback. Please leave a review here: ${reviewLink}`;
    
    if (method === 'email') {
      // Send email using nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: `Review Request from ${user.firstName} ${user.lastName}`,
        html: `
          <h2>Review Request</h2>
          <p>${fullMessage.replace(reviewLink, `<a href="${reviewLink}">${reviewLink}</a>`)}</p>
        `
      });
      
    } else if (method === 'sms') {
      // Send SMS using Twilio
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      await client.messages.create({
        body: fullMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid method. Use "email" or "sms"'
      });
    }
    
    res.json({
      success: true,
      message: `Review request sent via ${method}`
    });
    
  } catch (error) {
    console.error('Error sending review request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send review request'
    });
  }
};

/**
 * Helper function to update cached rating stats
 */
async function updateUserRatingStats(userId) {
  const reviews = await Review.find({ revieweeId: userId });
  
  const stats = {
    overall: { average: 0, count: 0 },
    asPoster: { average: 0, count: 0 },
    asTasker: { average: 0, count: 0 },
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    stats.overall.average = Number((totalRating / reviews.length).toFixed(1));
    stats.overall.count = reviews.length;
    
    const posterReviews = reviews.filter(r => r.reviewerRole === 'poster');
    const taskerReviews = reviews.filter(r => r.reviewerRole === 'tasker');
    
    if (posterReviews.length > 0) {
      stats.asPoster.average = Number(
        (posterReviews.reduce((sum, r) => sum + r.rating, 0) / posterReviews.length).toFixed(1)
      );
      stats.asPoster.count = posterReviews.length;
    }
    
    if (taskerReviews.length > 0) {
      stats.asTasker.average = Number(
        (taskerReviews.reduce((sum, r) => sum + r.rating, 0) / taskerReviews.length).toFixed(1)
      );
      stats.asTasker.count = taskerReviews.length;
    }
    
    reviews.forEach(review => {
      stats.distribution[review.rating]++;
    });
  }
  
  await User.findByIdAndUpdate(userId, { ratingStats: stats });
}
