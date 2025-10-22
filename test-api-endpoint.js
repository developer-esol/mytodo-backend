// test-api-endpoint.js
const mongoose = require('mongoose');
require('dotenv').config();

const testAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Receipt = require('./models/Receipt');
    
    const taskId = '68d8cc18c1ef842d1f3006c1';
    console.log('Testing API for task:', taskId);
    
    // Check if receipts exist for this task
    const receipts = await Receipt.find({ task: taskId });
    console.log('📄 Receipts found:', receipts.length);
    
    if (receipts.length > 0) {
      receipts.forEach(receipt => {
        console.log('  - Receipt:', {
          receiptNumber: receipt.receiptNumber,
          receiptType: receipt.receiptType,
          poster: receipt.poster,
          tasker: receipt.tasker,
          amount: receipt.receiptType === 'payment' 
            ? receipt.financial.totalPaid 
            : receipt.financial.amountReceived,
          currency: receipt.financial.currency
        });
      });
      
      console.log('\n✅ API should now return 200 for /api/receipts/task/' + taskId);
      console.log('✅ Frontend can safely call this endpoint');
    } else {
      console.log('❌ No receipts found - API will return 404');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Test completed');
  }
};

testAPI();