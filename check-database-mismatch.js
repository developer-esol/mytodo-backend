const mongoose = require('mongoose');

async function checkBothDatabases() {
  const userId = '68d295e638cbeb79a7d7cf8e';
  
  console.log('=== CHECKING DATABASE MISMATCH ISSUE ===\n');
  
  // Test Database 1: airtasksystem (what my scripts use)
  console.log('📊 Database 1: airtasksystem');
  await mongoose.connect('mongodb://localhost:27017/airtasksystem');
  
  const User1 = mongoose.model('User', require('./models/User.js').schema);
  const Notification1 = mongoose.model('Notification', require('./models/Notification.js').schema);
  
  const user1 = await User1.findById(userId);
  const notifications1 = await Notification1.countDocuments({ recipient: userId });
  
  console.log(`  User exists: ${user1 ? 'YES' : 'NO'} (${user1?.email || 'N/A'})`);
  console.log(`  Notifications: ${notifications1}`);
  
  await mongoose.disconnect();
  
  // Test Database 2: Airtasker (what the server uses)
  console.log('\n📊 Database 2: Airtasker');
  await mongoose.connect('mongodb://localhost:27017/Airtasker');
  
  const User2 = mongoose.model('User2', require('./models/User.js').schema);
  const Notification2 = mongoose.model('Notification2', require('./models/Notification.js').schema);
  
  const user2 = await User2.findById(userId);
  const notifications2 = await Notification2.countDocuments({ recipient: userId });
  
  console.log(`  User exists: ${user2 ? 'YES' : 'NO'} (${user2?.email || 'N/A'})`);
  console.log(`  Notifications: ${notifications2}`);
  
  console.log('\n🔧 SOLUTION:');
  if (user1 && notifications1 > 0 && !user2) {
    console.log('✅ Fix: Update .env to use "airtasksystem" database');
    console.log('   Change MONGO_URI=mongodb://localhost:27017/Airtasker');
    console.log('   To:    MONGO_URI=mongodb://localhost:27017/airtasksystem');
  } else if (user2 && !user1) {
    console.log('✅ Fix: Move notifications to "Airtasker" database');
  } else {
    console.log('❓ Need to investigate further...');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

checkBothDatabases().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});