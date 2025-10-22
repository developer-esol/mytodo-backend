const mongoose = require('mongoose');
require('./config/db.js');
const Notification = require('./models/Notification.js');
const User = require('./models/User.js');

// Wait for connection and then run
setTimeout(async () => {
  try {
    console.log('Checking all notifications...');
    const notifications = await Notification.find({}).limit(10).sort({createdAt: -1});
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach(n => {
      console.log(`ID: ${n._id}, User: ${n.userId}, Type: ${n.type}, Message: ${n.message}`);
    });
    
    console.log('\nChecking users:');
    const user1 = await User.findById('68bba9aa738031d9bcf0bdf3');
    const user2 = await User.findById('68d295e638cbeb79a7d7cf8e');
    console.log('User 1 (68bba9aa738031d9bcf0bdf3):', user1 ? user1.email : 'Not found');
    console.log('User 2 (68d295e638cbeb79a7d7cf8e):', user2 ? user2.email : 'Not found');
    
    // Check notifications for each user
    const notifs1 = await Notification.find({userId: '68bba9aa738031d9bcf0bdf3'}).countDocuments();
    const notifs2 = await Notification.find({userId: '68d295e638cbeb79a7d7cf8e'}).countDocuments();
    console.log(`\nNotifications for user 1: ${notifs1}`);
    console.log(`Notifications for user 2: ${notifs2}`);
    
    // Get the stats for user 2
    const unreadCount = await Notification.countDocuments({
      userId: '68d295e638cbeb79a7d7cf8e',
      isRead: false
    });
    const totalCount = await Notification.countDocuments({
      userId: '68d295e638cbeb79a7d7cf8e'
    });
    
    console.log(`\nStats for current user (${user2?.email}):`)
    console.log(`Total: ${totalCount}, Unread: ${unreadCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 3000);