const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    console.log('Testing upload endpoint...');
    
    // First, test if the endpoint exists by making a simple request
    const formData = new FormData();
    formData.append('senderId', '68d295e638cbeb79a7d7cf8e');
    formData.append('senderName', 'Test User');
    formData.append('text', 'Test upload');
    
    // Create a minimal test file
    const testContent = 'This is a test file';
    const testFileName = 'test.txt';
    fs.writeFileSync(testFileName, testContent);
    
    formData.append('files', fs.createReadStream(testFileName));
    
    const response = await axios.post(
      'http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NzAwOTA3NH0.Qg3Lf5-J2aEhCy2gKEiglABcJhgN2s8aqR1oQZTDWZo'
        }
      }
    );
    
    console.log('✅ Upload successful:', response.data);
    
    // Clean up
    fs.unlinkSync(testFileName);
    
  } catch (error) {
    console.error('❌ Upload failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // Clean up
    try {
      fs.unlinkSync('test.txt');
    } catch (e) {}
  }
}

testUpload();