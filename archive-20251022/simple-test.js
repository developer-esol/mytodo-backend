const axios = require('axios');

async function testWithoutFiles() {
    console.log('Testing upload endpoint without files to isolate the issue...\n');
    
    try {
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:5001/api/group-chats/68e764a59d20929e97a0687e/upload-images',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyNDU5NzB9.kOsPI0MWCN8KO4GGrywy5YV6UVP-zBKcpJSYkCCYFG0',
                'Content-Type': 'application/json'
            },
            data: {
                text: 'Test message'
            },
            timeout: 5000,
            validateStatus: () => true
        });

        console.log('Response received:');
        console.log('Status Code:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', response.headers);
        console.log('Data:', response.data);
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('Connection refused - server not running');
        } else if (error.code === 'ECONNRESET') {
            console.log('Connection reset - server closed connection');
        } else {
            console.log('Error type:', error.constructor.name);
            console.log('Error message:', error.message);
            console.log('Error code:', error.code);
            if (error.response) {
                console.log('Response status:', error.response.status);
                console.log('Response data:', error.response.data);
            }
        }
    }
}

testWithoutFiles();