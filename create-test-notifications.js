const mongoose = require('mongoose');
const Notification = require('./models/Notification.js');

// Direct connection
mongoose.connect('mongodb://localhost:27017/airtasksystem')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create test notifications for the current user
    const userId = '68d295e638cbeb79a7d7cf8e'; // Current user from logs
    
    const testNotifications = [
      {
        recipient: userId,
        type: 'OFFER_MADE',
        message: 'Someone made an offer on your task "Test Task 1"',
        title: 'New Offer Received',
        isRead: false,
        priority: 'HIGH'
      },
      {
        recipient: userId,
        type: 'TASK_COMPLETED',
        message: 'Your task "Test Task 2" has been completed',
        title: 'Task Completed',
        isRead: false,
        priority: 'NORMAL'
      },
      {
        recipient: userId,
        type: 'PAYMENT_RECEIVED',
        message: 'You received a payment of $50',
        title: 'Payment Received',
        isRead: true,
        priority: 'HIGH'
      },
      {
        recipient: userId,
        type: 'MESSAGE_RECEIVED',
        message: 'You have a new message from John Doe',
        title: 'New Message',
        isRead: false,
        priority: 'LOW'
      },
      {
        recipient: userId,
        type: 'TASK_ASSIGNED',
        message: 'You have been assigned a new task',
        title: 'New Task Assignment',
        isRead: false,
        priority: 'HIGH'
      }
    ];
    
    // Delete existing notifications first
    await Notification.deleteMany({});
    console.log('Cleared existing notifications');
    
    // Create new test notifications
    const created = await Notification.insertMany(testNotifications);
    console.log(`Created ${created.length} test notifications`);
    
    // Verify the count
    const total = await Notification.countDocuments({ recipient: userId });
    const unread = await Notification.countDocuments({ recipient: userId, isRead: false });
    
    console.log(`Statistics for user ${userId}:`);
    console.log(`Total: ${total}, Unread: ${unread}, Read: ${total - unread}`);
    
    // Show the notifications
    const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
    console.log('\nCreated notifications:');
    notifications.forEach((n, index) => {
      console.log(`${index + 1}. ${n.title} - ${n.message} (${n.isRead ? 'Read' : 'Unread'})`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });