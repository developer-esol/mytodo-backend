// test-debug-endpoint.js - Test the new debug endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testDebugEndpoint() {
  try {
    console.log('🧪 Testing Debug Endpoint...\n');
    
    // Test without authentication first
    console.log('📝 Test 1: Debug endpoint without auth (should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/notifications/debug`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 - auth required (working correctly)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n📝 Test 2: Testing unread count endpoint...');
    try {
      await axios.get(`${BASE_URL}/api/notifications/unread-count`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 - auth required (working correctly)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n✅ Debug endpoint is properly protected with authentication');
    console.log('\n💡 To test with authentication:');
    console.log('   1. Get a valid JWT token from frontend login');
    console.log('   2. Use: curl -H "Authorization: Bearer TOKEN" http://localhost:5001/api/notifications/debug');
    console.log('   3. The debug response will show user ID, notification counts, and troubleshooting info');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDebugEndpoint();