const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE_URL = 'http://localhost:5001/api';
const MONGO_URI = 'mongodb://localhost:27017/Airtasker';

async function diagnostics() {
  console.log('🔍 Running Diagnostics...\n');
  
  try {
    // 1. Check server is running
    console.log('1️⃣ Checking if server is responding...');
    try {
      const healthCheck = await axios.get('http://localhost:5001');
      console.log('   ✅ Server is running');
    } catch (error) {
      console.log('   ❌ Server is not responding:', error.message);
      return;
    }
    
    // 2. Connect to database
    console.log('\n2️⃣ Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('   ✅ Connected to MongoDB');
    
    // 3. Check for users
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`   ℹ️  Total users: ${userCount}`);
    
    if (userCount === 0) {
      console.log('   ⚠️  No users found. Cannot test endpoints.');
      return;
    }
    
    // 4. Get a test user
    const testUser = await User.findOne();
    console.log(`   ℹ️  Test user: ${testUser.firstName} ${testUser.lastName} (${testUser._id})`);
    
    // 5. Test GET rating-stats endpoint
    console.log('\n3️⃣ Testing GET /api/users/:userId/rating-stats');
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${testUser._id}/rating-stats`);
      console.log('   ✅ Endpoint responding:', response.status);
      console.log('   📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   ❌ Endpoint error:', error.response?.status, error.response?.data || error.message);
    }
    
    // 6. Test GET reviews endpoint
    console.log('\n4️⃣ Testing GET /api/users/:userId/reviews');
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${testUser._id}/reviews`);
      console.log('   ✅ Endpoint responding:', response.status);
      console.log('   📊 Total reviews:', response.data.data?.totalCount || 0);
    } catch (error) {
      console.log('   ❌ Endpoint error:', error.response?.status, error.response?.data || error.message);
    }
    
    // 7. Check Review model
    console.log('\n5️⃣ Checking Review model...');
    const Review = require('./models/Review');
    const reviewCount = await Review.countDocuments();
    console.log(`   ℹ️  Total reviews in database: ${reviewCount}`);
    
    if (reviewCount > 0) {
      const sampleReview = await Review.findOne().populate('reviewerId revieweeId');
      console.log('   📝 Sample review:', {
        id: sampleReview._id,
        rating: sampleReview.rating,
        reviewerId: sampleReview.reviewerId?._id,
        revieweeId: sampleReview.revieweeId?._id,
        text: sampleReview.reviewText?.substring(0, 50) + '...'
      });
    }
    
    // 8. Test POST endpoint (without auth - should fail with 401)
    console.log('\n6️⃣ Testing POST /api/users/:userId/reviews (without auth)');
    try {
      const response = await axios.post(`${API_BASE_URL}/users/${testUser._id}/reviews`, {
        rating: 5,
        reviewText: 'Test review for diagnostic purposes only'
      });
      console.log('   ⚠️  Endpoint accepting requests without auth (SECURITY ISSUE)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Endpoint correctly requires authentication');
      } else {
        console.log('   ❌ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }
    
    // 9. Check routes registration
    console.log('\n7️⃣ Checking route registration...');
    console.log('   ℹ️  Routes should be registered in app.js');
    console.log('   ℹ️  Expected: app.use("/api", userReviewRoutes)');
    
    // 10. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Server: Running`);
    console.log(`✅ Database: Connected`);
    console.log(`ℹ️  Users: ${userCount}`);
    console.log(`ℹ️  Reviews: ${reviewCount}`);
    console.log('\n🔍 If endpoints are not working:');
    console.log('   1. Check server logs for errors');
    console.log('   2. Verify routes are registered in app.js');
    console.log('   3. Check controller file exists and exports functions');
    console.log('   4. Verify middleware is not blocking requests');
    console.log('   5. Check CORS configuration');
    
  } catch (error) {
    console.error('\n❌ Diagnostic error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

diagnostics();
