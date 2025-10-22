const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  // Who is being reviewed
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Who wrote the review
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Associated task (optional - can be null for general profile reviews)
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    index: true
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Review text (required, min 10 chars, max 500 chars)
  reviewText: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  
  // Role of reviewer when giving this review
  reviewerRole: {
    type: String,
    enum: ['poster', 'tasker'],
    default: 'tasker'
  },
  
  // Optional response from reviewee
  response: {
    text: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdAt: Date
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for performance
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1, revieweeId: 1 });
reviewSchema.index({ taskId: 1, reviewerId: 1 });

// Prevent duplicate reviews for same task (only if taskId exists)
reviewSchema.index(
  { reviewerId: 1, revieweeId: 1, taskId: 1 }, 
  { unique: true, sparse: true }
);


// Static method to calculate user's rating statistics
reviewSchema.statics.calculateUserRating = async function(userId, role = null) {
  try {
    const matchQuery = { revieweeId: userId };
    if (role) {
      matchQuery.reviewerRole = role;
    }

    const result = await this.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    if (result.length === 0) {
      return {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result[0].ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    return {
      average: Number((result[0].averageRating).toFixed(1)), // Round to 1 decimal
      count: result[0].totalReviews,
      distribution: distribution
    };
  } catch (error) {
    console.error("Error calculating user rating:", error);
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};

// Static method to update user's cached rating statistics
reviewSchema.statics.updateUserRating = async function(userId) {
  try {
    const User = mongoose.model("User");
    
    // Calculate overall rating
    const overallStats = await this.calculateUserRating(userId);
    
    // Calculate poster rating (reviews received when acting as poster)
    const posterStats = await this.calculateUserRating(userId, 'poster');
    
    // Calculate tasker rating (reviews received when acting as tasker)
    const taskerStats = await this.calculateUserRating(userId, 'tasker');
    
    // Update user document with new structure
    await User.findByIdAndUpdate(userId, {
      $set: {
        rating: overallStats.average || 0,
        'ratingStats.overall': overallStats,
        'ratingStats.asPoster': posterStats,
        'ratingStats.asTasker': taskerStats
      }
    });

    return true;
  } catch (error) {
    console.error("Error updating user rating:", error);
    return false;
  }
};

module.exports = mongoose.model("Review", reviewSchema);

