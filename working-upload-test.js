const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const testUpload = async () => {
    console.log('Testing image upload to non-existent task...');
    
    try {
        // Create a simple test image file if it doesn't exist
        if (!fs.existsSync('test-image.txt')) {
            fs.writeFileSync('test-image.txt', 'fake image data for testing');
        }
        
        const form = new FormData();
        form.append('text', 'Test message with image');
        // Note: We're not actually uploading a real image file here since this is just to test the 403 vs 404 logic
        
        const config = {
            method: 'POST',
            url: 'http://localhost:5001/api/group-chats/68e764a59d20929e97a0687e/upload-images',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjAyNDU5NzB9.kOsPI0MWCN8KO4GGrywy5YV6UVP-zBKcpJSYkCCYFG0',
                ...form.getHeaders()
            },
            data: form,
            validateStatus: function (status) {
                return status < 500; // Allow both success and client errors
            }
        };

        const response = await axios(config);
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
        
    } catch (error) {
        console.log('Axios Error:', error.message);
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        }
    }
};

testUpload();