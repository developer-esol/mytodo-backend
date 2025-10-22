const mongoose = require("mongoose");
require("dotenv").config();

// Test the review system endpoints
async function testReviewEndpoints() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    const User = require("./models/User");
    const Task = require("./models/Task");
    const Review = require("./models/Review");

    // Get all users
    const users = await User.find().limit(5).select("_id firstName lastName email");
    console.log("📊 Sample Users:", users.map(u => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email
    })));

    // Get all tasks
    const tasks = await Task.find().limit(5).select("_id title status createdBy assignedTo");
    console.log("\n📋 Sample Tasks:", tasks.map(t => ({
      id: t._id,
      title: t.title,
      status: t.status,
      createdBy: t.createdBy,
      assignedTo: t.assignedTo
    })));

    // Check if reviews collection exists
    const reviewsCount = await Review.countDocuments();
    console.log(`\n📝 Total Reviews in Database: ${reviewsCount}`);

    if (reviewsCount > 0) {
      const sampleReviews = await Review.find()
        .limit(3)
        .populate("reviewer", "firstName lastName")
        .populate("reviewee", "firstName lastName")
        .populate("task", "title");
      
      console.log("\n📝 Sample Reviews:");
      sampleReviews.forEach(r => {
        console.log({
          reviewer: r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : "Unknown",
          reviewee: r.reviewee ? `${r.reviewee.firstName} ${r.reviewee.lastName}` : "Unknown",
          task: r.task ? r.task.title : "Unknown",
          rating: r.rating,
          comment: r.comment
        });
      });
    } else {
      console.log("\n⚠️  No reviews found in database!");
      console.log("\n💡 Creating sample review data...");
      
      if (users.length >= 2 && tasks.length >= 1) {
        const reviewer = users[0];
        const reviewee = users[1];
        const task = tasks[0];

        const newReview = new Review({
          task: task._id,
          reviewer: reviewer._id,
          reviewee: reviewee._id,
          reviewerRole: 'poster',
          revieweeRole: 'tasker',
          rating: 5,
          comment: 'Excellent work! Very professional and completed the task quickly.',
          isVisible: true
        });

        await newReview.save();
        console.log("✅ Sample review created!");

        // Update user rating stats
        await Review.updateUserRating(reviewee._id);
        console.log("✅ User rating stats updated!");

        const updatedUser = await User.findById(reviewee._id).select("firstName lastName rating ratingStats");
        console.log("\n📊 Updated User Stats:", {
          name: `${updatedUser.firstName} ${updatedUser.lastName}`,
          rating: updatedUser.rating,
          ratingStats: updatedUser.ratingStats
        });
      }
    }

    // Test API endpoint simulation
    console.log("\n\n🧪 API Endpoint Tests:");
    console.log("=====================================");
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n1️⃣  GET /api/users/${testUser._id}/reviews`);
      const userReviews = await Review.find({ reviewee: testUser._id, isVisible: true })
        .populate('reviewer', 'firstName lastName avatar')
        .populate('task', 'title')
        .limit(10);
      console.log(`   Found ${userReviews.length} reviews for ${testUser.firstName} ${testUser.lastName}`);

      console.log(`\n2️⃣  GET /api/users/${testUser._id}/rating-stats`);
      const ratingStats = await Review.calculateUserRating(testUser._id);
      console.log("   Rating Stats:", JSON.stringify(ratingStats, null, 2));
    }

    if (tasks.length > 0) {
      const testTask = tasks[0];
      console.log(`\n3️⃣  GET /api/tasks/${testTask._id}/reviews`);
      const taskReviews = await Review.find({ task: testTask._id, isVisible: true })
        .populate('reviewer', 'firstName lastName avatar')
        .populate('reviewee', 'firstName lastName avatar');
      console.log(`   Found ${taskReviews.length} reviews for task: ${testTask.title}`);
    }

    console.log("\n\n✅ Test complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testReviewEndpoints();
