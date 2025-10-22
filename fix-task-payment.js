// fix-task-payment.js
const mongoose = require('mongoose');
require('dotenv').config();

const fixTaskPayment = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Payment = require('./models/Payment');
    const { generateReceiptsForCompletedTask } = require('./services/receiptService');
    
    const taskId = '68d8cc18c1ef842d1f3006c1';
    console.log('Fixing payments for task:', taskId);
    
    // Update all payments for this task to completed status
    const updateResult = await Payment.updateMany(
      { task: taskId },
      { $set: { status: "completed" } }
    );
    
    console.log('✅ Updated payments:', updateResult.modifiedCount);
    
    // Now try to generate receipts
    console.log('\n🔄 Generating receipts...');
    try {
      const receipts = await generateReceiptsForCompletedTask(taskId);
      console.log('✅ Receipts generated successfully!');
      console.log('  - Payment Receipt:', receipts.paymentReceipt.receiptNumber);
      console.log('  - Earnings Receipt:', receipts.earningsReceipt.receiptNumber);
    } catch (genError) {
      console.log('❌ Failed to generate receipts:', genError.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Fix completed');
  }
};

fixTaskPayment();