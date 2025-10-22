const axios = require('axios');

const testUpload = async () => {
    console.log('Testing image upload to non-existent task with valid auth...');
    
    try {
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:5001/api/group-chats/68e764a59d20929e97a0687e/upload-images',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyNDU5NzB9.kOsPI0MWCN8KO4GGrywy5YV6UVP-zBKcpJSYkCCYFG0',
                'Content-Type': 'multipart/form-data',
            },
            data: {
                text: 'Test message'
            }
        });

        console.log('Response:', response.status, response.data);
    } catch (error) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Message:', error.response?.data?.message);
        console.log('Error Data:', error.response?.data);
    }
};

testUpload();