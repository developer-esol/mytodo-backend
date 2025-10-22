const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

async function testUploadEndpoint() {
    console.log('=== Testing Upload Endpoint Error Handling ===\n');
    
    // Create a small test file
    const testContent = 'test image content';
    fs.writeFileSync('test.txt', testContent);
    
    const form = new FormData();
    form.append('images', fs.createReadStream('test.txt'));
    form.append('text', 'Test upload message');
    
    try {
        const response = await axios({
            method: 'POST',
            url: 'http://localhost:5001/api/group-chats/68e764a59d20929e97a0687e/upload-images',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyNDU5NzB9.kOsPI0MWCN8KO4GGrywy5YV6UVP-zBKcpJSYkCCYFG0',
                ...form.getHeaders()
            },
            data: form,
            validateStatus: () => true // Accept all status codes
        });

        console.log('Status Code:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Expected: 404 for non-existent task
        // Actual: Let's see what we get
        
    } catch (error) {
        console.log('Request failed:', error.message);
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        }
    } finally {
        // Cleanup
        if (fs.existsSync('test.txt')) {
            fs.unlinkSync('test.txt');
        }
    }
}

testUploadEndpoint();