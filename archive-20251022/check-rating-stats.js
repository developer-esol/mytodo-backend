/**
 * Check Rating Statistics in Database
 * 
 * This script connects to the database and displays:
 * - Total reviews count
 * - Users with reviews and their ratings
 * - Rating distribution
 * - Sample API response format
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/Review');
const User = require('./models/User');
const Task = require('./models/Task');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

async function checkRatingStats() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RATING STATISTICS DATABASE CHECK');
    console.log('='.repeat(70) + '\n');

    // 1. Get total reviews count
    const totalReviews = await Review.countDocuments({ isVisible: true });
    console.log(`📝 Total Reviews in Database: ${totalReviews}\n`);

    if (totalReviews === 0) {
      console.log('⚠️  No reviews found in database!');
      console.log('ℹ️  You need to add reviews first before the API can return rating data.');
      console.log('ℹ️  Use the POST /api/tasks/:taskId/reviews endpoint to submit reviews.\n');
      await mongoose.connection.close();
      return;
    }

    // 2. Get all reviews with details
    const allReviews = await Review.find({ isVisible: true })
      .populate('reviewer reviewee', 'firstName lastName')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    console.log('📋 Recent Reviews:\n');
    allReviews.slice(0, 5).forEach((review, index) => {
      console.log(`${index + 1}. ${review.reviewer?.firstName || 'Unknown'} → ${review.reviewee?.firstName || 'Unknown'}`);
      console.log(`   Rating: ${'⭐'.repeat(review.rating)} (${review.rating}/5)`);
      console.log(`   Role: ${review.revieweeRole}`);
      console.log(`   Task: ${review.task?.title || 'Unknown'}`);
      console.log(`   Date: ${review.createdAt.toLocaleDateString()}\n`);
    });

    // 3. Find users who have reviews
    const reviewedUserIds = await Review.distinct('reviewee', { isVisible: true });
    console.log(`👥 Users with Reviews: ${reviewedUserIds.length}\n`);

    // 4. Show rating stats for each user
    console.log('='.repeat(70));
    console.log('📊 USER RATING STATISTICS');
    console.log('='.repeat(70) + '\n');

    for (const userId of reviewedUserIds.slice(0, 3)) { // Show first 3 users
      const user = await User.findById(userId).select('firstName lastName email rating ratingStats');
      
      if (!user) continue;

      console.log(`\n👤 User: ${user.firstName} ${user.lastName}`);
      console.log(`📧 Email: ${user.email}`);
      console.log('─'.repeat(70));

      // Calculate stats using the Review model's static method
      const overallStats = await Review.calculateUserRating(userId);
      const posterStats = await Review.calculateUserRating(userId, 'poster');
      const taskerStats = await Review.calculateUserRating(userId, 'tasker');

      // Overall Rating
      console.log(`\n⭐ OVERALL RATING`);
      console.log(`   Average: ${overallStats.averageRating.toFixed(1)} / 5.0`);
      console.log(`   Total Reviews: ${overallStats.totalReviews}`);
      console.log(`   Distribution:`);
      for (let star = 5; star >= 1; star--) {
        const count = overallStats.ratingDistribution[star] || 0;
        const percentage = overallStats.totalReviews > 0 
          ? Math.round((count / overallStats.totalReviews) * 100) 
          : 0;
        const bar = '█'.repeat(Math.round(percentage / 5));
        console.log(`   ${star}★ ${'│'.padEnd(25, bar)} ${percentage}% (${count})`);
      }

      // As Poster
      if (posterStats.totalReviews > 0) {
        console.log(`\n📮 AS POSTER (Task Creator)`);
        console.log(`   Average: ${posterStats.averageRating.toFixed(1)} / 5.0`);
        console.log(`   Total Reviews: ${posterStats.totalReviews}`);
      }

      // As Tasker
      if (taskerStats.totalReviews > 0) {
        console.log(`\n👷 AS TASKER (Task Doer)`);
        console.log(`   Average: ${taskerStats.averageRating.toFixed(1)} / 5.0`);
        console.log(`   Total Reviews: ${taskerStats.totalReviews}`);
      }

      // Show API Response Format
      console.log(`\n📡 API ENDPOINT FOR THIS USER:`);
      console.log(`   GET /api/users/${userId}/rating-stats`);
      console.log(`   Authorization: Bearer YOUR_TOKEN`);

      console.log(`\n📤 EXPECTED API RESPONSE:`);
      const apiResponse = {
        success: true,
        data: {
          overall: overallStats,
          asPoster: posterStats,
          asTasker: taskerStats,
          recentReviews: '...(recent reviews array)...'
        }
      };
      console.log(JSON.stringify(apiResponse, null, 2));
      
      console.log('\n' + '='.repeat(70));
    }

    // 5. Show overall statistics
    console.log('\n📈 OVERALL SYSTEM STATISTICS\n');
    
    const ratingCounts = await Review.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    console.log('Rating Distribution Across All Reviews:');
    let totalCount = 0;
    const distribution = {};
    ratingCounts.forEach(r => {
      distribution[r._id] = r.count;
      totalCount += r.count;
    });

    for (let star = 5; star >= 1; star--) {
      const count = distribution[star] || 0;
      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      const bar = '█'.repeat(Math.round(percentage / 5));
      console.log(`${star}★ ${'│'.padEnd(25, bar)} ${percentage}% (${count} reviews)`);
    }

    // 6. API Testing Instructions
    console.log('\n' + '='.repeat(70));
    console.log('🧪 HOW TO TEST THE API');
    console.log('='.repeat(70) + '\n');

    console.log('1. Make sure the server is running:');
    console.log('   npm run dev\n');

    console.log('2. Get a user ID from above (copy one of the userId values)\n');

    console.log('3. Get your authentication token (login to get JWT token)\n');

    console.log('4. Test the API using curl (Windows PowerShell):');
    if (reviewedUserIds.length > 0) {
      console.log(`   curl -X GET http://localhost:5001/api/users/${reviewedUserIds[0]}/rating-stats \\`);
      console.log('     -H "Authorization: Bearer YOUR_TOKEN_HERE" \\');
      console.log('     -H "Content-Type: application/json"\n');
    }

    console.log('5. Or use Postman/Thunder Client:');
    console.log('   - Method: GET');
    console.log('   - URL: http://localhost:5001/api/users/USER_ID/rating-stats');
    console.log('   - Headers: Authorization: Bearer YOUR_TOKEN\n');

    console.log('6. The response will include:');
    console.log('   - overall: { averageRating, totalReviews, ratingDistribution }');
    console.log('   - asPoster: { averageRating, totalReviews, ratingDistribution }');
    console.log('   - asTasker: { averageRating, totalReviews, ratingDistribution }');
    console.log('   - recentReviews: [...]\n');

    console.log('✅ All rating statistics are calculated and ready to use!\n');

  } catch (error) {
    console.error('❌ Error checking rating stats:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the check
checkRatingStats();
