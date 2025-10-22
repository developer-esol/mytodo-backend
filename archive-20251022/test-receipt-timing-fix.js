// Test script to verify receipt generation timing fix
const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');
const Payment = require('./models/Payment');
const Offer = require('./models/Offer');
const Receipt = require('./models/Receipt');
const User = require('./models/User');

async function testReceiptTimingFix() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a task that's in "todo" status (completed by tasker, waiting for poster confirmation)
    const todoTask = await Task.findOne({ 
      status: 'todo',
      assignedTo: { $exists: true }
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');

    if (!todoTask) {
      console.log('❌ No "todo" task found. Need a task that is completed by tasker but not confirmed by poster.');
      console.log('\n💡 Creating test scenario...');
      
      // Find any completed task to simulate
      const completedTask = await Task.findOne({ 
        status: 'completed',
        assignedTo: { $exists: true }
      });
      
      if (!completedTask) {
        console.log('❌ No completed tasks found to test with.');
        return;
      }
      
      console.log(`📋 Using completed task: ${completedTask._id}`);
      console.log(`   Title: ${completedTask.title}`);
      
      // Check payment status
      const payment = await Payment.findOne({ task: completedTask._id });
      console.log(`\n💳 Payment Status: ${payment ? payment.status : 'NOT FOUND'}`);
      
      // Check receipts
      const receipts = await Receipt.find({ task: completedTask._id });
      console.log(`📄 Receipts: ${receipts.length} found`);
      
      if (receipts.length > 0) {
        receipts.forEach(r => {
          console.log(`   - ${r.receiptType}: ${r.receiptNumber} (Status: ${r.status})`);
        });
      }
      
      return;
    }

    console.log(`📋 Found "todo" task: ${todoTask._id}`);
    console.log(`   Title: ${todoTask.title}`);
    console.log(`   Status: ${todoTask.status}`);
    console.log(`   Poster: ${todoTask.createdBy.firstName} ${todoTask.createdBy.lastName}`);
    console.log(`   Tasker: ${todoTask.assignedTo.firstName} ${todoTask.assignedTo.lastName}`);

    // Check if payment exists
    const payment = await Payment.findOne({ task: todoTask._id });
    if (!payment) {
      console.log('\n❌ No payment found for this task. Cannot test receipt generation.');
      return;
    }

    console.log(`\n💳 Payment Status: ${payment.status}`);
    console.log(`   Amount: ${payment.currency} ${payment.amount}`);
    console.log(`   Service Fee: ${payment.currency} ${payment.serviceFee}`);

    // Check if receipts already exist
    const existingReceipts = await Receipt.find({ task: todoTask._id });
    console.log(`\n📄 Existing Receipts: ${existingReceipts.length}`);

    // Simulate task completion by poster
    console.log('\n🎬 SIMULATING TASK COMPLETION BY POSTER...\n');
    console.log('Step 1: Updating payment status to "completed"...');
    
    const paymentUpdateStart = Date.now();
    await Payment.updateMany(
      { task: todoTask._id }, 
      { $set: { status: "completed", updatedAt: new Date() }}
    );
    const paymentUpdateTime = Date.now() - paymentUpdateStart;
    console.log(`✅ Payment status updated (took ${paymentUpdateTime}ms)`);

    // Verify payment was updated
    const updatedPayment = await Payment.findOne({ task: todoTask._id });
    console.log(`   Verified payment status: ${updatedPayment.status}`);

    console.log('\nStep 2: Generating receipts...');
    const { generateReceiptsForCompletedTask } = require('./services/receiptService');
    
    const receiptGenStart = Date.now();
    try {
      const receipts = await generateReceiptsForCompletedTask(todoTask._id.toString());
      const receiptGenTime = Date.now() - receiptGenStart;
      
      console.log(`✅ Receipts generated successfully (took ${receiptGenTime}ms)`);
      console.log(`   Payment Receipt: ${receipts.paymentReceipt.receiptNumber}`);
      console.log(`   Earnings Receipt: ${receipts.earningsReceipt.receiptNumber}`);
      
      console.log('\n🎉 SUCCESS! Receipt generation worked correctly.');
      console.log('\n📊 Timing Analysis:');
      console.log(`   Payment Update: ${paymentUpdateTime}ms`);
      console.log(`   Receipt Generation: ${receiptGenTime}ms`);
      console.log(`   Total Time: ${paymentUpdateTime + receiptGenTime}ms`);
      
      // Verify receipts in database
      const finalReceipts = await Receipt.find({ task: todoTask._id });
      console.log(`\n✅ Verified: ${finalReceipts.length} receipts now in database`);
      
    } catch (error) {
      console.error(`\n❌ FAILED to generate receipts:`, error.message);
      console.error(`   Error: ${error.stack}`);
      
      // Debug: Check what went wrong
      const debugPayment = await Payment.findOne({ task: todoTask._id });
      console.log(`\n🔍 Debug Info:`);
      console.log(`   Payment Status: ${debugPayment.status}`);
      console.log(`   Payment ID: ${debugPayment._id}`);
      
      const debugOffer = await Offer.findOne({ taskId: todoTask._id });
      console.log(`   Offer Status: ${debugOffer ? debugOffer.status : 'NOT FOUND'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testReceiptTimingFix();
