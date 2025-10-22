// find-frontend-user.js - Find the actual user ID for "Kasun Pasan"
const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');

async function findFrontendUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/airtasksystem');
    console.log('🔍 Finding frontend user "Kasun Pasan"...\n');
    
    // Search for user "Kasun Pasan" in different ways
    const searchQueries = [
      { firstName: 'Kasun', lastName: 'Pasan' },
      { firstName: 'kasun', lastName: 'pasan' },
      { $or: [
          { firstName: { $regex: 'kasun', $options: 'i' } },
          { lastName: { $regex: 'pasan', $options: 'i' } },
          { email: { $regex: 'kasun|pasan', $options: 'i' } }
        ]
      }
    ];
    
    console.log('📋 All users in database:');
    const allUsers = await User.find({}).select('_id firstName lastName email createdAt');
    allUsers.forEach((user, i) => {
      console.log(`  ${i+1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
    });
    
    let frontendUser = null;
    
    for (let query of searchQueries) {
      const users = await User.find(query);
      if (users.length > 0) {
        console.log(`\n✅ Found matching users:`, query);
        users.forEach(user => {
          console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
          if (!frontendUser) frontendUser = user;
        });
        break;
      }
    }
    
    if (!frontendUser && allUsers.length > 0) {
      // If no exact match, let's check the most recent user
      const latestUser = allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      console.log(`\n🤔 No exact match found. Latest user: ${latestUser.firstName} ${latestUser.lastName} (${latestUser.email})`);
      frontendUser = latestUser;
    }
    
    if (frontendUser) {
      console.log(`\n🎯 Frontend user identified: ${frontendUser.firstName} ${frontendUser.lastName}`);
      console.log(`   Email: ${frontendUser.email}`);
      console.log(`   ID: ${frontendUser._id}`);
      
      // Check notifications for this user
      const userNotifications = await Notification.find({ recipient: frontendUser._id });
      const unreadCount = await Notification.countDocuments({ recipient: frontendUser._id, isRead: false });
      
      console.log(`\n📊 Notifications for frontend user:`);
      console.log(`   Total: ${userNotifications.length}`);
      console.log(`   Unread: ${unreadCount}`);
      
      if (userNotifications.length === 0) {
        console.log(`\n⚠️  ISSUE FOUND: Frontend user has NO notifications!`);
        console.log(`   This is why the UI shows "No notifications found"`);
        console.log(`\n💡 SOLUTION: Create test notifications for this user`);
        
        // Create test notifications for the frontend user
        console.log('\n🔧 Creating test notifications for frontend user...');
        
        const testNotifications = [
          {
            recipient: frontendUser._id,
            type: 'SYSTEM_UPDATE',
            title: 'Welcome to MyToDoo Notifications!',
            message: 'Your notification system is now active and ready to keep you updated on all your tasks.',
            priority: 'NORMAL',
            actionUrl: '/dashboard',
            isRead: false
          },
          {
            recipient: frontendUser._id,
            type: 'OFFER_MADE',
            title: 'New Offer on Your Task',
            message: 'Someone made an offer on your "Kitchen Cleaning" task. Check it out!',
            priority: 'HIGH',
            actionUrl: '/tasks/123',
            isRead: false
          },
          {
            recipient: frontendUser._id,
            type: 'MESSAGE_RECEIVED',
            title: 'New Message',
            message: 'You have received a new message from a task poster.',
            priority: 'NORMAL',
            actionUrl: '/messages',
            isRead: false
          }
        ];
        
        const createdNotifications = await Notification.insertMany(testNotifications);
        console.log(`✅ Created ${createdNotifications.length} test notifications`);
        
        // Verify creation
        const newUnreadCount = await Notification.countDocuments({ 
          recipient: frontendUser._id, 
          isRead: false 
        });
        
        console.log(`\n🎉 Frontend user now has ${newUnreadCount} unread notifications!`);
        console.log(`   The UI should now show notifications for user "${frontendUser.firstName} ${frontendUser.lastName}"`);
        
      } else {
        console.log(`\n✅ Frontend user already has notifications`);
        userNotifications.forEach((notif, i) => {
          console.log(`   ${i+1}. ${notif.title} - ${notif.isRead ? 'READ' : 'UNREAD'}`);
        });
      }
    } else {
      console.log('\n❌ Could not identify frontend user');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findFrontendUser();