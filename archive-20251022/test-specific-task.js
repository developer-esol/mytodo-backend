// test-specific-task.js
const mongoose = require('mongoose');
require('dotenv').config();

const testTaskReceipts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Task = require('./models/Task');
    const Receipt = require('./models/Receipt');
    const Payment = require('./models/Payment');
    const Offer = require('./models/Offer');
    
    const taskId = '68d8cc18c1ef842d1f3006c1';
    console.log('Checking task:', taskId);
    
    // Check if task exists and its status
    const task = await Task.findById(taskId);
    if (!task) {
      console.log('❌ Task not found');
      return;
    }
    
    console.log('✅ Task found:', {
      title: task.title,
      status: task.status,
      completedAt: task.completedAt,
      createdBy: task.createdBy,
      assignedTo: task.assignedTo
    });
    
    // Check if there are any receipts for this task
    const receipts = await Receipt.find({ task: taskId });
    console.log('📄 Receipts found:', receipts.length);
    
    if (receipts.length > 0) {
      receipts.forEach(receipt => {
        console.log('  - Receipt:', receipt.receiptNumber, receipt.receiptType);
      });
    }
    
    // Check if there's a completed payment
    const payments = await Payment.find({ task: taskId });
    console.log('💳 Payments found:', payments.length);
    
    if (payments.length > 0) {
      payments.forEach(payment => {
        console.log('  - Payment:', payment.status, payment.currency, payment.amount);
      });
    }
    
    // Check offers
    const offers = await Offer.find({ taskId: taskId });
    console.log('🤝 Offers found:', offers.length);
    
    if (offers.length > 0) {
      offers.forEach(offer => {
        console.log('  - Offer:', offer.status, offer.offer?.amount);
      });
    }
    
    // If task is completed but no receipts, try to generate them
    if (task.status === 'completed' && receipts.length === 0) {
      console.log('\n🔄 Task is completed but no receipts found. Trying to generate...');
      const { generateReceiptsForCompletedTask } = require('./services/receiptService');
      
      try {
        const generatedReceipts = await generateReceiptsForCompletedTask(taskId);
        console.log('✅ Receipts generated successfully!');
        console.log('  - Payment Receipt:', generatedReceipts.paymentReceipt.receiptNumber);
        console.log('  - Earnings Receipt:', generatedReceipts.earningsReceipt.receiptNumber);
      } catch (genError) {
        console.log('❌ Failed to generate receipts:', genError.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Test completed');
  }
};

testTaskReceipts();