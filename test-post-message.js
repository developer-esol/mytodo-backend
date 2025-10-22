const axios = require('axios');

async function testPostMessage() {
  try {
    console.log('🔄 Starting login...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'janidu.effectivesolutions@gmail.com',
      password: 'Janidu@123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');

    console.log('🔄 Sending POST message to Firebase route...');
    // Test POST message to Firebase route (the one that was having 403 errors)
    const messageResponse = await axios.post(
      'http://localhost:5001/api/firebase/group-chats/68e764a59d20929e97a0687e/messages',
      {
        message: 'Hello from authenticated user via Firebase route!',
        messageType: 'text'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ POST Message Success:', {
      status: messageResponse.status,
      messageId: messageResponse.data.messageId || 'No message ID',
      success: messageResponse.data.success,
      response: messageResponse.data
    });

  } catch (error) {
    console.log('❌ Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      fullError: error.code || 'Unknown error',
      url: error.config?.url || 'Unknown URL'
    });
  }
}

testPostMessage();