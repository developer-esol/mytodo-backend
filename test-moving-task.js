// Test script for moving task functionality (mobile-specific)
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test authentication token - replace with a valid token
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyOTc0fQ.Dc4ZZaGo9iLULUNGy-TW3WrQiX8iMSCFa3HfnfDBhz0';

async function testMovingTaskCreation() {
  try {
    console.log('🚛 Testing Moving Task Creation...\n');

    // Test data for a moving task
    const movingTaskData = {
      title: 'Moving couch from apartment to new house',
      category: 'moving',
      dateType: 'DoneBy',
      date: '2025-10-20',
      time: 'morning',
      location: 'General moving service',
      details: 'Need help moving a large couch from my current apartment to my new house. Couch is heavy and requires 2-3 people.',
      budget: 150,
      currency: 'USD',
      // Moving-specific fields
      isMovingTask: true,
      pickupLocation: 'Downtown Apartment Complex',
      pickupPostalCode: '12345',
      dropoffLocation: 'Suburban House',
      dropoffPostalCode: '67890'
    };

    console.log('📱 Simulating mobile app request...');
    console.log('Request data:', JSON.stringify(movingTaskData, null, 2));

    const response = await axios.post(`${BASE_URL}/tasks`, movingTaskData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MyToDoo-Mobile/1.0.0', // Mobile app identifier
        'X-Platform': 'mobile' // Additional mobile platform header
      }
    });

    if (response.data.success) {
      console.log('\n✅ Moving task created successfully!');
      console.log('Task ID:', response.data.data._id);
      console.log('Title:', response.data.data.title);
      console.log('Is Moving Task:', response.data.data.isMovingTask);
      
      if (response.data.data.movingDetails) {
        console.log('\n🏠 Moving Details:');
        console.log('📍 Pickup:', response.data.data.movingDetails.pickupLocation);
        console.log('📮 Pickup Postal Code:', response.data.data.movingDetails.pickupLocation.postalCode);
        console.log('📍 Dropoff:', response.data.data.movingDetails.dropoffLocation);
        console.log('📮 Dropoff Postal Code:', response.data.data.movingDetails.dropoffLocation.postalCode);
      }

      // Test retrieving the task
      console.log('\n📖 Testing task retrieval...');
      const getResponse = await axios.get(`${BASE_URL}/tasks/${response.data.data._id}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });

      if (getResponse.data.success) {
        console.log('✅ Task retrieved successfully');
        if (getResponse.data.data.movingDetails) {
          console.log('✅ Moving details preserved in database');
        } else {
          console.log('❌ Moving details not found in retrieved task');
        }
      }

    } else {
      console.log('❌ Failed to create moving task');
      console.log('Error:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Error testing moving task:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testNormalTaskFromMobile() {
  try {
    console.log('\n📱 Testing normal task from mobile (should work normally)...\n');

    const normalTaskData = {
      title: 'Clean the house',
      category: 'cleaning',
      dateType: 'Easy',
      time: 'anytime',
      location: 'My house',
      details: 'Need someone to clean the entire house',
      budget: 100,
      currency: 'USD'
      // No moving-specific fields
    };

    const response = await axios.post(`${BASE_URL}/tasks`, normalTaskData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MyToDoo-Mobile/1.0.0',
        'X-Platform': 'mobile'
      }
    });

    if (response.data.success) {
      console.log('✅ Normal task from mobile created successfully');
      console.log('Is Moving Task:', response.data.data.isMovingTask || false);
    }

  } catch (error) {
    console.error('❌ Error creating normal task from mobile:', error.response?.data || error.message);
  }
}

async function testMovingTaskFromWeb() {
  try {
    console.log('\n🖥️ Testing moving task from web (should ignore moving fields)...\n');

    const movingTaskData = {
      title: 'Moving task from web',
      category: 'moving',
      dateType: 'Easy',
      time: 'anytime',
      location: 'Web location',
      details: 'This should not have moving details even if provided',
      budget: 75,
      currency: 'USD',
      // These should be ignored since it's not from mobile
      isMovingTask: true,
      pickupLocation: 'Should be ignored',
      pickupPostalCode: '11111',
      dropoffLocation: 'Should be ignored',
      dropoffPostalCode: '22222'
    };

    const response = await axios.post(`${BASE_URL}/tasks`, movingTaskData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Web Browser)', // Web browser identifier
        // No X-Platform header
      }
    });

    if (response.data.success) {
      console.log('✅ Task from web created successfully');
      console.log('Is Moving Task:', response.data.data.isMovingTask || false);
      if (response.data.data.movingDetails) {
        console.log('❌ Moving details should not be present for web requests');
      } else {
        console.log('✅ Moving details correctly ignored for web requests');
      }
    }

  } catch (error) {
    console.error('❌ Error creating task from web:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting Moving Task Tests\n');
  console.log('=' .repeat(50));
  
  await testMovingTaskCreation();
  await testNormalTaskFromMobile();
  await testMovingTaskFromWeb();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests completed');
}

runTests();