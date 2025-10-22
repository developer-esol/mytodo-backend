// Direct test of the receipt controller function to verify fixes
const mongoose = require('mongoose');
const { getTaskReceipts } = require('./controllers/receiptController');

// Connect to MongoDB directly
async function testReceiptControllerDirectly() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    // Mock request and response objects
    const createMockReqRes = (taskId, userId) => {
      const req = {
        user: { _id: userId },
        params: { taskId: taskId }
      };
      
      const res = {
        statusCode: null,
        responseData: null,
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.responseData = data;
          return this;
        }
      };
      
      return { req, res };
    };

    // Test the problematic tasks
    const problemTasks = [
      '68c11241cf90217bcd4466e1',
      '68c1208ecf90217bcd4467f9'
    ];
    
    const testUserId = '68d295e638cbeb79a7d7cf8e'; // User from the token

    for (const taskId of problemTasks) {
      console.log(`\n🧪 Testing task: ${taskId}`);
      
      const { req, res } = createMockReqRes(taskId, testUserId);
      
      await getTaskReceipts(req, res);
      
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📄 Response:`, JSON.stringify(res.responseData, null, 2));
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

testReceiptControllerDirectly().catch(console.error);