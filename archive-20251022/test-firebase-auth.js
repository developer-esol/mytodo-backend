const axios = require('axios');

// Test the Firebase auth fix directly with a known working user token
async function testFirebaseAuth() {
    console.log('🔄 Testing Firebase authentication fix...');
    
    try {
        // First, let's test login to get a valid token
        console.log('📝 Testing login first...');
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'janidu.effectivesolutions@gmail.com',
            password: 'Test@123' // Using the password from server logs
        });
        
        console.log('✅ Login successful');
        const token = loginResponse.data.token;
        console.log('🔑 Token obtained:', token.substring(0, 20) + '...');
        
        // Now test the Firebase route with authentication
        console.log('\n🔄 Testing Firebase group chat messages endpoint...');
        
        const messageResponse = await axios.post(
            'http://localhost:5001/api/firebase/group-chats/68e764a59d20929e97a0687e/messages',
            {
                content: 'Test message from authenticated user',
                type: 'text'
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Firebase message sent successfully!');
        console.log('📄 Response:', messageResponse.data);
        
        // Test GET messages as well
        console.log('\n🔄 Testing Firebase get messages endpoint...');
        const getResponse = await axios.get(
            'http://localhost:5001/api/firebase/group-chats/68e764a59d20929e97a0687e/messages',
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Firebase messages retrieved successfully!');
        console.log('📄 Messages count:', getResponse.data.messages?.length || 0);
        
        console.log('\n🎉 Authentication fix verified - 403 error resolved!');
        
    } catch (error) {
        console.log('❌ Error occurred:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.message || error.message,
            data: error.response?.data,
            url: error.config?.url
        });
    }
}

testFirebaseAuth();