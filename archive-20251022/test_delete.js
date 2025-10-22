

// test_delete.js // Quick test script to test DELETE functionality
const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');
const Offer = require('./models/Offer');
const User = require('./models/User');

async function testDelete() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find a test task - check the task being updated in the error
    const taskId = '68bddd35822b6cd94f8f2fdd'; // This is the task from the PUT error
    const userId = '68bba9aa738031d9bcf0bdf3';
    
    console.log('Looking for task ID:', taskId);
    console.log('User ID trying to delete:', userId);
    
    const task = await Task.findById(taskId);
    
    if (task) {
      console.log('Task found:', {
        id: task._id,
        title: task.title,
        status: task.status,
        createdBy: task.createdBy,
        createdByString: task.createdBy.toString()
      });

      console.log('User match check:', {
        taskCreator: task.createdBy.toString(),
        deletingUser: userId,
        matches: task.createdBy.toString() === userId
      });

      // Get both users' details
      const taskOwner = await User.findById(task.createdBy);
      const currentUser = await User.findById(userId);
      
      console.log('Task owner details:', taskOwner ? {
        id: taskOwner._id,
        email: taskOwner.email,
        firstName: taskOwner.firstName,
        lastName: taskOwner.lastName
      } : 'User not found');
      
      console.log('Current user details:', currentUser ? {
        id: currentUser._id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName
      } : 'User not found');

      // Check if task can be deleted (status should be 'open')
      console.log('Can delete check:', {
        status: task.status,
        canDelete: task.status === 'open'
      });

      // Check offers for this task
      const offers = await Offer.find({ taskId: taskId });
      console.log(`Found ${offers.length} offers for this task`);
      
      console.log('\n=== CONCLUSION ===');
      if (task.createdBy.toString() === userId) {
        console.log('✅ User should be authorized to update this task');
      } else {
        console.log('❌ User is NOT authorized - this is correct behavior');
        console.log('The 401 error is working as intended - user cannot modify someone else\'s task');
      }
    } else {
      console.log('Task not found with ID:', taskId);
      
      // Find tasks created by the current user
      const userTasks = await Task.find({ createdBy: userId }).limit(5);
      console.log(`Found ${userTasks.length} tasks created by user:`, userId);
      
      if (userTasks.length > 0) {
        userTasks.forEach(t => {
          console.log(`- Task ID: ${t._id}, Title: "${t.title}", Status: ${t.status}`);
        });
        
        // Test with the first user's task
        const testTask = userTasks[0];
        console.log('\nTesting update with user\'s own task:', {
          taskId: testTask._id,
          title: testTask.title,
          createdBy: testTask.createdBy,
          userId: userId,
          authorized: testTask.createdBy.toString() === userId
        });
      }
      
      // Also find some other tasks to see what exists
      const allTasks = await Task.find({}).limit(3);
      if (allTasks.length > 0) {
        console.log('\nFound some other tasks:');
        allTasks.forEach(t => {
          console.log(`- Task ID: ${t._id}, Title: "${t.title}", CreatedBy: ${t.createdBy}, Status: ${t.status}`);
        });
      }
      
      console.log('\n=== CONCLUSION ===');
      console.log('⚠️  Task does not exist - frontend might be using stale data or wrong task ID');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDelete();