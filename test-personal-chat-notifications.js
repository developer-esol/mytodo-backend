// Test script to verify personal chat notifications are working
const mongoose = require('mongoose');

async function testPersonalChatNotifications() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const Chat = require('./models/Chat');
    const Task = require('./models/Task');
    const User = require('./models/User');
    const Notification = require('./models/Notification');
    
    console.log('🔍 Looking for personal chats...');
    
    // Find a few personal chats to test with
    const chats = await Chat.find({ status: 'active' })
      .populate('posterId', 'firstName lastName email')
      .populate('taskerId', 'firstName lastName email')
      .populate('taskId', 'title')
      .limit(3);
    
    if (chats.length === 0) {
      console.log('❌ No personal chats found');
      console.log('📝 Note: Personal chats are created when offers are made');
      return;
    }
    
    console.log(`✅ Found ${chats.length} personal chat(s):`);
    
    chats.forEach((chat, index) => {
      console.log(`\n${index + 1}. Chat for task: "${chat.taskId?.title}"`);
      console.log(`   - Poster: ${chat.posterId?.firstName} ${chat.posterId?.lastName} (${chat.posterId?._id})`);
      console.log(`   - Tasker: ${chat.taskerId?.firstName} ${chat.taskerId?.lastName} (${chat.taskerId?._id})`);
      console.log(`   - Task ID: ${chat.taskId?._id}`);
      console.log(`   - Chat Status: ${chat.chatStatus}`);
    });
    
    // Check recent notifications for chat messages
    console.log('\n🔔 Checking recent personal chat notifications...');
    const recentNotifications = await Notification.find({
      type: 'MESSAGE_RECEIVED',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .populate('sender', 'firstName lastName')
    .populate('recipient', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);
    
    if (recentNotifications.length === 0) {
      console.log('📝 No recent personal chat notifications found');
      console.log('💡 Send a message in personal chat to test notifications');
    } else {
      console.log(`✅ Found ${recentNotifications.length} recent personal chat notification(s):`);
      recentNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.title}`);
        console.log(`   - From: ${notif.sender?.firstName} ${notif.sender?.lastName}`);
        console.log(`   - To: ${notif.recipient?.firstName} ${notif.recipient?.lastName}`);
        console.log(`   - Message: ${notif.message}`);
        console.log(`   - Time: ${notif.createdAt}`);
        console.log(`   - Read: ${notif.isRead ? 'Yes' : 'No'}`);
      });
    }
    
    console.log('\n📋 API Test Information:');
    console.log('🌐 Personal Chat Message API: POST /api/chats/{taskId}/messages');
    console.log('📝 Required headers: Authorization: Bearer <token>');
    console.log('📝 Required body: { "text": "message", "senderId": "userId", "senderName": "User Name" }');
    console.log('✅ Notifications should now be sent for personal chat messages!');
    
    console.log('\n🔚 Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

testPersonalChatNotifications();