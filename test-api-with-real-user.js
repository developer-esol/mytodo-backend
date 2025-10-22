// test-api-with-real-user.js - Test API with actual user authentication
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function testAPIWithRealUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/airtasksystem');
    console.log('🔍 Testing notification API with real user data...\n');
    
    // Find a user that has notifications
    const userWithNotifications = await User.findOne({ 
      _id: '68d295e638cbeb79a7d7cf8e' 
    });
    
    if (!userWithNotifications) {
      console.log('❌ User with notifications not found');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${userWithNotifications.email}`);
    
    // Check their notifications directly
    const notifications = await Notification.find({ 
      recipient: userWithNotifications._id 
    }).select('title isRead type createdAt').sort({ createdAt: -1 });
    
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    console.log(`\n📊 User notification stats:`);
    console.log(`   Total notifications: ${notifications.length}`);
    console.log(`   Unread notifications: ${unreadCount}`);
    console.log(`   Read notifications: ${notifications.length - unreadCount}`);
    
    console.log('\n📋 Notifications list:');
    notifications.forEach((n, i) => {
      console.log(`   ${i+1}. ${n.title} - ${n.isRead ? '✅ READ' : '🔴 UNREAD'} (${n.type})`);
    });
    
    // Test if the notification service works correctly
    const notificationService = require('./services/notificationService');
    const serviceResult = await notificationService.getUserNotifications(userWithNotifications._id, {
      page: 1,
      limit: 20
    });
    
    console.log(`\n🔧 Service result:`);
    console.log(`   Returned notifications: ${serviceResult.notifications.length}`);
    console.log(`   Unread count from service: ${serviceResult.unreadCount}`);
    console.log(`   Total count: ${serviceResult.pagination.totalCount}`);
    
    // Check if there's a mismatch
    if (serviceResult.unreadCount !== unreadCount) {
      console.log(`\n⚠️  MISMATCH DETECTED:`);
      console.log(`   Direct count: ${unreadCount}`);
      console.log(`   Service count: ${serviceResult.unreadCount}`);
    } else {
      console.log(`\n✅ Counts match - system is working correctly`);
    }
    
    console.log('\n💡 The issue is likely:');
    console.log('   1. Frontend is using wrong user ID');
    console.log('   2. Frontend JWT token is for different user');
    console.log('   3. Authentication middleware issue');
    console.log('   4. Frontend not calling the correct API endpoint');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPIWithRealUser();