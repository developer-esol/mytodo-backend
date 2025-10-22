// Test to reproduce the exact image upload error
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Use the same token format from the error logs
const testToken = '[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]OWEiLCJ0eXAiOiJKV1QifQ.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]dmlkZXIiOiJwYXNzd29yZCJ9fQ.MF1Yq3ozO5zxAUmZpJL9y1FwGAdHkUSq8VC_CKP1e8Dn0FePOGPjPnvKkFBF1-BZxs5sJ3xQhCx6MP4kEuCdLCHvIdxBnBFfFdS_IxzUyUXTnz7oQrP-BNGOuEX5Cp5JJR1Yi_EWQCg56Rh1QoF2Ig6HVBGP5tiqod-f3MLO4gC5v4QV1mOOAMmbh3B3A_[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]s-[REDACTED_AWS_SECRET_ACCESS_KEY]THk8YAASLM3yqj1CrBcglbWlNGg4gA';

async function testImageUpload() {
  try {
    // Create a simple test image file
    const testImageContent = Buffer.from('test image data');
    const tempImagePath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(tempImagePath, testImageContent);

    console.log('Testing image upload to non-existent task...');
    
    const form = new FormData();
    form.append('images', fs.createReadStream(tempImagePath));
    form.append('text', 'Test image upload');

    const response = await axios.post(
      'http://localhost:5001/api/group-chats/68e764a59d20929e97a0687e/upload-images',
      form,
      {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          ...form.getHeaders()
        }
      }
    );

    console.log('Unexpected success:', response.data);

  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', error.response?.data);
    
    if (error.response?.status === 403) {
      console.log('❌ Got 403 - this is the bug we need to fix');
      console.log('Expected: 404 Task not found');
      console.log('Actual:', error.response.data.message);
    } else if (error.response?.status === 404) {
      console.log('✅ Got 404 - this would be correct');
    }
  } finally {
    // Clean up test file
    try {
      const tempImagePath = path.join(__dirname, 'test-image.jpg');
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    } catch (e) {}
  }
}

testImageUpload();