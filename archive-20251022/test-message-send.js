const axios = require('axios');

// Test sending a message to the group chat
async function testSendMessage() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]eHAiOjE3NjAyNTI1MTB9.gm_[REDACTED_AWS_SECRET_ACCESS_KEY]';
    const taskId = '68e764a59d20929e97a0687e';
    
    console.log('🧪 Testing message send endpoint...');
    console.log('URL:', `http://localhost:5001/api/group-chats/${taskId}/messages`);
    console.log('Token length:', token.length);
    
    const response = await axios.post(
      `http://localhost:5001/api/group-chats/${taskId}/messages`,
      {
        text: 'Test message from debug script',
        messageType: 'text'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('✅ Message sent successfully!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Error sending message:');
    console.error('Full error object:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('Stack:', error.stack);
  }
}

testSendMessage();