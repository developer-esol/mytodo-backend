// fix-notification-user-mismatch.js
const mongoose = require('mongoose');
const Notification = require('./models/Notification.js');
const User = require('./models/User.js');

mongoose.connect('mongodb://localhost:27017/airtasksystem')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    console.log('🔍 ISSUE DIAGNOSIS: User ID Mismatch');
    console.log('=====================================\n');
    
    // Check current notifications
    const wrongUserId = '68bba9aa738031d9bcf0bdf3'; // From database screenshot
    const correctUserId = '68d295e638cbeb79a7d7cf8e'; // From JWT token
    
    console.log('Step 1: Checking existing notifications...');
    const existingNotifications = await Notification.find({ recipient: wrongUserId });
    console.log(`Found ${existingNotifications.length} notifications for wrong user: ${wrongUserId}`);
    
    const correctUserNotifications = await Notification.find({ recipient: correctUserId });
    console.log(`Found ${correctUserNotifications.length} notifications for correct user: ${correctUserId}`);
    
    // Check if both users exist
    console.log('\nStep 2: Verifying users exist...');
    const wrongUser = await User.findById(wrongUserId);
    const correctUser = await User.findById(correctUserId);
    
    console.log(`Wrong user (${wrongUserId}): ${wrongUser ? wrongUser.email : 'NOT FOUND'}`);
    console.log(`Correct user (${correctUserId}): ${correctUser ? correctUser.email : 'NOT FOUND'}`);
    
    if (!correctUser) {
      console.log('❌ Error: Correct user does not exist! Cannot fix notifications.');
      process.exit(1);
    }
    
    if (existingNotifications.length === 0) {
      console.log('ℹ️  No notifications to migrate.');
      process.exit(0);
    }
    
    // Fix: Update all notifications to use correct user ID
    console.log('\nStep 3: Fixing notification user IDs...');
    const updateResult = await Notification.updateMany(
      { recipient: wrongUserId },
      { recipient: correctUserId }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} notifications`);
    
    // Verify the fix
    console.log('\nStep 4: Verifying fix...');
    const finalNotifications = await Notification.find({ recipient: correctUserId });
    console.log(`✅ Correct user now has ${finalNotifications.length} notifications`);
    
    // Show sample notifications
    if (finalNotifications.length > 0) {
      console.log('\n📋 Sample notifications for correct user:');
      finalNotifications.slice(0, 3).forEach((n, index) => {
        console.log(`   ${index + 1}. ${n.title} - ${n.type} (${n.isRead ? 'Read' : 'Unread'})`);
      });
    }
    
    // Get final stats
    const totalCount = await Notification.countDocuments({ recipient: correctUserId });
    const unreadCount = await Notification.countDocuments({ recipient: correctUserId, isRead: false });
    
    console.log('\n📊 Final Statistics:');
    console.log(`   User: ${correctUser.email} (${correctUserId})`);
    console.log(`   Total notifications: ${totalCount}`);
    console.log(`   Unread: ${unreadCount}`);
    console.log(`   Read: ${totalCount - unreadCount}`);
    
    console.log('\n🎉 NOTIFICATION SYSTEM FIXED!');
    console.log('The frontend should now display notifications correctly.');
    console.log('Please refresh the frontend application.');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });