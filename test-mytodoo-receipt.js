// test-mytodoo-receipt.js
const mongoose = require('mongoose');
require('dotenv').config();

const testMyToDooReceipt = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Receipt = require('./models/Receipt');
    const { generateReceiptsForCompletedTask } = require('./services/receiptService');
    
    const taskId = '68d8cc18c1ef842d1f3006c1';
    console.log('🧪 Testing MyToDoo receipt generation for task:', taskId);
    
    // Delete existing receipts to test new generation
    const deleteResult = await Receipt.deleteMany({ task: taskId });
    console.log('🗑️  Deleted existing receipts:', deleteResult.deletedCount);
    
    // Generate new receipts with MyToDoo branding
    console.log('🔄 Generating new MyToDoo receipts...');
    try {
      const receipts = await generateReceiptsForCompletedTask(taskId);
      
      console.log('✅ MyToDoo receipts generated successfully!');
      console.log('  📄 Payment Receipt:', receipts.paymentReceipt.receiptNumber);
      console.log('  📄 Earnings Receipt:', receipts.earningsReceipt.receiptNumber);
      
      // Check the branding in the generated receipts
      console.log('\n🏷️  Branding verification:');
      console.log('  Company Name:', receipts.paymentReceipt.platformInfo.name);
      console.log('  Email:', receipts.paymentReceipt.platformInfo.email);
      console.log('  Receipt Number Pattern:', receipts.paymentReceipt.receiptNumber.slice(0, 2)); // Should be "MT"
      
    } catch (genError) {
      console.log('❌ Failed to generate receipts:', genError.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Test completed');
  }
};

testMyToDooReceipt();