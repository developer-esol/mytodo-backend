const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/airtasksystem').then(async () => {
  const Notification = require('./models/Notification.js');
  
  console.log('=== TESTING OBJECT ID ISSUE ===');
  const userId = '68d295e638cbeb79a7d7cf8e';
  
  // Test 1: String query
  console.log('Test 1: Using string user ID');
  const stringQuery = { recipient: userId };
  console.log('Query:', stringQuery);
  const stringResults = await Notification.find(stringQuery);
  console.log(`Results: ${stringResults.length} notifications`);
  
  // Test 2: ObjectId query
  console.log('\nTest 2: Using ObjectId user ID');
  const objectIdQuery = { recipient: new mongoose.Types.ObjectId(userId) };
  console.log('Query:', objectIdQuery);
  const objectIdResults = await Notification.find(objectIdQuery);
  console.log(`Results: ${objectIdResults.length} notifications`);
  
  // Test 3: Check what type the recipient field actually is
  console.log('\nTest 3: Checking recipient field type in database');
  const sample = await Notification.findOne({});
  if (sample) {
    console.log('Sample notification recipient type:', typeof sample.recipient);
    console.log('Sample notification recipient:', sample.recipient);
    console.log('Is ObjectId?', sample.recipient instanceof mongoose.Types.ObjectId);
  }
  
  // Test 4: Unread query with string
  console.log('\nTest 4: Unread notifications with string ID');
  const unreadStringQuery = { recipient: userId, isRead: false };
  const unreadStringResults = await Notification.find(unreadStringQuery);
  console.log(`Results: ${unreadStringResults.length} unread notifications`);
  
  // Test 5: Unread query with ObjectId
  console.log('\nTest 5: Unread notifications with ObjectId');
  const unreadObjectIdQuery = { recipient: new mongoose.Types.ObjectId(userId), isRead: false };
  const unreadObjectIdResults = await Notification.find(unreadObjectIdQuery);
  console.log(`Results: ${unreadObjectIdResults.length} unread notifications`);
  
  process.exit(0);
}).catch(err => { console.error('Error:', err); process.exit(1); });