// test-chat-upload.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Test configuration
const BASE_URL = 'http://localhost:5001';
const TEST_TASK_ID = '68ec427627103953db814a42'; // Use existing task ID
const TEST_USER_ID = '68d295e638cbeb79a7d7cf8e';
const TEST_USER_NAME = 'Test User';

// JWT token for authentication
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]NzAwOTA3NH0.Qg3Lf5-J2aEhCy2gKEiglABcJhgN2s8aqR1oQZTDWZo';

// Create test files for upload
function createTestFiles() {
  const testDir = path.join(__dirname, 'test-uploads');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create a test text file
  const textFilePath = path.join(testDir, 'test-document.txt');
  if (!fs.existsSync(textFilePath)) {
    fs.writeFileSync(textFilePath, 'This is a test document for chat upload functionality.');
  }
  
  // Create a test image file (base64 encoded small PNG)
  const imageFilePath = path.join(testDir, 'test-image.png');
  if (!fs.existsSync(imageFilePath)) {
    // Simple 1x1 PNG file
    const pngBuffer = Buffer.from('[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]AABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(imageFilePath, pngBuffer);
  }
  
  return {
    textFile: textFilePath,
    imageFile: imageFilePath
  };
}

// Test functions
async function testSendTextMessage() {
  console.log('\n=== Testing Text Message ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/chats/${TEST_TASK_ID}/messages`, {
      text: 'Hello, this is a test message!',
      senderId: TEST_USER_ID,
      senderName: TEST_USER_NAME
    });
    
    console.log('✅ Text message sent successfully');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Text message failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSingleFileUpload(filePath, fileType) {
  console.log(`\n=== Testing Single File Upload (${fileType}) ===`);
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('senderId', TEST_USER_ID);
    formData.append('senderName', TEST_USER_NAME);
    formData.append('text', `Uploading a test ${fileType}`);
    
    const response = await axios.post(
      `${BASE_URL}/api/chats/${TEST_TASK_ID}/upload-single`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    console.log('✅ Single file upload successful');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Single file upload failed:`, error.response?.data || error.message);
    return null;
  }
}

async function testMultipleFileUpload(filePaths) {
  console.log('\n=== Testing Multiple File Upload ===');
  try {
    const formData = new FormData();
    
    filePaths.forEach((filePath, index) => {
      formData.append('files', fs.createReadStream(filePath));
    });
    
    formData.append('senderId', TEST_USER_ID);
    formData.append('senderName', TEST_USER_NAME);
    formData.append('text', 'Uploading multiple test files');
    
    const response = await axios.post(
      `${BASE_URL}/api/chats/${TEST_TASK_ID}/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    console.log('✅ Multiple file upload successful');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Multiple file upload failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetMessages() {
  console.log('\n=== Testing Get Messages ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/chats/${TEST_TASK_ID}/messages`);
    
    console.log('✅ Messages retrieved successfully');
    console.log(`Found ${response.data.length} messages`);
    
    // Show recent messages with file info
    response.data.slice(-5).forEach((msg, index) => {
      console.log(`Message ${index + 1}:`);
      console.log(`  - Type: ${msg.messageType}`);
      console.log(`  - Text: ${msg.text}`);
      console.log(`  - Sender: ${msg.senderName}`);
      console.log(`  - Has attachments: ${msg.hasAttachments}`);
      if (msg.attachments && msg.attachments.length > 0) {
        console.log(`  - Attachments:`);
        msg.attachments.forEach((att, attIndex) => {
          console.log(`    ${attIndex + 1}. ${att.originalName} (${att.fileType}) - ${att.fileSize} bytes`);
        });
      }
      console.log(`  - Timestamp: ${msg.timestamp}`);
      console.log('');
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Get messages failed:', error.response?.data || error.message);
    return null;
  }
}

async function testChatStats() {
  console.log('\n=== Testing Chat Stats ===');
  try {
    const response = await axios.get(`${BASE_URL}/api/chats/${TEST_TASK_ID}/stats`);
    
    console.log('✅ Chat stats retrieved successfully');
    console.log('Stats:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get chat stats failed:', error.response?.data || error.message);
    return null;
  }
}

async function testInvalidFileUpload() {
  console.log('\n=== Testing Invalid File Upload ===');
  try {
    // Create a fake executable file
    const testDir = path.join(__dirname, 'test-uploads');
    const invalidFilePath = path.join(testDir, 'test.exe');
    fs.writeFileSync(invalidFilePath, 'fake executable content');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(invalidFilePath));
    formData.append('senderId', TEST_USER_ID);
    formData.append('senderName', TEST_USER_NAME);
    
    const response = await axios.post(
      `${BASE_URL}/api/chats/${TEST_TASK_ID}/upload-single`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    console.log('❌ Invalid file upload should have failed but succeeded');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Invalid file upload correctly rejected');
      console.log('Error:', error.response.data.error);
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
    
    // Clean up
    const testDir = path.join(__dirname, 'test-uploads');
    const invalidFilePath = path.join(testDir, 'test.exe');
    if (fs.existsSync(invalidFilePath)) {
      fs.unlinkSync(invalidFilePath);
    }
  }
}

async function testDatabaseIntegration() {
  console.log('\n=== Testing Database Integration ===');
  try {
    // Connect to MongoDB to verify data
    await mongoose.connect('mongodb://localhost:27017/mytodo');
    console.log('Connected to MongoDB');
    
    const Message = require('./models/Message');
    
    // Find messages for our test task
    const messages = await Message.find({ 
      taskId: new mongoose.Types.ObjectId(TEST_TASK_ID) 
    }).sort({ timestamp: -1 }).limit(10);
    
    console.log(`✅ Found ${messages.length} messages in MongoDB for task ${TEST_TASK_ID}`);
    
    messages.forEach((msg, index) => {
      console.log(`MongoDB Message ${index + 1}:`);
      console.log(`  - ID: ${msg._id}`);
      console.log(`  - Type: ${msg.messageType}`);
      console.log(`  - Text: ${msg.text}`);
      console.log(`  - Sender: ${msg.senderName} (${msg.senderId})`);
      console.log(`  - Attachments: ${msg.attachments.length}`);
      console.log(`  - Firebase ID: ${msg.firebaseId || 'Not synced'}`);
      console.log(`  - Synced: ${msg.syncedToFirebase}`);
      console.log(`  - Timestamp: ${msg.timestamp}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    return messages;
  } catch (error) {
    console.error('❌ Database integration test failed:', error.message);
    return null;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Chat Upload API Tests');
  console.log(`Testing with Task ID: ${TEST_TASK_ID}`);
  console.log(`Testing with User ID: ${TEST_USER_ID}`);
  
  // Create test files
  const testFiles = createTestFiles();
  console.log('📁 Test files created');
  
  const results = {
    textMessage: null,
    singleTextFile: null,
    singleImageFile: null,
    multipleFiles: null,
    getMessages: null,
    chatStats: null,
    invalidFile: null,
    database: null
  };
  
  // Wait a bit between tests
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Run tests
  results.textMessage = await testSendTextMessage();
  await delay(1000);
  
  results.singleTextFile = await testSingleFileUpload(testFiles.textFile, 'text file');
  await delay(1000);
  
  results.singleImageFile = await testSingleFileUpload(testFiles.imageFile, 'image file');
  await delay(1000);
  
  results.multipleFiles = await testMultipleFileUpload([testFiles.textFile, testFiles.imageFile]);
  await delay(1000);
  
  results.getMessages = await testGetMessages();
  await delay(1000);
  
  results.chatStats = await testChatStats();
  await delay(1000);
  
  results.invalidFile = await testInvalidFileUpload();
  await delay(1000);
  
  results.database = await testDatabaseIntegration();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  const passedTests = Object.values(results).filter(result => result !== null).length;
  const totalTests = Object.keys(results).length;
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Chat upload API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
  
  // Cleanup
  const testDir = path.join(__dirname, 'test-uploads');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('🧹 Test files cleaned up');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testSendTextMessage,
  testSingleFileUpload,
  testMultipleFileUpload,
  testGetMessages,
  testChatStats,
  testDatabaseIntegration
};