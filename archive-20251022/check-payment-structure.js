// Check the structure of completed payments
const mongoose = require('mongoose');

async function checkPaymentStructure() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get a sample completed payment to see its structure
    const completedPayment = await db.collection('payments').findOne({ status: 'completed' });
    
    console.log('💳 Sample completed payment structure:');
    console.log(JSON.stringify(completedPayment, null, 2));

    // Check if there are any task-related fields
    console.log('\n🔍 Looking for task reference fields:');
    const fieldNames = Object.keys(completedPayment);
    const taskFields = fieldNames.filter(field => 
      field.toLowerCase().includes('task') || 
      field.toLowerCase().includes('offer') ||
      field.toLowerCase().includes('order')
    );
    console.log('Task-related fields:', taskFields);

    // Check a few more completed payments to see the pattern
    const morePayments = await db.collection('payments').find({ status: 'completed' }).limit(3).toArray();
    console.log('\n📋 All completed payment IDs and potential task references:');
    
    morePayments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment._id}`);
      
      // Check for any fields that might reference tasks
      Object.keys(payment).forEach(key => {
        if (key.toLowerCase().includes('task') || 
            key.toLowerCase().includes('offer') ||
            key.toLowerCase().includes('order') ||
            payment[key]?.toString().length === 24) { // Looks like ObjectId
          console.log(`   ${key}: ${payment[key]}`);
        }
      });
      console.log('');
    });

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

checkPaymentStructure().catch(console.error);