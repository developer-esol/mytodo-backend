const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testFilesArrayUpload() {
  try {
    console.log('🔍 Testing files[] field name upload...');
    
    // Create test file
    const testContent = 'This is a test file for files[] field upload';
    fs.writeFileSync('test-files-array.txt', testContent);
    
    const form = new FormData();
    form.append('files[]', fs.createReadStream('test-files-array.txt'));
    form.append('senderId', '68bba9aa738031d9bcf0bdf3');
    form.append('senderName', 'Test User');
    form.append('text', 'Test message with files[] field');
    
    const response = await axios.post(
      'http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NjA0ODk0MDh9.mGcnhKjBOgO7c1-lF7-Ai6X1aBp1EhE_iq_XYBJSfSw'
        }
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('Response:', response.data);
    
    // Clean up
    fs.unlinkSync('test-files-array.txt');
    
  } catch (error) {
    console.log('❌ Upload failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Message:', error.message);
    
    // Clean up even on error
    try {
      fs.unlinkSync('test-files-array.txt');
    } catch(e) {}
  }
}

testFilesArrayUpload();