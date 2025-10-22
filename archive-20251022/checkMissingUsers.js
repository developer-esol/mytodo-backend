const mongoose = require('mongoose');
require('dotenv').config();

async function checkMissingUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const Task = require('./models/Task');
    const User = require('./models/User');
    
    // Get all tasks and check for missing users
    const tasks = await Task.find({}).limit(10);
    
    console.log('Checking tasks for missing users:');
    
    for (let task of tasks) {
      const createdByUser = await User.findById(task.createdBy);
      const assignedToUser = task.assignedTo ? await User.findById(task.assignedTo) : null;
      
      console.log(`\nTask: ${task.title}`);
      console.log(`Created By ID: ${task.createdBy}`);
      console.log(`Created By User: ${createdByUser ? `${createdByUser.firstName} ${createdByUser.lastName}` : 'NOT FOUND'}`);
      console.log(`Assigned To ID: ${task.assignedTo || 'None'}`);
      console.log(`Assigned To User: ${assignedToUser ? `${assignedToUser.firstName} ${assignedToUser.lastName}` : 'None/NOT FOUND'}`);
    }
    
    // Also test the exact query from admin routes
    console.log('\n=== Testing Admin Route Query ===');
    const adminTasks = await Task.find({})
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);
      
    console.log('Admin route results:');
    adminTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title}`);
      console.log(`   Created By: ${task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'NULL'}`);
      console.log(`   Assigned To: ${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'NULL'}`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMissingUsers();