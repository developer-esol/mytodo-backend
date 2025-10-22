// Direct receipt generation test - bypassing HTTP to test the core functionality
const mongoose = require('mongoose');
const { generateReceiptsForCompletedTask } = require('./services/receiptService');

// Connect to MongoDB directly
const MONGODB_URI = 'mongodb://localhost:27017/air-tasker'; // Update if different

async function testReceiptGeneration() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const taskId = '68d8cc18c1ef842d1f3006c1'; // Task with completed payments
    console.log(`🔍 Testing receipt generation for task: ${taskId}`);

    // Try to generate receipts directly
    const receipts = await generateReceiptsForCompletedTask(taskId);
    
    console.log('✅ Receipts generated successfully!');
    console.log('📋 Payment Receipt:', {
      id: receipts.paymentReceipt._id,
      number: receipts.paymentReceipt.receiptNumber,
      amount: receipts.paymentReceipt.amount?.total || receipts.paymentReceipt.totalAmount
    });
    console.log('📋 Earnings Receipt:', {
      id: receipts.earningsReceipt._id,
      number: receipts.earningsReceipt.receiptNumber,
      amount: receipts.earningsReceipt.amount?.total || receipts.earningsReceipt.totalAmount
    });

  } catch (error) {
    console.log('❌ Error:', {
      message: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Disconnected from MongoDB');
  }
}

testReceiptGeneration().catch(console.error);