// test-notification-api.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testNotificationAPI() {
  try {
    console.log('🚀 Testing Notification API endpoints...\n');

    // Test 1: Test webhook endpoint (no auth required)
    console.log('📝 Test 1: Testing webhook endpoint...');
    try {
      const webhookResponse = await axios.post(`${BASE_URL}/api/notifications/webhook`, {
        userId: '68bba9aa738031d9bcf0bdf3', // Replace with actual user ID
        type: 'SYSTEM_UPDATE',
        title: 'API Test Notification',
        message: 'This is a test notification from the API webhook endpoint.',
        priority: 'NORMAL',
        actionUrl: '/dashboard'
      });
      
      console.log('✅ Webhook test successful:', webhookResponse.data.message);
    } catch (error) {
      console.log('❌ Webhook test failed:', error.response?.data || error.message);
    }

    // Test 2: Test notification retrieval (requires auth)
    console.log('\n📝 Test 2: Testing notification retrieval (will fail without auth token)...');
    try {
      const notificationsResponse = await axios.get(`${BASE_URL}/api/notifications`);
      console.log('✅ Notifications retrieved:', notificationsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 unauthorized (auth working correctly)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 3: Test unread count endpoint (requires auth)
    console.log('\n📝 Test 3: Testing unread count endpoint...');
    try {
      const unreadResponse = await axios.get(`${BASE_URL}/api/notifications/unread-count`);
      console.log('✅ Unread count retrieved:', unreadResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 unauthorized (auth working correctly)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 API endpoint tests completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Use real Firebase auth token to test authenticated endpoints');
    console.log('   2. Test notification creation through task/offer flows');
    console.log('   3. Integrate with frontend application');
    console.log('   4. Set up real-time websocket notifications');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the test
testNotificationAPI();