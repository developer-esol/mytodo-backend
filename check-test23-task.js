// Check the specific task from the screenshot "test 23"
const mongoose = require('mongoose');

async function findTest23Task() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    // Load models
    require('./models/User');
    const Task = require('./models/Task');
    const Payment = require('./models/Payment');
    const Receipt = require('./models/Receipt');
    
    // Find task with title containing "test 23"
    console.log('🔍 Looking for task "test 23"...');
    
    const test23Tasks = await Task.find({ 
      title: { $regex: /test 23/i } 
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');
    
    if (test23Tasks.length === 0) {
      console.log('❌ No task found with title containing "test 23"');
      
      // Let's search more broadly
      const allTasks = await Task.find({ 
        title: { $regex: /test/i },
        budget: 56000 // The budget shown in the screenshot
      });
      
      console.log(`🔍 Found ${allTasks.length} test tasks with budget 56000:`);
      allTasks.forEach(task => {
        console.log(`- ${task._id}: "${task.title}" - Budget: ${task.budget} - Status: ${task.status}`);
      });
      
      return;
    }
    
    // Analyze the test 23 task
    const task = test23Tasks[0];
    console.log('\n📋 Test 23 Task Details:');
    console.log(`- ID: ${task._id}`);
    console.log(`- Title: ${task.title}`);
    console.log(`- Budget: Rs. ${task.budget}`);
    console.log(`- Status: ${task.status}`);
    console.log(`- Created by: ${task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'Unknown'}`);
    console.log(`- Assigned to: ${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Not assigned'}`);
    
    // Check payments for this task
    const payments = await Payment.find({ task: task._id })
      .populate('user', 'firstName lastName email')
      .populate('tasker', 'firstName lastName email');
    
    console.log(`\n💳 Payments for test 23 task: ${payments.length}`);
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment._id} - ${payment.amount} ${payment.currency} - Status: ${payment.status}`);
      console.log(`   Poster: ${payment.user.firstName} ${payment.user.lastName}`);
      console.log(`   Tasker: ${payment.tasker.firstName} ${payment.tasker.lastName}`);
    });
    
    // Check receipts for this task
    const receipts = await Receipt.find({ task: task._id });
    console.log(`\n🧾 Receipts for test 23 task: ${receipts.length}`);
    receipts.forEach((receipt, index) => {
      console.log(`${index + 1}. ${receipt.receiptNumber} - Type: ${receipt.receiptType} - Status: ${receipt.status}`);
    });
    
    // Test the API for this task with the poster's perspective
    if (task.createdBy) {
      console.log(`\n🧪 Testing API for poster (${task.createdBy.firstName}):`);
      
      // Simulate the receipt API call
      const { getTaskReceipts } = require('./controllers/receiptController');
      
      const req = {
        user: { _id: task.createdBy._id },
        params: { taskId: task._id.toString() }
      };
      
      const res = {
        statusCode: null,
        responseData: null,
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.responseData = data; return this; }
      };
      
      await getTaskReceipts(req, res);
      
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response:`, JSON.stringify(res.responseData, null, 2));
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

findTest23Task().catch(console.error);