const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/airtasksystem').then(async () => {
  const Notification = require('./models/Notification.js');
  
  console.log('=== ALL NOTIFICATIONS IN DATABASE ===');
  const all = await Notification.find({}).select('_id recipient type title isRead').limit(10);
  all.forEach(n => console.log(`ID: ${n._id}, User: ${n.recipient}, Type: ${n.type}, Read: ${n.isRead}`));
  
  console.log('\n=== NOTIFICATIONS FOR CURRENT USER ===');
  const userId = '68d295e638cbeb79a7d7cf8e';
  const userNotifs = await Notification.find({ recipient: userId }).select('_id type title isRead');
  console.log(`Found ${userNotifs.length} notifications for user ${userId}`);
  userNotifs.forEach(n => console.log(`  - ${n.title} (${n.type}) - ${n.isRead ? 'Read' : 'Unread'}`));
  
  console.log('\n=== API SIMULATION TEST ===');
  // Test the exact same query the API uses
  const apiQuery = { recipient: userId };
  const apiResults = await Notification.find(apiQuery)
    .populate('sender', 'firstName lastName avatar')
    .populate('relatedTask', 'title category')  
    .populate('relatedOffer', 'amount currency')
    .sort({ createdAt: -1 })
    .limit(20);
  
  console.log(`API simulation found ${apiResults.length} notifications`);
  apiResults.forEach((n, index) => {
    console.log(`  ${index + 1}. ${n.title} (${n.type}) - ${n.isRead ? 'Read' : 'Unread'}`);
  });
  
  process.exit(0);
}).catch(err => { console.error('Error:', err); process.exit(1); });