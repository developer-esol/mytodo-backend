// test-notifications.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('./models/Notification');
const notificationService = require('./services/notificationService');
const User = require('./models/User');
const Task = require('./models/Task');

async function testNotificationSystem() {
  try {
    console.log('🚀 Starting notification system test...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create a test user (or find existing)
    console.log('📝 Test 1: Creating/Finding test user...');
    let testUser = await User.findOne({ email: { $exists: true } }).limit(1);
    
    if (!testUser) {
      console.log('❌ No existing users found. Please create a user first through the app.');
      return;
    }

    console.log(`✅ Using test user: ${testUser.firstName} ${testUser.lastName} (${testUser._id})\n`);

    // Test 2: Create a system notification
    console.log('📝 Test 2: Creating system notification...');
    const systemNotification = await notificationService.createNotification({
      recipient: testUser._id,
      type: 'SYSTEM_UPDATE',
      title: 'Welcome to MyToDoo Notifications!',
      message: 'Your notification system is now active and ready to keep you updated on all task activities.',
      priority: 'NORMAL',
      actionUrl: '/dashboard'
    });
    console.log(`✅ System notification created: ${systemNotification._id}\n`);

    // Test 3: Create a test task notification (simulated)
    console.log('📝 Test 3: Creating task-related notification...');
    
    // Find a task or create mock data
    const existingTask = await Task.findOne({ createdBy: testUser._id }).limit(1);
    
    if (existingTask) {
      const taskNotification = await notificationService.createNotification({
        recipient: testUser._id,
        type: 'TASK_POSTED',
        title: 'Task Posted Successfully',
        message: `Your task "${existingTask.title}" has been posted and is now visible to taskers.`,
        relatedTask: existingTask._id,
        actionUrl: `/tasks/${existingTask._id}`,
        metadata: {
          taskTitle: existingTask.title,
          taskCategory: existingTask.categories?.[0] || 'General'
        },
        priority: 'NORMAL'
      });
      console.log(`✅ Task notification created: ${taskNotification._id}\n`);
    } else {
      console.log('⚠️  No existing tasks found, skipping task notification test\n');
    }

    // Test 4: Retrieve user notifications
    console.log('📝 Test 4: Retrieving user notifications...');
    const userNotifications = await notificationService.getUserNotifications(testUser._id, {
      page: 1,
      limit: 10
    });
    
    console.log(`✅ Retrieved ${userNotifications.notifications.length} notifications`);
    console.log(`   Unread count: ${userNotifications.unreadCount}`);
    console.log(`   Total count: ${userNotifications.pagination.totalCount}\n`);

    // Test 5: Display notifications
    console.log('📝 Test 5: Displaying notifications...');
    userNotifications.notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. [${notif.type}] ${notif.title}`);
      console.log(`      Message: ${notif.message}`);
      console.log(`      Read: ${notif.isRead ? '✅' : '❌'}`);
      console.log(`      Created: ${notif.timeAgo}`);
      console.log(`      Action URL: ${notif.actionUrl || 'None'}`);
      console.log('');
    });

    // Test 6: Mark a notification as read
    if (userNotifications.notifications.length > 0) {
      console.log('📝 Test 6: Marking first notification as read...');
      const firstNotif = userNotifications.notifications[0];
      if (!firstNotif.isRead) {
        await notificationService.markAsRead(firstNotif._id, testUser._id);
        console.log(`✅ Marked notification ${firstNotif._id} as read\n`);
      } else {
        console.log('ℹ️  First notification was already read\n');
      }
    }

    // Test 7: Get notification statistics
    console.log('📝 Test 7: Getting notification statistics...');
    const stats = await notificationService.getNotificationStats(testUser._id);
    console.log(`✅ Notification stats:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Unread: ${stats.unread}`);
    console.log(`   High Priority: ${stats.high_priority}\n`);

    console.log('🎉 All notification tests completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test notifications in the frontend');
    console.log('   2. Create/accept offers to see real-time notifications');
    console.log('   3. Complete tasks to test receipt notifications');
    console.log('   4. Check webhook functionality for real-time updates');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNotificationSystem().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testNotificationSystem };