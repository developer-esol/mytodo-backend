const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { db } = require('../config/firebase-admin');
const admin = require('firebase-admin');
const GroupChat = require('../models/GroupChat');
const Chat = require('../models/Chat');
const Task = require('../models/Task');
const User = require('../models/User');
const Offer = require('../models/Offer');
const notificationService = require('../services/notificationService');
const { protect } = require('../middleware/authMiddleware');

// Get chat messages (individual chats - legacy support)
router.get('/chats/:taskId/messages', async (req, res) => {
  try {
    const chatId = `task_${req.params.taskId}`;
    const snapshot = await db.collection('chats').doc(chatId)
                          .collection('messages')
                          .orderBy('timestamp', 'asc')
                          .get();
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message (individual chats - legacy support)
router.post('/chats/:taskId/messages', protect, async (req, res) => {
  try {
    const chatId = `task_${req.params.taskId}`;
    const { text, senderId, senderName } = req.body;
    const { taskId } = req.params;
    
    // Validate required fields
    if (!text || !senderId || !senderName) {
      return res.status(400).json({ 
        error: 'Missing required fields: text, senderId, senderName' 
      });
    }

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ 
        error: 'Invalid task ID format' 
      });
    }

    // Verify user is authenticated and senderId matches
    const authenticatedUserId = req.user._id.toString();
    if (senderId !== authenticatedUserId) {
      return res.status(403).json({ 
        error: 'Sender ID must match authenticated user' 
      });
    }

    // Get task details
    const task = await Task.findById(taskId)
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('assignedTo', 'firstName lastName email avatar');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Find the chat between the users
    const chat = await Chat.findOne({
      taskId: taskId,
      $or: [
        { posterId: task.createdBy._id, taskerId: authenticatedUserId },
        { posterId: authenticatedUserId, taskerId: task.createdBy._id },
        { posterId: task.createdBy._id, taskerId: task.assignedTo?._id },
        { posterId: task.assignedTo?._id, taskerId: task.createdBy._id }
      ]
    }).populate('posterId', 'firstName lastName email avatar')
      .populate('taskerId', 'firstName lastName email avatar');

    if (!chat) {
      return res.status(404).json({ 
        error: 'No chat found between users for this task' 
      });
    }

    // Verify user has access to this chat
    const isPoster = chat.posterId._id.toString() === authenticatedUserId;
    const isTasker = chat.taskerId._id.toString() === authenticatedUserId;
    
    if (!isPoster && !isTasker) {
      return res.status(403).json({ 
        error: 'Access denied to this chat' 
      });
    }

    // Determine the recipient
    const recipient = isPoster ? chat.taskerId : chat.posterId;
    const sender = req.user;

    // Save message to Firebase
    const docRef = await db.collection('chats').doc(chatId)
                         .collection('messages')
                         .add({
                           text,
                           senderId,
                           senderName,
                           timestamp: admin.firestore.FieldValue.serverTimestamp(),
                           messageType: 'text'
                         });
    
    // Send notification to the recipient
    try {
      await notificationService.notifyMessageReceived(
        { content: text }, // message object
        chat,              // chat object  
        sender,            // sender user
        recipient,         // recipient user
        task               // task object
      );
      console.log(`✅ Personal chat notification sent: ${sender.firstName} → ${recipient.firstName}`);
    } catch (notifError) {
      console.error('Error sending personal chat notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({ 
      id: docRef.id,
      success: true,
      message: 'Message sent and notification delivered',
      chatId: chat._id,
      recipientId: recipient._id
    });
  } catch (error) {
    console.error('Error sending personal chat message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get group chat messages
router.get('/group-chats/:taskId/messages', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user._id.toString();

    // Get group chat info
    const groupChat = await GroupChat.findByTaskId(taskId);
    if (!groupChat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Verify user has access to this group chat
    const hasAccess = groupChat.posterId.toString() === userId || 
                     groupChat.participants.some(p => 
                       p.userId.toString() === userId && p.isActive
                     );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to group chat' });
    }

    // Get messages from Firebase
    const chatId = groupChat.firebaseChatId;
    let query = db.collection('group-chats').doc(chatId)
                  .collection('messages')
                  .orderBy('timestamp', 'desc');

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const snapshot = await query.get();
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })).reverse(); // Reverse to get chronological order
    
    res.json({
      success: true,
      groupChatId: groupChat._id,
      firebaseChatId: chatId,
      messages,
      participantCount: groupChat.getActiveParticipants().length
    });
  } catch (error) {
    console.error('Error fetching group chat messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send group chat message
router.post('/group-chats/:taskId/messages', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { 
      text, 
      messageType = 'text',
      metadata = {} 
    } = req.body;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ 
        error: 'Invalid task ID format' 
      });
    }

    // Get user info from authenticated user
    const senderId = req.user._id.toString();
    const senderName = `${req.user.firstName} ${req.user.lastName}`;
    const senderAvatar = req.user.avatar;

    // Validate required fields
    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required field: text' 
      });
    }

    // Get task info first
    const task = await Task.findById(taskId).populate('createdBy', 'firstName lastName avatar email');
    
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found. Please check if the task exists and you have access to it.' 
      });
    }

    // Check if user has permission to access this task
    const isTaskPoster = task.createdBy._id.toString() === senderId;
    
    // Check if user has made an offer (is a tasker)
    const userOffer = await Offer.findOne({ 
      taskId: taskId, 
      taskTakerId: senderId 
    });
    const isTasker = !!userOffer;

    if (!isTaskPoster && !isTasker) {
      return res.status(403).json({
        error: 'Access denied. Only the task poster or users who have made offers can send messages to this group chat.'
      });
    }

    // Get or create group chat if user has access
    let groupChat = await GroupChat.findByTaskId(taskId);

    if (!groupChat) {
      // Create new group chat if user has access
      groupChat = await GroupChat.createForTask(taskId, task.createdBy._id);
    }

    // Add user as participant if they're a tasker and not already added
    if (isTasker && !groupChat.participants.find(p => p.userId.toString() === senderId)) {
      groupChat.addParticipant(senderId, "tasker");
      await groupChat.save();

      // Notify poster about new tasker joining
      if (groupChat.settings.notificationsEnabled) {
        try {
          await notificationService.notifyGroupChatParticipantJoined(
            groupChat, task, req.user, task.createdBy
          );
        } catch (notifError) {
          console.error("Error sending participant joined notification:", notifError);
        }
      }
    }

    // Verify sender has access to this group chat (double check after creation/update)
    const isPoster = groupChat.posterId.toString() === senderId;
    const isParticipant = groupChat.participants.some(p => 
      p.userId.toString() === senderId && p.isActive
    );
    const hasAccess = isPoster || isParticipant;

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied to send message in group chat. You must be the task poster or an active participant.'
      });
    }

    // Use authenticated user as sender
    const sender = req.user;

    // Create message object
    const messageData = {
      text,
      senderId,
      senderName,
      senderAvatar: senderAvatar || sender.avatar,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      messageType,
      metadata,
      // Add sender role in the group chat
      senderRole: groupChat.posterId.toString() === senderId ? 'poster' : 'tasker'
    };

    // Save message to Firebase
    const chatId = groupChat.firebaseChatId;
    const docRef = await db.collection('group-chats').doc(chatId)
                         .collection('messages')
                         .add(messageData);

    // Update group chat with last message info
    const lastMessageData = {
      text,
      senderId,
      senderName,
      timestamp: new Date(),
      messageType
    };

    groupChat.updateLastMessage(lastMessageData);
    await groupChat.save();

    // Send notifications to all participants except sender
    try {
      await notificationService.notifyGroupChatMessage(
        groupChat, 
        task, 
        sender, 
        text, 
        messageType
      );
    } catch (notifError) {
      console.error('Error sending group chat notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.json({ 
      success: true,
      messageId: docRef.id,
      groupChatId: groupChat._id,
      firebaseChatId: chatId,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending group chat message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send system message to group chat (for offers, assignments, etc.)
router.post('/group-chats/:taskId/system-message', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { 
      text, 
      messageType, 
      triggerUserId, 
      metadata = {} 
    } = req.body;

    // Get group chat
    const groupChat = await GroupChat.findByTaskId(taskId);
    if (!groupChat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Create system message
    const messageData = {
      text,
      senderId: 'system',
      senderName: 'System',
      senderAvatar: null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      messageType: messageType || 'system',
      metadata: {
        ...metadata,
        triggerUserId,
        isSystemMessage: true
      },
      senderRole: 'system'
    };

    // Save to Firebase
    const chatId = groupChat.firebaseChatId;
    const docRef = await db.collection('group-chats').doc(chatId)
                         .collection('messages')
                         .add(messageData);

    // Update group chat last message
    groupChat.updateLastMessage({
      text,
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date(),
      messageType: messageType || 'system'
    });
    await groupChat.save();

    res.json({ 
      success: true,
      messageId: docRef.id,
      message: 'System message sent successfully'
    });

  } catch (error) {
    console.error('Error sending system message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get group chat participants
router.get('/group-chats/:taskId/participants', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id.toString();

    const groupChat = await GroupChat.findByTaskId(taskId);
    if (!groupChat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Verify user has access
    const hasAccess = groupChat.posterId.toString() === userId || 
                     groupChat.participants.some(p => 
                       p.userId.toString() === userId && p.isActive
                     );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activeParticipants = groupChat.getActiveParticipants().map(p => ({
      userId: p.userId._id,
      role: p.role,
      user: {
        id: p.userId._id,
        firstName: p.userId.firstName,
        lastName: p.userId.lastName,
        avatar: p.userId.avatar,
        rating: p.userId.rating
      },
      joinedAt: p.joinedAt,
      isActive: p.isActive
    }));

    res.json({
      success: true,
      participants: activeParticipants,
      participantCount: activeParticipants.length
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;