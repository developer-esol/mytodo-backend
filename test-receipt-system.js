// test-receipt-system.js
require('dotenv').config();
const mongoose = require('mongoose');
const { generateReceiptsForCompletedTask, getUserReceipts } = require('./services/receiptService');
const Task = require('./models/Task');
const Payment = require('./models/Payment');
const Offer = require('./models/Offer');

const testReceiptSystem = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a completed task with payment
    const completedTask = await Task.findOne({ 
      status: 'completed',
      completedAt: { $exists: true }
    }).populate('createdBy assignedTo');

    if (!completedTask) {
      console.log('No completed tasks found. Creating a test scenario...');
      // For testing, you would need to create a test task, offer, and payment
      console.log('Please complete at least one task in the system first.');
      return;
    }

    console.log(`Found completed task: ${completedTask.title} (ID: ${completedTask._id})`);

    // Check if payment exists for this task
    const payment = await Payment.findOne({ task: completedTask._id, status: 'completed' });
    if (!payment) {
      console.log('No completed payment found for this task.');
      return;
    }

    console.log(`Found payment: ${payment.currency} ${payment.amount} (Service Fee: ${payment.serviceFee})`);

    // Test receipt generation
    console.log('\n=== Testing Receipt Generation ===');
    const receipts = await generateReceiptsForCompletedTask(completedTask._id);
    
    console.log(`✅ Payment Receipt: ${receipts.paymentReceipt.receiptNumber}`);
    console.log(`✅ Earnings Receipt: ${receipts.earningsReceipt.receiptNumber}`);
    
    // Test getting user receipts
    console.log('\n=== Testing User Receipt Retrieval ===');
    const posterReceipts = await getUserReceipts(completedTask.createdBy._id);
    const taskerReceipts = await getUserReceipts(completedTask.assignedTo._id);
    
    console.log(`Poster has ${posterReceipts.length} receipts`);
    console.log(`Tasker has ${taskerReceipts.length} receipts`);
    
    // Show receipt details
    if (posterReceipts.length > 0) {
      const receipt = posterReceipts[0];
      console.log('\n=== Sample Receipt Details ===');
      console.log(`Receipt Number: ${receipt.receiptNumber}`);
      console.log(`Type: ${receipt.receiptType}`);
      console.log(`Amount: ${receipt.financial.currency} ${receipt.financial.totalPaid.toFixed(2)}`);
      console.log(`Service Fee: ${receipt.financial.currency} ${receipt.financial.serviceFee.toFixed(2)}`);
      console.log(`Tax: ${receipt.financial.tax.taxType} (${receipt.financial.tax.taxRate}%) = ${receipt.financial.currency} ${receipt.financial.tax.taxAmount.toFixed(2)}`);
    }

    console.log('\n✅ Receipt system test completed successfully!');

  } catch (error) {
    console.error('❌ Receipt system test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test
testReceiptSystem();