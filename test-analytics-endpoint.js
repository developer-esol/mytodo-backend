// Test the analytics endpoint implementation
const axios = require('axios');

const testAnalyticsEndpoint = async () => {
  try {
    console.log('🔍 Testing Analytics Endpoint...');
    
    const response = await axios.get('http://localhost:5001/api/admin/analytics?timeRange=30d', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAzODA4Mzd9.[REDACTED_AWS_SECRET_ACCESS_KEY]zxE',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Analytics endpoint response:', response.status);
    console.log('📊 Response data keys:', Object.keys(response.data));
    
    if (response.data.revenue) {
      console.log('💰 Revenue data found:', Object.keys(response.data.revenue));
    }
    
    if (response.data.users) {
      console.log('👥 User data found:', Object.keys(response.data.users));
    }
    
    if (response.data.tasks) {
      console.log('📋 Task data found:', Object.keys(response.data.tasks));
    }
    
    console.log('🎯 Analytics endpoint test completed successfully!');
    
  } catch (error) {
    console.error('❌ Analytics endpoint test failed:');
    console.error('Full error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
};

testAnalyticsEndpoint();