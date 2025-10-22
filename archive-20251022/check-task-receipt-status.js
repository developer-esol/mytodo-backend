const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const Payment = require('./models/Payment');
const Receipt = require('./models/Receipt');
const Offer = require('./models/Offer');

async function checkTaskReceiptStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check the specific task from the screenshot
    const taskId = '68c1208ecf90217bcd4467f9';
    console.log('🔍 Checking task:', taskId);
    console.log('='.repeat(60));
    
    const task = await Task.findById(taskId)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    if (!task) {
      console.log('❌ Task not found');
      return;
    }
    
    console.log('\n📋 TASK INFO:');
    console.log('  Title:', task.title);
    console.log('  Status:', task.status);
    console.log('  Created By:', task.createdBy?.firstName, task.createdBy?.lastName);
    console.log('  Assigned To:', task.assignedTo?.firstName, task.assignedTo?.lastName);
    console.log('  Completed At:', task.completedAt);
    
    console.log('\n💳 PAYMENT INFO:');
    const payments = await Payment.find({ task: taskId });
    if (payments.length === 0) {
      console.log('  ❌ No payments found');
    } else {
      payments.forEach((p, i) => {
        console.log(`  Payment ${i + 1}:`);
        console.log('    Status:', p.status);
        console.log('    Amount:', p.amount, p.currency);
        console.log('    Service Fee:', p.serviceFee);
        console.log('    Tasker Amount:', p.taskerAmount);
        console.log('    Payment Intent ID:', p.paymentIntentId);
      });
    }
    
    console.log('\n🤝 OFFER INFO:');
    const offers = await Offer.find({ taskId: taskId });
    if (offers.length === 0) {
      console.log('  ❌ No offers found');
    } else {
      offers.forEach((o, i) => {
        console.log(`  Offer ${i + 1}:`);
        console.log('    Status:', o.status);
        console.log('    Amount:', o.offer?.amount);
        console.log('    Task Taker:', o.taskTakerId);
      });
    }
    
    console.log('\n📄 RECEIPT INFO:');
    const receipts = await Receipt.find({ task: taskId });
    if (receipts.length === 0) {
      console.log('  ❌ No receipts found');
    } else {
      receipts.forEach((r, i) => {
        console.log(`  Receipt ${i + 1}:`);
        console.log('    Type:', r.receiptType);
        console.log('    Number:', r.receiptNumber);
        console.log('    Status:', r.status);
        console.log('    Poster:', r.poster);
        console.log('    Tasker:', r.tasker);
        console.log('    Generated At:', r.generatedAt);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 DIAGNOSIS:');
    
    if (task.status !== 'completed') {
      console.log('❌ Task is not marked as completed (Status:', task.status + ')');
      console.log('   → Receipts will only generate when task status is "completed"');
    } else {
      console.log('✅ Task is completed');
    }
    
    if (payments.length === 0) {
      console.log('❌ No payment records found');
      console.log('   → Cannot generate receipts without payment data');
    } else {
      const completedPayments = payments.filter(p => p.status === 'completed');
      if (completedPayments.length === 0) {
        console.log('❌ Payment exists but status is NOT "completed"');
        console.log('   Current payment status:', payments[0].status);
        console.log('   → Receipt generation requires payment status = "completed"');
      } else {
        console.log('✅ Payment is completed');
      }
    }
    
    if (offers.length === 0) {
      console.log('❌ No offers found');
      console.log('   → Cannot generate receipts without accepted offer');
    } else {
      const acceptedOffers = offers.filter(o => o.status === 'accepted' || o.status === 'completed');
      if (acceptedOffers.length === 0) {
        console.log('❌ No accepted/completed offers found');
        console.log('   → Receipt generation requires accepted offer');
      } else {
        console.log('✅ Accepted offer exists');
      }
    }
    
    if (receipts.length === 0) {
      console.log('❌ No receipts generated yet');
      console.log('\n💡 RECOMMENDATION:');
      
      if (task.status === 'completed' && 
          payments.length > 0 && 
          payments.some(p => p.status === 'completed') &&
          offers.some(o => o.status === 'accepted' || o.status === 'completed')) {
        console.log('   All conditions met! Attempting to generate receipts now...\n');
        
        const { generateReceiptsForCompletedTask } = require('./services/receiptService');
        try {
          const generated = await generateReceiptsForCompletedTask(taskId);
          console.log('   ✅ SUCCESS! Receipts generated:');
          console.log('      Payment Receipt:', generated.paymentReceipt.receiptNumber);
          console.log('      Earnings Receipt:', generated.earningsReceipt.receiptNumber);
        } catch (genError) {
          console.log('   ❌ FAILED to generate receipts:');
          console.log('      Error:', genError.message);
          console.log('      Stack:', genError.stack);
        }
      } else {
        console.log('   Cannot generate receipts - missing requirements above');
      }
    } else {
      console.log('✅ Receipts already exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTaskReceiptStatus();
