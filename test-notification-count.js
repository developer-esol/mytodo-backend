// test-notification-count.js - Check notification count issue
const mongoose = require('mongoose');
const Notification = require('./models/Notification');

async function checkNotificationCount() {
  try {
    await mongoose.connect('mongodb://localhost:27017/airtasksystem');
    console.log('🔍 Checking notification counts...\n');
    
    // Get all notifications
    const allNotifs = await Notification.find({}).select('recipient isRead type title createdAt').sort({ createdAt: -1 }).limit(10);
    console.log('📋 Recent notifications:');
    allNotifs.forEach((n, i) => {
      console.log(`  ${i+1}. ${n.title} (User: ${n.recipient}, Read: ${n.isRead})`);
    });
    
    // Count by user
    const userStats = await Notification.aggregate([
      { $group: { 
        _id: '$recipient', 
        total: { $sum: 1 }, 
        unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
      }},
      { $sort: { total: -1 } }
    ]);
    
    console.log('\n👥 Notification counts by user:');
    userStats.forEach((stat, i) => {
      console.log(`  User ${stat._id}: ${stat.total} total, ${stat.unread} unread`);
    });
    
    // Test specific user (from screenshot context)
    const testUserId = '68bba9aa738031d9bcf0bdf3';
    const userNotifs = await Notification.find({ recipient: testUserId });
    const userUnread = await Notification.countDocuments({ recipient: testUserId, isRead: false });
    
    console.log(`\n🧪 Test user (${testUserId}):`);
    console.log(`  Total notifications: ${userNotifs.length}`);
    console.log(`  Unread notifications: ${userUnread}`);
    
    if (userNotifs.length > 0) {
      console.log('\n📝 User notifications details:');
      userNotifs.forEach((n, i) => {
        console.log(`  ${i+1}. ${n.title} - ${n.isRead ? 'READ' : 'UNREAD'} (${n.type})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNotificationCount();