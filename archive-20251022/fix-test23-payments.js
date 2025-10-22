// Manual fix script for test 23 task payments
const mongoose = require('mongoose');

async function fixTest23TaskPayments() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    // Load models
    require('./models/User');
    const Task = require('./models/Task');
    const Payment = require('./models/Payment');
    const Receipt = require('./models/Receipt');
    
    const taskId = '68e602cd98c0d42cff502e5e'; // test 23 task ID
    
    console.log(`🔧 Fixing payments for task: ${taskId}`);
    
    // Check current payment status
    const payments = await Payment.find({ task: taskId });
    console.log(`\n💳 Current payments (${payments.length}):`);
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment._id} - Status: ${payment.status} - Amount: ${payment.amount} ${payment.currency}`);
    });
    
    // Update payment status to completed
    if (payments.length > 0) {
      console.log(`\n🔄 Updating ${payments.length} payments to 'completed' status...`);
      
      const updateResult = await Payment.updateMany(
        { task: taskId },
        { 
          $set: { 
            status: 'completed',
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} payments`);
      
      // Verify the update
      const updatedPayments = await Payment.find({ task: taskId });
      console.log(`\n💳 After update (${updatedPayments.length}):`);
      updatedPayments.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment._id} - Status: ${payment.status} - Amount: ${payment.amount} ${payment.currency}`);
      });
      
      // Now try to generate receipts
      console.log(`\n🔄 Attempting to generate receipts...`);
      
      const { generateReceiptsForCompletedTask } = require('./services/receiptService');
      
      try {
        const receipts = await generateReceiptsForCompletedTask(taskId);
        console.log(`✅ Generated receipts:`, {
          paymentReceipt: receipts.paymentReceipt.receiptNumber,
          earningsReceipt: receipts.earningsReceipt.receiptNumber
        });
        
        // Check created receipts
        const createdReceipts = await Receipt.find({ task: taskId });
        console.log(`\n🧾 Created receipts (${createdReceipts.length}):`);
        createdReceipts.forEach((receipt, index) => {
          console.log(`${index + 1}. ${receipt.receiptNumber} - Type: ${receipt.receiptType} - Status: ${receipt.status}`);
        });
        
      } catch (receiptError) {
        console.log(`❌ Failed to generate receipts:`, receiptError.message);
      }
      
      // Test the API now
      console.log(`\n🧪 Testing API after fix...`);
      
      const { getTaskReceipts } = require('./controllers/receiptController');
      
      // Test as poster (Prasanna Hewapathirana)
      const posterId = '68bba9aa738031d9bcf0bdf3';
      
      const req = {
        user: { _id: posterId },
        params: { taskId: taskId }
      };
      
      const res = {
        statusCode: null,
        responseData: null,
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.responseData = data; return this; }
      };
      
      await getTaskReceipts(req, res);
      
      console.log(`📊 API Status: ${res.statusCode}`);
      console.log(`📄 API Response:`, JSON.stringify(res.responseData, null, 2));
      
    } else {
      console.log('⚠️ No payments found for this task');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

fixTest23TaskPayments().catch(console.error);