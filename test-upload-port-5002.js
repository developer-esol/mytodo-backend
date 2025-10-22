const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUploadOnPort5002() {
  try {
    console.log('🔍 Testing files[] field name upload on port 5002...');
    
    // Test basic connectivity first
    console.log('Testing server connectivity...');
    const healthResponse = await axios.get('http://localhost:5002/');
    console.log('✅ Server connected:', healthResponse.data);
    
    // Create test file
    const testContent = 'This is a test file for files[] field upload on port 5002';
    fs.writeFileSync('test-files-array-5002.txt', testContent);
    
    const form = new FormData();
    form.append('files[]', fs.createReadStream('test-files-array-5002.txt'));
    form.append('senderId', '68bba9aa738031d9bcf0bdf3');
    form.append('senderName', 'Test User');
    form.append('text', 'Test message with files[] field on port 5002');
    
    console.log('Attempting file upload...');
    const response = await axios.post(
      'http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer test-token' // Simple test token
        }
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('Response:', response.data);
    
    // Clean up
    fs.unlinkSync('test-files-array-5002.txt');
    
  } catch (error) {
    console.log('❌ Upload failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Message:', error.message);
    
    // Clean up even on error
    try {
      fs.unlinkSync('test-files-array-5002.txt');
    } catch(e) {}
  }
}

testUploadOnPort5002();