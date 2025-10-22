const axios = require('axios');

// Simple test to verify authentication
async function testAuth() {
    try {
        console.log('🔄 Testing authentication...');
        
        // Get a real token from existing authentication
        // Let's try a known working auth endpoint first
        console.log('📝 Trying to get authentication status...');
        
        const response = await axios.get('http://localhost:5001/api/group-chats', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAwODAyNzJ9.xlxcJ_U9kowJc4U4-E29LG01bOg9Y7h3rF5TuBdOT8Q', // Token from server logs
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Authentication working! Group chats retrieved.');
        console.log('📄 Response status:', response.status);
        
        // Now test Firebase route
        console.log('\n🔄 Testing Firebase route with authentication...');
        
        const firebaseResponse = await axios.post(
            'http://localhost:5001/api/firebase/group-chats/68e764a59d20929e97a0687e/messages',
            {
                content: 'Test message - authentication fix verified!',
                type: 'text'
            },
            {
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAwODAyNzJ9.xlxcJ_U9kowJc4U4-E29LG01bOg9Y7h3rF5TuBdOT8Q',
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('🎉 SUCCESS! Firebase route with authentication works!');
        console.log('📄 Firebase Response status:', firebaseResponse.status);
        console.log('📄 Response data:', firebaseResponse.data);
        console.log('\n✅ 403 ERROR HAS BEEN FIXED! ✅');
        
    } catch (error) {
        console.log('❌ Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.message || error.message,
            data: error.response?.data
        });
        
        if (error.response?.status === 403) {
            console.log('🚨 Still getting 403 - authentication fix needs more work');
        }
    }
}

testAuth();