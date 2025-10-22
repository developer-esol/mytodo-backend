const axios = require('axios');

async function verifyUploadFix() {
    console.log('🧪 Testing image upload endpoint fix...\n');
    
    try {
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:5001/api/group-chats/68e764a59d20929e97a0687e/upload-images',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyNDU5NzB9.kOsPI0MWCN8KO4GGrywy5YV6UVP-zBKcpJSYkCCYFG0'
            },
            timeout: 5000,
            validateStatus: () => true // Accept all status codes
        });

        console.log('✅ Response received:');
        console.log('Status:', response.status);
        console.log('Message:', response.data?.message || response.data);
        
        if (response.status === 404) {
            console.log('\n🎉 SUCCESS! Upload endpoint now correctly returns 404 for non-existent tasks');
            console.log('✅ Fix verified - validation order has been corrected');
        } else if (response.status === 400) {
            console.log('\n❌ ISSUE: Still returning 400 instead of 404');
            console.log('The fix may not have been applied correctly');
        } else {
            console.log('\n⚠️  Unexpected status code:', response.status);
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server not running on port 5001');
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

verifyUploadFix();