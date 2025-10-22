const axios = require('axios');

async function testBothEndpoints() {
    console.log('=== Comparing Message vs Upload Endpoints ===\n');
    
    const taskId = '68e764a59d20929e97a0687e';
    const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyNDU5NzB9.kOsPI0MWCN8KO4GGrywy5YV6UVP-zBKcpJSYkCCYFG0';
    
    console.log('1. Testing regular message endpoint:');
    try {
        const messageResponse = await axios({
            method: 'POST',
            url: `http://localhost:5001/api/group-chats/${taskId}/messages`,
            headers: { 
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: { text: 'Test message' },
            validateStatus: () => true
        });
        console.log('   Status:', messageResponse.status);
        console.log('   Message:', messageResponse.data.message);
    } catch (error) {
        console.log('   Error:', error.message);
    }
    
    console.log('\n2. Testing upload endpoint (no files):');
    try {
        const uploadResponse = await axios({
            method: 'POST',
            url: `http://localhost:5001/api/group-chats/${taskId}/upload-images`,
            headers: { 
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: { text: 'Test upload' },
            validateStatus: () => true
        });
        console.log('   Status:', uploadResponse.status);
        console.log('   Message:', uploadResponse.data.message);
    } catch (error) {
        console.log('   Error:', error.message);
    }
}

testBothEndpoints();