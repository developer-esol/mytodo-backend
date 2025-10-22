// Check if receipts were created in the database
const mongoose = require('mongoose');

async function checkReceipts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check all receipts
    const receipts = await db.collection('receipts').find({}).toArray();
    console.log(`📋 Total receipts in database: ${receipts.length}`);

    // Check receipts for our test task
    const taskId = '68d8cc18c1ef842d1f3006c1';
    const taskReceipts = receipts.filter(receipt => 
      receipt.task && receipt.task.toString() === taskId
    );
    
    console.log(`💳 Receipts for task ${taskId}: ${taskReceipts.length}`);
    
    taskReceipts.forEach((receipt, index) => {
      console.log(`${index + 1}. Receipt Number: ${receipt.receiptNumber}`);
      console.log(`   Type: ${receipt.receiptType}`);
      console.log(`   Amount: ${receipt.totalAmount}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Created: ${receipt.createdAt}`);
      console.log('');
    });

    // Show all recent receipts
    console.log('📋 All receipts:');
    receipts.forEach((receipt, index) => {
      console.log(`${index + 1}. ${receipt.receiptNumber} (${receipt.receiptType}) - Task: ${receipt.task}`);
    });

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

checkReceipts().catch(console.error);