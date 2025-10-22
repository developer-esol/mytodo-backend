const mongoose = require('mongoose');
require('dotenv').config();

async function checkTaskStructure() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const Task = require('./models/Task');
    
    // Get a few tasks to see their structure
    const tasks = await Task.find({}).limit(3);
    console.log('Sample tasks:');
    tasks.forEach((task, index) => {
      console.log(`\nTask ${index + 1}:`);
      console.log('ID:', task._id);
      console.log('Title:', task.title);
      console.log('Created By:', task.createdBy);
      console.log('Assigned To:', task.assignedTo);
      console.log('Status:', task.status);
      console.log('All Fields:', Object.keys(task.toObject()));
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTaskStructure();