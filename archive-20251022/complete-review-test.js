const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001';

async function testReviewSubmission() {
  try {
    console.log('🧪 Complete Review System Test\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = require('./models/User');
    const Review = require('./models/Review');
    const jwt = require('jsonwebtoken');
    
    // Get all users
    const users = await User.find().limit(5);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users in database');
      process.exit(1);
    }
    
    console.log(`📊 Found ${users.length} users in database\n`);
    
    // Use first user as reviewer, second as reviewee
    const reviewer = users[0];
    const reviewee = users[1];
    
    console.log(`👤 REVIEWER: ${reviewer.firstName} ${reviewer.lastName}`);
    console.log(`   ID: ${reviewer._id}`);
    console.log(`   Email: ${reviewer.email}\n`);
    
    console.log(`👤 REVIEWEE: ${reviewee.firstName} ${reviewee.lastName}`);
    console.log(`   ID: ${reviewee._id}`);
    console.log(`   Email: ${reviewee.email}\n`);
    
    // Generate JWT token for reviewer
    const token = jwt.sign(
      { _id: reviewer._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log('🔑 Generated auth token\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test 1: Get rating stats (public - no auth)
    console.log('1️⃣ GET Rating Stats (Public Endpoint - No Auth Required)');
    try {
      const response = await axios.get(
        `${BASE_URL}/api/users/${reviewee._id}/rating-stats`
      );
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Overall Rating: ${response.data.data.overall.average} (${response.data.data.overall.count} reviews)`);
      console.log(`   📊 As Poster: ${response.data.data.asPoster.average} (${response.data.data.asPoster.count} reviews)`);
      console.log(`   📊 As Tasker: ${response.data.data.asTasker.average} (${response.data.data.asTasker.count} reviews)\n`);
    } catch (error) {
      console.log(`   ❌ Error ${error.response?.status}: ${error.response?.data?.message || error.message}\n`);
    }
    
    // Test 2: Get reviews (public - no auth)
    console.log('2️⃣ GET Reviews (Public Endpoint - No Auth Required)');
    try {
      const response = await axios.get(
        `${BASE_URL}/api/users/${reviewee._id}/reviews?limit=5&populate=reviewer`
      );
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📝 Total Reviews: ${response.data.data.totalCount}`);
      console.log(`   📄 Current Page: ${response.data.data.currentPage}/${response.data.data.totalPages}\n`);
      
      if (response.data.data.reviews.length > 0) {
        console.log('   Recent Reviews:');
        response.data.data.reviews.slice(0, 2).forEach((review, idx) => {
          console.log(`   ${idx + 1}. ⭐${review.rating} - "${review.reviewText.substring(0, 50)}..."`);
        });
        console.log('');
      }
    } catch (error) {
      console.log(`   ❌ Error ${error.response?.status}: ${error.response?.data?.message || error.message}\n`);
    }
    
    // Test 3: Submit review WITHOUT auth (should fail)
    console.log('3️⃣ POST Review WITHOUT Auth (Should Fail with 401)');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/users/${reviewee._id}/reviews`,
        {
          rating: 5,
          reviewText: 'This is a test review without authentication token'
        }
      );
      console.log(`   ⚠️  Unexpected success! This should have failed.\n`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`   ✅ Correctly blocked: Status ${error.response.status} - "${error.response.data.error}"\n`);
      } else {
        console.log(`   ❌ Wrong error: Status ${error.response?.status} - ${error.response?.data?.message}\n`);
      }
    }
    
    // Test 4: Can review check
    console.log('4️⃣ GET Can Review (Check Eligibility)');
    try {
      const response = await axios.get(
        `${BASE_URL}/api/users/${reviewee._id}/can-review`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📋 Can Review: ${response.data.data.canReview}`);
      if (!response.data.data.canReview) {
        console.log(`   📋 Reason: ${response.data.data.reason}\n`);
      } else {
        console.log('');
      }
    } catch (error) {
      console.log(`   ❌ Error ${error.response?.status}: ${error.response?.data?.message || error.message}\n`);
    }
    
    // Test 5: Submit valid review WITH auth
    console.log('5️⃣ POST Valid Review WITH Auth');
    
    // Check if already reviewed
    const existingReview = await Review.findOne({
      reviewerId: reviewer._id,
      revieweeId: reviewee._id,
      taskId: null // Reviews without task
    });
    
    if (existingReview) {
      console.log(`   ℹ️  Already reviewed this user (Review ID: ${existingReview._id})`);
      console.log(`   ⭐ Previous Rating: ${existingReview.rating}`);
      console.log(`   📝 Previous Review: "${existingReview.reviewText.substring(0, 60)}..."\n`);
    } else {
      try {
        const reviewData = {
          rating: 5,
          reviewText: 'Excellent work! Very professional and delivered on time. Highly recommend for future projects.'
        };
        
        const response = await axios.post(
          `${BASE_URL}/api/users/${reviewee._id}/reviews`,
          reviewData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   🎉 Review submitted successfully!`);
        console.log(`   📝 Review ID: ${response.data.data._id}`);
        console.log(`   ⭐ Rating: ${response.data.data.rating}`);
        console.log(`   💬 Text: "${response.data.data.reviewText.substring(0, 60)}..."\n`);
      } catch (error) {
        console.log(`   ❌ Error ${error.response?.status}: ${error.response?.data?.message || error.message}`);
        if (error.response?.status === 500) {
          console.log('   🔍 Check server console for detailed error logs\n');
        }
      }
    }
    
    // Test 6: Try to review yourself (should fail)
    console.log('6️⃣ POST Review Yourself (Should Fail)');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/users/${reviewer._id}/reviews`, // Same user ID as reviewer
        {
          rating: 5,
          reviewText: 'This should fail because you cannot review yourself'
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log(`   ⚠️  Unexpected success! This should have failed.\n`);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('yourself')) {
        console.log(`   ✅ Correctly blocked: "${error.response.data.message}"\n`);
      } else {
        console.log(`   ❌ Wrong error: Status ${error.response?.status} - ${error.response?.data?.message}\n`);
      }
    }
    
    // Test 7: Database verification
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('7️⃣ Database Verification');
    
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();
    const revieweeReviews = await Review.countDocuments({ revieweeId: reviewee._id });
    
    console.log(`   👥 Total Users: ${totalUsers}`);
    console.log(`   📝 Total Reviews: ${totalReviews}`);
    console.log(`   📊 Reviews for ${reviewee.firstName}: ${revieweeReviews}\n`);
    
    // Get updated rating stats from database
    const updatedUser = await User.findById(reviewee._id);
    if (updatedUser.ratingStats) {
      console.log(`   📈 Updated Rating Stats:`);
      console.log(`      Overall: ${updatedUser.ratingStats.overall?.average || 0} ⭐ (${updatedUser.ratingStats.overall?.count || 0} reviews)`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testReviewSubmission();
