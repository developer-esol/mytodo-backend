const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001';
const TEST_USER_ID = '68bba9aa738031d9bcf0bdf3';

async function testSubmitReview() {
  try {
    console.log('🧪 Testing Review Submission\n');
    
    // Connect to database to get a valid token
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = require('./models/User');
    
    // Get two users for testing
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users in database for testing');
      process.exit(1);
    }
    
    const reviewer = users[0];
    const reviewee = users[1];
    
    console.log(`👤 Reviewer: ${reviewer.firstName} ${reviewer.lastName}`);
    console.log(`   ID: ${reviewer._id}`);
    console.log(`   Email: ${reviewer.email}\n`);
    
    console.log(`👤 Reviewee: ${reviewee.firstName} ${reviewee.lastName}`);
    console.log(`   ID: ${reviewee._id}`);
    console.log(`   Email: ${reviewee.email}\n`);
    
    // Generate JWT token for reviewer
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { _id: reviewer._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log('🔑 Generated auth token\n');
    
    // Test cases
    const testCases = [
      {
        name: 'Missing rating',
        data: { reviewText: 'This is a test review with enough characters' },
        expectedError: 'Rating must be between 1 and 5'
      },
      {
        name: 'Invalid rating (0)',
        data: { rating: 0, reviewText: 'This is a test review with enough characters' },
        expectedError: 'Rating must be between 1 and 5'
      },
      {
        name: 'Invalid rating (6)',
        data: { rating: 6, reviewText: 'This is a test review with enough characters' },
        expectedError: 'Rating must be between 1 and 5'
      },
      {
        name: 'Review text too short',
        data: { rating: 5, reviewText: 'Short' },
        expectedError: 'Review text must be at least 10 characters'
      },
      {
        name: 'Review text too long',
        data: { rating: 5, reviewText: 'a'.repeat(501) },
        expectedError: 'Review text must not exceed 500 characters'
      },
      {
        name: 'Valid review submission',
        data: { 
          rating: 5, 
          reviewText: 'This is a great review with enough characters to pass validation!' 
        },
        expectedSuccess: true
      }
    ];
    
    console.log('📋 Running Test Cases:\n');
    
    for (const testCase of testCases) {
      try {
        console.log(`\n🔹 Test: ${testCase.name}`);
        console.log(`   Data:`, JSON.stringify(testCase.data, null, 2));
        
        const response = await axios.post(
          `${BASE_URL}/api/users/${reviewee._id}/reviews`,
          testCase.data,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (testCase.expectedSuccess) {
          console.log(`   ✅ SUCCESS: Status ${response.status}`);
          console.log(`   📝 Review ID: ${response.data.data._id}`);
          console.log(`   ⭐ Rating: ${response.data.data.rating}`);
        } else {
          console.log(`   ⚠️  Expected error but got success!`);
        }
        
      } catch (error) {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data.message || error.response.data.error;
          
          if (testCase.expectedError) {
            if (message === testCase.expectedError) {
              console.log(`   ✅ Got expected error (${status}): "${message}"`);
            } else {
              console.log(`   ⚠️  Got error but wrong message:`);
              console.log(`      Expected: "${testCase.expectedError}"`);
              console.log(`      Got: "${message}"`);
            }
          } else {
            console.log(`   ❌ FAILED: Status ${status}`);
            console.log(`   Message: ${message}`);
            console.log(`   Full Response:`, error.response.data);
          }
        } else {
          console.log(`   ❌ Network Error:`, error.message);
        }
      }
    }
    
    // Test with the exact user ID from the error
    console.log('\n\n🎯 Testing with exact user ID from error: ' + TEST_USER_ID);
    
    try {
      const response = await axios.post(
        `${BASE_URL}/api/users/${TEST_USER_ID}/reviews`,
        {
          rating: 5,
          reviewText: 'This is a test review with sufficient characters for validation'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Success!', response.data);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Error ${error.response.status}:`, error.response.data);
        
        // Detailed debugging
        console.log('\n🔍 Debugging Information:');
        console.log('Request Headers:', error.config.headers);
        console.log('Request Body:', error.config.data);
        console.log('Response Headers:', error.response.headers);
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSubmitReview();
