// Check user role in the task to understand why they're only seeing earnings receipt
const mongoose = require('mongoose');

async function checkUserRoleInTask() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    // Load all required models
    require('./models/User'); // Load User model first
    const Task = require('./models/Task');
    const Payment = require('./models/Payment');
    const Receipt = require('./models/Receipt');
    
    const taskId = '68d8cc18c1ef842d1f3006c1';
    const userId = '68d295e638cbeb79a7d7cf8e';
    
    console.log(`🔍 Analyzing task ${taskId} and user ${userId} roles`);
    
    // Get task details
    const task = await Task.findById(taskId)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    console.log('\n📋 Task Details:');
    console.log(`- Title: ${task.title}`);
    console.log(`- Created by: ${task.createdBy.firstName} ${task.createdBy.lastName} (${task.createdBy._id})`);
    console.log(`- Assigned to: ${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName} (${task.assignedTo._id})` : 'Not assigned'}`);
    console.log(`- Status: ${task.status}`);
    
    // Get payment details
    const payments = await Payment.find({ task: taskId })
      .populate('user', 'firstName lastName email')
      .populate('tasker', 'firstName lastName email');
    
    console.log('\n💳 Payment Details:');
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ${payment._id}:`);
      console.log(`   - Amount: ${payment.amount} ${payment.currency}`);
      console.log(`   - Status: ${payment.status}`);
      console.log(`   - User (Poster): ${payment.user.firstName} ${payment.user.lastName} (${payment.user._id})`);
      console.log(`   - Tasker: ${payment.tasker.firstName} ${payment.tasker.lastName} (${payment.tasker._id})`);
    });
    
    // Get all receipts
    const receipts = await Receipt.find({ task: taskId })
      .populate('poster', 'firstName lastName email')
      .populate('tasker', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    console.log('\n🧾 Receipt Details:');
    receipts.forEach((receipt, index) => {
      console.log(`${index + 1}. Receipt ${receipt.receiptNumber}:`);
      console.log(`   - Type: ${receipt.receiptType}`);
      console.log(`   - Poster: ${receipt.poster.firstName} ${receipt.poster.lastName} (${receipt.poster._id})`);
      console.log(`   - Tasker: ${receipt.tasker.firstName} ${receipt.tasker.lastName} (${receipt.tasker._id})`);
      console.log(`   - Amount: ${receipt.receiptType === 'payment' ? receipt.financial.totalPaid : receipt.financial.amountReceived} ${receipt.financial.currency}`);
    });
    
    // Analyze user role
    console.log(`\n🎭 User Role Analysis for ${userId}:`);
    const isPoster = task.createdBy._id.toString() === userId.toString();
    const isTasker = task.assignedTo._id.toString() === userId.toString();
    const isPaymentUser = payments.some(p => p.user._id.toString() === userId.toString());
    const isPaymentTasker = payments.some(p => p.tasker._id.toString() === userId.toString());
    
    console.log(`- Is task creator (poster): ${isPoster}`);
    console.log(`- Is assigned tasker: ${isTasker}`);
    console.log(`- Is payment user (who paid): ${isPaymentUser}`);
    console.log(`- Is payment tasker (who earned): ${isPaymentTasker}`);
    
    // Check which receipts the user should see
    console.log(`\n📄 Receipts user should see:`);
    const paymentReceipts = receipts.filter(r => r.receiptType === 'payment' && r.poster._id.toString() === userId.toString());
    const earningsReceipts = receipts.filter(r => r.receiptType === 'earnings' && r.tasker._id.toString() === userId.toString());
    
    console.log(`- Payment receipts (as poster): ${paymentReceipts.length}`);
    paymentReceipts.forEach(r => console.log(`  * ${r.receiptNumber}`));
    
    console.log(`- Earnings receipts (as tasker): ${earningsReceipts.length}`);
    earningsReceipts.forEach(r => console.log(`  * ${r.receiptNumber}`));

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

checkUserRoleInTask().catch(console.error);