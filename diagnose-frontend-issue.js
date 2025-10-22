const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001/api';

async function diagnoseFrontendIssue() {
  try {
    console.log('🔍 Diagnosing Frontend Review Submission Issue\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    
    // Get two different users
    const users = await User.find().limit(2);
    const reviewer = users[0];
    const reviewee = users[1];
    
    console.log(`👤 Reviewer: ${reviewer.firstName} ${reviewer.lastName} (${reviewer._id})`);
    console.log(`👤 Reviewee: ${reviewee.firstName} ${reviewee.lastName} (${reviewee._id})\n`);
    
    // Generate token
    const token = jwt.sign({ _id: reviewer._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Test cases that match frontend behavior
    const testCases = [
      {
        name: 'Missing reviewText field',
        data: { rating: 5 },
        expectedError: 'Review text must be at least 10 characters'
      },
      {
        name: 'Empty reviewText',
        data: { rating: 5, reviewText: '' },
        expectedError: 'Review text must be at least 10 characters'
      },
      {
        name: 'Whitespace only reviewText',
        data: { rating: 5, reviewText: '   ' },
        expectedError: 'Review text must be at least 10 characters'
      },
      {
        name: 'Short reviewText (9 chars)',
        data: { rating: 5, reviewText: '123456789' },
        expectedError: 'Review text must be at least 10 characters'
      },
      {
        name: 'Valid review (10 chars)',
        data: { rating: 5, reviewText: '1234567890' },
        expectedSuccess: true
      },
      {
        name: 'Valid review with proper text',
        data: { rating: 5, reviewText: 'This is a great review with enough characters!' },
        expectedSuccess: true
      }
    ];
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const testCase of testCases) {
      console.log(`🧪 Test: ${testCase.name}`);
      console.log(`   Data:`, testCase.data);
      
      try {
        const response = await axios.post(
          `${BASE_URL}/users/${reviewee._id}/reviews`,
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
          console.log(`   📝 Review ID: ${response.data.data._id}\n`);
          
          // Delete test review
          const Review = require('./models/Review');
          await Review.findByIdAndDelete(response.data.data._id);
        } else {
          console.log(`   ⚠️  Expected error but got success!\n`);
        }
        
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        
        if (status === 400) {
          if (testCase.expectedError === message) {
            console.log(`   ✅ Got expected 400 error: "${message}"\n`);
          } else {
            console.log(`   ❌ Got 400 but wrong message:`);
            console.log(`      Expected: "${testCase.expectedError}"`);
            console.log(`      Got: "${message}"\n`);
          }
        } else if (status === 409) {
          console.log(`   ⚠️  Conflict (409): "${message}"`);
          console.log(`   💡 This means review already exists\n`);
        } else {
          console.log(`   ❌ Unexpected error ${status}: "${message}"\n`);
        }
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔍 Frontend Checklist:\n');
    console.log('1. ✅ Check that reviewText is being sent in request body');
    console.log('2. ✅ Ensure reviewText is NOT empty or whitespace only');
    console.log('3. ✅ Verify reviewText is at least 10 characters');
    console.log('4. ✅ Check that rating is between 1-5');
    console.log('5. ✅ Confirm Authorization header is set correctly');
    console.log('6. ✅ Verify Content-Type is application/json\n');
    
    console.log('📋 Common Frontend Issues:\n');
    console.log('❌ Sending { comment: "text" } instead of { reviewText: "text" }');
    console.log('❌ Sending undefined or null for reviewText');
    console.log('❌ Not trimming whitespace before validation');
    console.log('❌ Using wrong field name in form state\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

diagnoseFrontendIssue();
