// comprehensive-notification-fix.js
const mongoose = require('mongoose');
const Notification = require('./models/Notification.js');
const User = require('./models/User.js');

mongoose.connect('mongodb://localhost:27017/airtasksystem')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // The user ID from the logs
    const userId = '68d295e638cbeb79a7d7cf8e';
    
    console.log('\n=== STEP 1: Verify User Exists ===');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    console.log(`✅ User found: ${user.firstName} ${user.lastName} (${user.email})`);
    
    console.log('\n=== STEP 2: Clean Up Old Notifications ===');
    const deletedCount = await Notification.deleteMany({});
    console.log(`🗑️ Deleted ${deletedCount.deletedCount} old notifications`);
    
    console.log('\n=== STEP 3: Create Fresh Test Notifications ===');
    const testNotifications = [
      {
        recipient: userId,
        type: 'OFFER_MADE',
        title: 'New Offer on Your Task',
        message: 'John Doe made an offer of $150 on your cleaning task',
        isRead: false,
        priority: 'HIGH',
        metadata: {
          taskTitle: 'Office Cleaning',
          offerAmount: 150,
          currency: 'USD',
          senderName: 'John Doe'
        }
      },
      {
        recipient: userId,
        type: 'TASK_COMPLETED',
        title: 'Task Completed',
        message: 'Your task "Garden Work" has been marked as completed',
        isRead: false,
        priority: 'NORMAL',
        metadata: {
          taskTitle: 'Garden Work'
        }
      },
      {
        recipient: userId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: 'You received a payment of $75 for completed task',
        isRead: true,
        priority: 'HIGH',
        metadata: {
          taskTitle: 'House Painting',
          offerAmount: 75,
          currency: 'USD'
        }
      },
      {
        recipient: userId,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        message: 'You have a new message about your delivery task',
        isRead: false,
        priority: 'LOW',
        metadata: {
          senderName: 'Jane Smith',
          taskTitle: 'Package Delivery'
        }
      },
      {
        recipient: userId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assignment',
        message: 'You have been assigned a plumbing repair task',
        isRead: false,
        priority: 'URGENT',
        metadata: {
          taskTitle: 'Emergency Plumbing'
        }
      }
    ];
    
    const created = await Notification.insertMany(testNotifications);
    console.log(`✅ Created ${created.length} test notifications`);
    
    console.log('\n=== STEP 4: Verify Database State ===');
    const total = await Notification.countDocuments({ recipient: userId });
    const unread = await Notification.countDocuments({ recipient: userId, isRead: false });
    const read = total - unread;
    
    console.log(`📊 Notification Stats:`);
    console.log(`   Total: ${total}`);
    console.log(`   Unread: ${unread}`);
    console.log(`   Read: ${read}`);
    
    console.log('\n=== STEP 5: Test Service Method ===');
    const notificationService = require('./services/notificationService.js');
    
    try {
      const serviceResult = await notificationService.getUserNotifications(userId, {
        page: 1,
        limit: 10,
        unreadOnly: false
      });
      
      console.log(`🔧 Service returned ${serviceResult.notifications.length} notifications`);
      console.log(`   Pagination: ${JSON.stringify(serviceResult.pagination)}`);
      console.log(`   Unread count: ${serviceResult.unreadCount}`);
      
      if (serviceResult.notifications.length > 0) {
        console.log('\n📋 Sample notifications:');
        serviceResult.notifications.forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title} - ${notif.isRead ? 'Read' : 'Unread'}`);
        });
      } else {
        console.log('❌ Service returned no notifications!');
      }
    } catch (serviceError) {
      console.error('❌ Service error:', serviceError.message);
    }
    
    console.log('\n=== STEP 6: Test Direct API Simulation ===');
    // Simulate what the controller does
    const controllerQuery = { recipient: userId };
    const directNotifications = await Notification.find(controllerQuery)
      .populate('sender', 'firstName lastName avatar')
      .populate('relatedTask', 'title category')
      .populate('relatedOffer', 'amount currency')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`🎯 Direct query returned ${directNotifications.length} notifications`);
    
    console.log('\n=== SUMMARY ===');
    console.log(`✅ User exists: ${user.email}`);
    console.log(`✅ Database has ${total} notifications for user`);
    console.log(`✅ Service method works: ${serviceResult ? 'Yes' : 'No'}`);
    console.log(`✅ Direct query works: ${directNotifications.length > 0 ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 Notification system is ready! The frontend should now show notifications.');
    console.log('\n🔗 You can test the API endpoint: GET /api/notifications');
    console.log(`   For user: ${userId} (${user.email})`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });