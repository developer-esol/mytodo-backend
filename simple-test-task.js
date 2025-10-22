// Simple test script to create minimal test task
const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');

async function createSimpleTask() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mytodo');
    console.log('Connected to MongoDB');

    // Use existing admin user
    const admin = await User.findOne({ email: 'admin@mytodo.com' });
    if (!admin) {
      console.error('Admin user not found');
      return;
    }

    console.log('Using admin user:', admin._id.toString());

    // Create minimal task
    const task = new Task({
      title: 'Simple Group Chat Test',
      categories: ['test'],
      dateType: 'Easy',
      dateRange: {
        start: new Date(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
      },
      time: 'anytime',
      location: {
        address: 'Test Location'
      },
      details: 'Simple test task for group chat',
      budget: 50,
      currency: 'USD',
      createdBy: admin._id
    });

    await task.save();
    console.log('Created task:', task._id.toString());

    console.log('\nTest with this task ID:', task._id.toString());
    console.log('API URL: POST http://localhost:5001/api/group-chats/' + task._id.toString() + '/messages');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

createSimpleTask();