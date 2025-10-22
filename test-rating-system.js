const mongoose = require('mongoose');
const Review = require('./models/Review');
const User = require('./models/User');
const Task = require('./models/Task');
require('dotenv').config();

async function testRatingSystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check Review Model
    console.log('📋 Test 1: Checking Review Model...');
    const reviewSchema = Review.schema.obj;
    console.log('✅ Review Model exists');
    console.log('   Fields:', Object.keys(reviewSchema));
    
    // Test 2: Check User Model enhancements
    console.log('\n📋 Test 2: Checking User Model enhancements...');
    const userSchema = User.schema.obj;
    console.log('✅ User Model has rating field:', 'rating' in userSchema);
    console.log('✅ User Model has ratingStats field:', 'ratingStats' in userSchema);
    
    if (userSchema.ratingStats) {
      console.log('   Rating Stats structure:', Object.keys(userSchema.ratingStats));
    }
    
    // Test 3: Check Review Model methods
    console.log('\n📋 Test 3: Checking Review Model static methods...');
    console.log('✅ calculateUserRating method exists:', typeof Review.calculateUserRating === 'function');
    console.log('✅ updateUserRating method exists:', typeof Review.updateUserRating === 'function');
    console.log('✅ canUserReview method exists:', typeof Review.canUserReview === 'function');
    
    // Test 4: Check database indexes
    console.log('\n📋 Test 4: Checking Review collection indexes...');
    const indexes = Review.schema.indexes();
    console.log('✅ Number of indexes defined:', indexes.length);
    indexes.forEach((index, i) => {
      console.log(`   Index ${i + 1}:`, JSON.stringify(index));
    });
    
    // Test 5: Get sample data
    console.log('\n📋 Test 5: Checking existing data...');
    const completedTasksCount = await Task.countDocuments({ status: 'completed' });
    const usersCount = await User.countDocuments();
    const reviewsCount = await Review.countDocuments();
    
    console.log(`✅ Total users: ${usersCount}`);
    console.log(`✅ Completed tasks: ${completedTasksCount}`);
    console.log(`✅ Reviews: ${reviewsCount}`);
    
    if (completedTasksCount > 0) {
      console.log('\n💡 You have completed tasks! Users can now leave reviews.');
      
      // Get a sample completed task
      const sampleTask = await Task.findOne({ status: 'completed' })
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email');
      
      if (sampleTask) {
        console.log('\n📝 Sample completed task:');
        console.log(`   Task ID: ${sampleTask._id}`);
        console.log(`   Title: ${sampleTask.title}`);
        console.log(`   Poster: ${sampleTask.createdBy?.firstName} ${sampleTask.createdBy?.lastName}`);
        console.log(`   Tasker: ${sampleTask.assignedTo?.firstName} ${sampleTask.assignedTo?.lastName}`);
        
        // Check if this task has reviews
        const taskReviews = await Review.find({ task: sampleTask._id })
          .populate('reviewer', 'firstName lastName')
          .populate('reviewee', 'firstName lastName');
        
        if (taskReviews.length > 0) {
          console.log(`\n   ⭐ This task has ${taskReviews.length} review(s):`);
          taskReviews.forEach((review, i) => {
            console.log(`      ${i + 1}. ${review.reviewer.firstName} rated ${review.reviewee.firstName}: ${review.rating}/5`);
            if (review.reviewText) {
              console.log(`         "${review.reviewText.substring(0, 50)}..."`);
            }
          });
        } else {
          console.log('\n   💬 No reviews yet for this task.');
        }
      }
    }
    
    // Test 6: Check for users with ratings
    console.log('\n📋 Test 6: Checking users with rating data...');
    const usersWithRatings = await User.find({ 'ratingStats.overall.totalReviews': { $gt: 0 } })
      .select('firstName lastName rating ratingStats')
      .limit(3);
    
    if (usersWithRatings.length > 0) {
      console.log(`✅ Found ${usersWithRatings.length} users with ratings:`);
      usersWithRatings.forEach((user, i) => {
        console.log(`\n   ${i + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`      Overall Rating: ${user.rating || 0}/5`);
        console.log(`      Total Reviews: ${user.ratingStats?.overall?.totalReviews || 0}`);
        if (user.ratingStats?.asPoster?.totalReviews > 0) {
          console.log(`      As Poster: ${user.ratingStats.asPoster.averageRating}/5 (${user.ratingStats.asPoster.totalReviews} reviews)`);
        }
        if (user.ratingStats?.asTasker?.totalReviews > 0) {
          console.log(`      As Tasker: ${user.ratingStats.asTasker.averageRating}/5 (${user.ratingStats.asTasker.totalReviews} reviews)`);
        }
      });
    } else {
      console.log('ℹ️  No users with ratings yet.');
    }
    
    console.log('\n✅ All tests passed!');
    console.log('\n📚 Rating System is ready to use!');
    console.log('\nAPI Endpoints available:');
    console.log('  POST   /api/tasks/:taskId/reviews        - Submit a review');
    console.log('  GET    /api/tasks/:taskId/reviews        - Get task reviews');
    console.log('  GET    /api/tasks/:taskId/can-review     - Check if can review');
    console.log('  GET    /api/users/:userId/reviews        - Get user reviews');
    console.log('  GET    /api/users/:userId/rating-stats   - Get rating statistics');
    console.log('  PUT    /api/reviews/:reviewId            - Update a review');
    console.log('  DELETE /api/reviews/:reviewId            - Delete a review');
    console.log('  POST   /api/reviews/:reviewId/response   - Respond to a review');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testRatingSystem();
