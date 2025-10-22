// Test with proper user access to verify the full fix
const mongoose = require('mongoose');
const { getTaskReceipts } = require('./controllers/receiptController');

async function testWithProperAccess() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    // First, let's find a task that our test user has access to
    const Task = require('./models/Task');
    const testUserId = '68d295e638cbeb79a7d7cf8e';
    
    console.log(`🔍 Finding tasks for user: ${testUserId}`);
    
    const userTasks = await Task.find({
      $or: [
        { createdBy: testUserId },
        { assignedTo: testUserId }
      ],
      status: 'completed'
    }).limit(2);
    
    console.log(`📋 Found ${userTasks.length} completed tasks for user`);
    
    if (userTasks.length === 0) {
      console.log('⚠️ No completed tasks found for this user');
      return;
    }

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

    // Test each task
    for (const task of userTasks) {
      console.log(`\n🧪 Testing task user has access to: ${task._id}`);
      console.log(`📋 Task: "${task.title}" - Status: ${task.status}`);
      
      const { req, res } = createMockReqRes(task._id.toString(), testUserId);
      
      await getTaskReceipts(req, res);
      
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📄 Response:`, JSON.stringify(res.responseData, null, 2));
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

testWithProperAccess().catch(console.error);