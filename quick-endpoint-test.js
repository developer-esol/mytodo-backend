const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE_URL = 'http://localhost:5001/api';
const MONGO_URI = 'mongodb://localhost:27017/Airtasker';

async function quickTest() {
  console.log('🧪 Quick Endpoint Test\n');
  
  try {
    // Connect to DB
    await mongoose.connect(MONGO_URI);
    const User = require('./models/User');
    const Review = require('./models/Review');
    
    // Get test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`Test User: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`User ID: ${testUser._id}\n`);
    
    // Test 1: Rating Stats
    console.log('1️⃣ Testing: GET /api/users/:userId/rating-stats');
    try {
      const url = `${API_BASE_URL}/users/${testUser._id}/rating-stats`;
      console.log(`   URL: ${url}`);
      const response = await axios.get(url);
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Data:`, response.data);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.code}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        console.log(`   Full Response:`, error.response.data);
      }
    }
    
    // Test 2: Get Reviews
    console.log('\n2️⃣ Testing: GET /api/users/:userId/reviews');
    try {
      const url = `${API_BASE_URL}/users/${testUser._id}/reviews?page=1&limit=10`;
      console.log(`   URL: ${url}`);
      const response = await axios.get(url);
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Total Reviews: ${response.data.data.totalCount}`);
      console.log(`   Reviews: ${response.data.data.reviews.length} returned`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.code}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 3: Database Check
    console.log('\n3️⃣ Database Status:');
    const userCount = await User.countDocuments();
    const reviewCount = await Review.countDocuments();
    console.log(`   Users: ${userCount}`);
    console.log(`   Reviews: ${reviewCount}`);
    
    if (reviewCount > 0) {
      const reviews = await Review.find({ revieweeId: testUser._id }).limit(3);
      console.log(`   Reviews for ${testUser.firstName}: ${reviews.length}`);
      reviews.forEach((r, i) => {
        console.log(`     ${i+1}. Rating: ${r.rating}, Text: ${r.reviewText?.substring(0, 30)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest();
