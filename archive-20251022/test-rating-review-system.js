const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const MONGO_URI = 'mongodb://localhost:27017/Airtasker';
const API_BASE_URL = 'http://localhost:5001/api';

// Test data
let testUserId = null;
let testReviewerId = null;
let authToken = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    log('✅ Connected to MongoDB', 'green');
  } catch (error) {
    log(`❌ MongoDB connection error: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function findTestUsers() {
  try {
    const User = require('./models/User');
    const users = await User.find().limit(5);
    
    if (users.length < 2) {
      log('❌ Not enough users in database. Please create at least 2 users.', 'red');
      process.exit(1);
    }
    
    testUserId = users[0]._id.toString();
    testReviewerId = users[1]._id.toString();
    
    log('\n📋 Test Users:', 'blue');
    log(`   User 1 (Reviewee): ${users[0].firstName} ${users[0].lastName} (${testUserId})`, 'gray');
    log(`   User 2 (Reviewer): ${users[1].firstName} ${users[1].lastName} (${testReviewerId})`, 'gray');
    
    return true;
  } catch (error) {
    log(`❌ Error finding test users: ${error.message}`, 'red');
    return false;
  }
}

async function createAuthToken() {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');
    const reviewer = await User.findById(testReviewerId);
    
    authToken = jwt.sign(
      { id: testReviewerId, email: reviewer.email },
      process.env.JWT_SECRET || '[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]c29b76b3',
      { expiresIn: '1h' }
    );
    
    log('✅ Created auth token for testing', 'green');
    return true;
  } catch (error) {
    log(`❌ Error creating auth token: ${error.message}`, 'red');
    return false;
  }
}

async function testGetRatingStats() {
  try {
    log('\n🧪 Test 1: GET /api/users/:userId/rating-stats', 'yellow');
    
    const response = await axios.get(`${API_BASE_URL}/users/${testUserId}/rating-stats`);
    
    if (response.status === 200) {
      log('✅ Status: 200 OK', 'green');
      log('📊 Response Data:', 'blue');
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetUserReviews() {
  try {
    log('\n🧪 Test 2: GET /api/users/:userId/reviews', 'yellow');
    
    const response = await axios.get(`${API_BASE_URL}/users/${testUserId}/reviews`, {
      params: { page: 1, limit: 10, populate: 'reviewer' }
    });
    
    if (response.status === 200) {
      log('✅ Status: 200 OK', 'green');
      log('📊 Response Data:', 'blue');
      log(`   Total Reviews: ${response.data.data.totalCount}`, 'gray');
      log(`   Current Page: ${response.data.data.currentPage}`, 'gray');
      log(`   Total Pages: ${response.data.data.totalPages}`, 'gray');
      log(`   Reviews Count: ${response.data.data.reviews.length}`, 'gray');
      
      if (response.data.data.reviews.length > 0) {
        log('\n   Sample Review:', 'gray');
        console.log(JSON.stringify(response.data.data.reviews[0], null, 2));
      }
      return true;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testSubmitReview() {
  try {
    log('\n🧪 Test 3: POST /api/users/:userId/reviews', 'yellow');
    
    const reviewData = {
      rating: 5,
      reviewText: 'Excellent work! Very professional and completed the task on time. Highly recommended for future projects.'
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/users/${testUserId}/reviews`,
      reviewData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.status === 201) {
      log('✅ Status: 201 Created', 'green');
      log('📊 Response Data:', 'blue');
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      log('⚠️  Review already exists (expected for duplicate test)', 'yellow');
      return true;
    }
    log(`❌ Test failed: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      console.log(error.response.data);
    }
    return false;
  }
}

async function testCanReview() {
  try {
    log('\n🧪 Test 4: GET /api/users/:userId/can-review', 'yellow');
    
    const response = await axios.get(`${API_BASE_URL}/users/${testUserId}/can-review`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status === 200) {
      log('✅ Status: 200 OK', 'green');
      log('📊 Response Data:', 'blue');
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testSelfReview() {
  try {
    log('\n🧪 Test 5: POST /api/users/:userId/reviews (Self-review - Should Fail)', 'yellow');
    
    const reviewData = {
      rating: 5,
      reviewText: 'I am great! Testing self-review validation.'
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/users/${testReviewerId}/reviews`,
      reviewData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    log('❌ Test failed: Self-review was allowed (should be blocked)', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('cannot review yourself')) {
      log('✅ Self-review correctly blocked', 'green');
      log(`   Message: ${error.response.data.message}`, 'gray');
      return true;
    }
    log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testInvalidRating() {
  try {
    log('\n🧪 Test 6: POST /api/users/:userId/reviews (Invalid Rating - Should Fail)', 'yellow');
    
    const reviewData = {
      rating: 6, // Invalid - should be 1-5
      reviewText: 'This review has an invalid rating.'
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/users/${testUserId}/reviews`,
      reviewData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    log('❌ Test failed: Invalid rating was accepted', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('Rating must be between')) {
      log('✅ Invalid rating correctly rejected', 'green');
      log(`   Message: ${error.response.data.message}`, 'gray');
      return true;
    }
    log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testShortReviewText() {
  try {
    log('\n🧪 Test 7: POST /api/users/:userId/reviews (Short Text - Should Fail)', 'yellow');
    
    const reviewData = {
      rating: 5,
      reviewText: 'Short' // Too short - min 10 chars
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/users/${testUserId}/reviews`,
      reviewData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    log('❌ Test failed: Short review text was accepted', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('at least 10 characters')) {
      log('✅ Short review text correctly rejected', 'green');
      log(`   Message: ${error.response.data.message}`, 'gray');
      return true;
    }
    log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testPagination() {
  try {
    log('\n🧪 Test 8: GET /api/users/:userId/reviews?page=1&limit=5 (Pagination)', 'yellow');
    
    const response = await axios.get(`${API_BASE_URL}/users/${testUserId}/reviews`, {
      params: { page: 1, limit: 5 }
    });
    
    if (response.status === 200) {
      log('✅ Status: 200 OK', 'green');
      log('📊 Pagination:', 'blue');
      log(`   Requested Limit: 5`, 'gray');
      log(`   Reviews Returned: ${response.data.data.reviews.length}`, 'gray');
      log(`   Total Count: ${response.data.data.totalCount}`, 'gray');
      log(`   Total Pages: ${response.data.data.totalPages}`, 'gray');
      return true;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testRoleFiltering() {
  try {
    log('\n🧪 Test 9: GET /api/users/:userId/reviews?role=poster (Role Filtering)', 'yellow');
    
    const response = await axios.get(`${API_BASE_URL}/users/${testUserId}/reviews`, {
      params: { role: 'poster' }
    });
    
    if (response.status === 200) {
      log('✅ Status: 200 OK', 'green');
      log('📊 Filtered Reviews:', 'blue');
      log(`   Total Reviews with role=poster: ${response.data.data.totalCount}`, 'gray');
      return true;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  try {
    log('\[REDACTED_AWS_SECRET_ACCESS_KEY]=======', 'blue');
    log('🚀 Rating & Review System - API Test Suite', 'blue');
    log('[REDACTED_AWS_SECRET_ACCESS_KEY]======\n', 'blue');
    
    // Connect to database
    await connectDB();
    
    // Find test users
    const usersFound = await findTestUsers();
    if (!usersFound) return;
    
    // Create auth token
    const tokenCreated = await createAuthToken();
    if (!tokenCreated) return;
    
    // Run tests
    const results = {
      passed: 0,
      failed: 0
    };
    
    const tests = [
      testGetRatingStats,
      testGetUserReviews,
      testCanReview,
      testSubmitReview,
      testSelfReview,
      testInvalidRating,
      testShortReviewText,
      testPagination,
      testRoleFiltering
    ];
    
    for (const test of tests) {
      const result = await test();
      if (result) {
        results.passed++;
      } else {
        results.failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between tests
    }
    
    // Summary
    log('\[REDACTED_AWS_SECRET_ACCESS_KEY]=======', 'blue');
    log('📊 Test Summary', 'blue');
    log('[REDACTED_AWS_SECRET_ACCESS_KEY]======', 'blue');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`📈 Success Rate: ${((results.passed / tests.length) * 100).toFixed(1)}%`, 'blue');
    log('[REDACTED_AWS_SECRET_ACCESS_KEY]======\n', 'blue');
    
    if (results.failed === 0) {
      log('🎉 All tests passed successfully!', 'green');
    } else {
      log('⚠️  Some tests failed. Please review the output above.', 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log('\n✅ Disconnected from MongoDB', 'green');
  }
}

// Run tests
runAllTests();
