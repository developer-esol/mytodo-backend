// Check payment data for the task
const mongoose = require('mongoose');

async function checkPayments() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check payment status for our test task
    const taskId = '68c11241cf90217bcd4466e1';
    console.log(`🔍 Checking payments for task: ${taskId}`);
    
    const payments = await db.collection('payments').find({ taskId: taskId }).toArray();
    console.log(`📊 Found ${payments.length} payments for this task:`);
    
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment._id}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ${payment.amount} ${payment.currency}`);
      console.log(`   Created: ${payment.createdAt}`);
      console.log('');
    });

    // Check all payment statuses
    console.log('\n📋 All payment statuses in database:');
    const statuses = await db.collection('payments').distinct('status');
    console.log('Available statuses:', statuses);

    for (const status of statuses) {
      const count = await db.collection('payments').countDocuments({ status: status });
      console.log(`- ${status}: ${count} payments`);
    }

    // Check if there are any "completed" payments
    const completedPayments = await db.collection('payments').find({ status: 'completed' }).toArray();
    console.log(`\n✅ Found ${completedPayments.length} completed payments`);

    if (completedPayments.length > 0) {
      completedPayments.forEach((payment, index) => {
        console.log(`${index + 1}. Task: ${payment.taskId}, Amount: ${payment.amount}`);
      });
    }

    // Check which tasks have payments that could be candidates for receipts
    console.log('\n🔍 Checking task-payment relationships:');
    const completedTasks = await db.collection('tasks').find({ status: 'completed' }).toArray();
    
    for (const task of completedTasks) {
      const taskPayments = await db.collection('payments').find({ taskId: task._id }).toArray();
      console.log(`Task ${task._id} (${task.title}): ${taskPayments.length} payments`);
      
      if (taskPayments.length > 0) {
        taskPayments.forEach(payment => {
          console.log(`  - Payment status: ${payment.status}, Amount: ${payment.amount}`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

checkPayments().catch(console.error);