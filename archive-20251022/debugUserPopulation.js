const mongoose = require('mongoose');
require('dotenv').config();

async function debugUserPopulation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const Task = require('./models/Task');
    const User = require('./models/User');
    
    // Get a task with populated user data
    const task = await Task.findOne({})
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    console.log('Task with populated users:');
    console.log('Task ID:', task._id);
    console.log('Title:', task.title);
    console.log('Created By:', task.createdBy);
    console.log('Assigned To:', task.assignedTo);
    
    // Also check if the user exists separately
    if (task.createdBy) {
      const User = require('./models/User');
      const user = await User.findById(task.createdBy._id || task.createdBy);
      console.log('User found separately:', user ? `${user.firstName} ${user.lastName}` : 'NOT FOUND');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUserPopulation();