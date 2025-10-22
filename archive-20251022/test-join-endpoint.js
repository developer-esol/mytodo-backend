// Test script for the new /join endpoint
const axios = require('axios');

async function testJoinEndpoint() {
  try {
    console.log('Testing the /join endpoint...');
    
    // Test with a user who has made an offer (from the logs: kasun user with ID 68d295e638cbeb79a7d7cf8e)
    // They made an offer on task 68eb385d8e68b13383514220
    
    const taskId = '68eb385d8e68b13383514220'; // Task from logs
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]eHAiOjE3NjAyNDk1MjV9'; // kasun's token from logs
    
    const response = await axios.post(`http://localhost:5001/api/group-chats/${taskId}/join`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS! Join endpoint works:');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ ERROR:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data?.message || 'No message');
      console.log('Full error data:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testJoinEndpoint();