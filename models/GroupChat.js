const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['poster', 'tasker'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const groupChatSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    unique: true
  },
  posterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firebaseChatId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [participantSchema],
  settings: {
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    allowNewParticipants: {
      type: Boolean,
      default: true
    }
  },
  lastMessage: {
    text: String,
    senderId: String,
    senderName: String,
    timestamp: Date,
    messageType: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Static method to find group chat by task ID
groupChatSchema.statics.findByTaskId = function(taskId) {
  return this.findOne({ taskId }).populate('participants.userId', 'firstName lastName avatar rating');
};

// Static method to create group chat for a task
groupChatSchema.statics.createForTask = async function(taskId, posterId) {
  const firebaseChatId = `group_${taskId}_${uuidv4()}`;
  
  const groupChat = new this({
    taskId,
    posterId,
    firebaseChatId,
    participants: [{
      userId: posterId,
      role: 'poster',
      isActive: true
    }]
  });
  
  await groupChat.save();
  return await this.findByTaskId(taskId);
};

// Instance method to add a participant
groupChatSchema.methods.addParticipant = function(userId, role = 'tasker') {
  // Check if participant already exists
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    // Reactivate if inactive
    existingParticipant.isActive = true;
    return;
  }
  
  // Add new participant
  this.participants.push({
    userId,
    role,
    isActive: true,
    joinedAt: new Date()
  });
};

// Instance method to get active participants
groupChatSchema.methods.getActiveParticipants = function() {
  return this.participants.filter(p => p.isActive);
};

// Instance method to update last message
groupChatSchema.methods.updateLastMessage = function(messageData) {
  this.lastMessage = {
    text: messageData.text,
    senderId: messageData.senderId,
    senderName: messageData.senderName,
    timestamp: messageData.timestamp || new Date(),
    messageType: messageData.messageType || 'text'
  };
};

// Instance method to remove a participant
groupChatSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
  }
};

const GroupChat = mongoose.model('GroupChat', groupChatSchema);

module.exports = GroupChat;