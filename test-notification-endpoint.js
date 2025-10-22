// Test notification endpoint
const express = require('express');
const Notification = require('./models/Notification');
const mongoose = require('mongoose');

const app = express();

// Direct connection to test
mongoose.connect('mongodb://localhost:27017/airtasksystem');

// Test endpoint
app.get('/test-notifications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Testing notifications for user: ${userId}`);
    
    // Direct database query
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const total = await Notification.countDocuments({ recipient: userId });
    const unread = await Notification.countDocuments({ recipient: userId, isRead: false });
    
    console.log(`Found ${notifications.length} notifications, total: ${total}, unread: ${unread}`);
    
    res.json({
      success: true,
      userId: userId,
      stats: { total, unread, read: total - unread },
      notifications: notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/test-notifications/68d295e638cbeb79a7d7cf8e`);
});