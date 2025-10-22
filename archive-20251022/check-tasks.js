// Check what tasks exist in the database
const mongoose = require('mongoose');
const Task = require('./models/Task');

async function checkTasks() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/air-tasker');
    console.log('✅ Connected to MongoDB');

    // Find completed tasks
    const completedTasks = await Task.find({ status: 'completed' }).select('_id title status budget currency').limit(10);
    
    console.log('📋 Found completed tasks:');
    completedTasks.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task._id}, Title: "${task.title}", Status: ${task.status}, Budget: ${task.budget} ${task.currency}`);
    });

    // Check the specific task that's failing
    const specificTask = await Task.findById('68e604d298c0d42cff502eec');
    if (specificTask) {
      console.log('\n🔍 Specific task found:', {
        id: specificTask._id,
        title: specificTask.title,
        status: specificTask.status,
        budget: specificTask.budget,
        currency: specificTask.currency,
        acceptedOffer: specificTask.acceptedOffer ? 'Yes' : 'No'
      });
    } else {
      console.log('\n❌ Specific task 68e604d298c0d42cff502eec NOT found in database');
      
      // Check if there are any tasks with similar IDs
      console.log('\n🔍 Looking for tasks with similar IDs...');
      const similarTasks = await Task.find({}).select('_id title status').limit(5);
      similarTasks.forEach(task => {
        console.log(`- ${task._id} (${task.title}) - ${task.status}`);
      });
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

checkTasks().catch(console.error);