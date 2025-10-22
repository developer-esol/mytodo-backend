const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const Payment = require('./models/Payment');
const Receipt = require('./models/Receipt');
const Offer = require('./models/Offer');

async function fixTaskPaymentAndReceipts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const taskId = '68c1208ecf90217bcd4467f9';
    console.log('🔧 Fixing task:', taskId);
    console.log('='.repeat(60));
    
    //Step 1: Update payment status to "completed"
    console.log('\n💳 Step 1: Updating payment status to "completed"...');
    const updateResult = await Payment.updateMany(
      { task: taskId },
      { $set: { status: 'completed', updatedAt: new Date() } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} payment(s) to "completed"`);
    
    // Verify payment update
    const payments = await Payment.find({ task: taskId });
    console.log('   Payment statuses after update:');
    payments.forEach((p, i) => {
      console.log(`     Payment ${i + 1}: ${p.status}`);
    });
    
    // Step 2: Generate receipts
    console.log('\n📄 Step 2: Generating receipts...');
    const { generateReceiptsForCompletedTask } = require('./services/receiptService');
    
    try {
      const receipts = await generateReceiptsForCompletedTask(taskId);
      console.log('✅ Receipts generated successfully!');
      console.log(`   Payment Receipt: ${receipts.paymentReceipt.receiptNumber}`);
      console.log(`   Earnings Receipt: ${receipts.earningsReceipt.receiptNumber}`);
      
      // Verify receipts in database
      const dbReceipts = await Receipt.find({ task: taskId });
      console.log(`\n✅ Verified: ${dbReceipts.length} receipts now in database`);
      dbReceipts.forEach((r, i) => {
        console.log(`   Receipt ${i + 1}: ${r.receiptType} - ${r.receiptNumber}`);
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SUCCESS! Task fixed and receipts generated!');
      console.log('\n📝 Summary:');
      console.log('   ✅ Payment status updated to "completed"');
      console.log('   ✅ Receipts generated successfully');
      console.log('   ✅ Task is now ready for receipt download');
      console.log('\n💡 User can now download their receipt from the frontend!');
      
    } catch (genError) {
      console.error('\n❌ Failed to generate receipts:', genError.message);
      console.error('   Stack:', genError.stack);
      
      // Debug info
      console.log('\n🔍 Debug Info:');
      const task = await Task.findById(taskId);
      const payment = await Payment.findOne({ task: taskId });
      const offer = await Offer.findOne({ taskId: taskId });
      
      console.log('   Task Status:', task?.status);
      console.log('   Payment Status:', payment?.status);
      console.log('   Offer Status:', offer?.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixTaskPaymentAndReceipts();
