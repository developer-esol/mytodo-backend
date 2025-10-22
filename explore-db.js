// Check what's actually in the database
const mongoose = require('mongoose');

async function exploreDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📋 Available collections:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }

    // Check if there are tasks in the tasks collection
    const tasksCount = await db.collection('tasks').countDocuments();
    console.log(`\n📊 Tasks collection has ${tasksCount} documents`);

    if (tasksCount > 0) {
      // Get a sample task
      const sampleTask = await db.collection('tasks').findOne({});
      console.log('\n🔍 Sample task structure:', {
        id: sampleTask._id,
        title: sampleTask.title,
        status: sampleTask.status,
        budget: sampleTask.budget
      });

      // Check for completed tasks
      const completedCount = await db.collection('tasks').countDocuments({ status: 'completed' });
      console.log(`\n✅ Completed tasks: ${completedCount}`);

      if (completedCount > 0) {
        const completedTasks = await db.collection('tasks').find({ status: 'completed' }).limit(3).toArray();
        console.log('\n📋 Sample completed tasks:');
        completedTasks.forEach((task, index) => {
          console.log(`${index + 1}. ID: ${task._id}, Status: ${task.status}`);
        });
      }
    }

    // Check different database names that might exist
    const admin = db.admin();
    const dbs = await admin.listDatabases();
    console.log('\n🗃️ Available databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });

  } catch (error) {
    console.log('❌ Error:', error.message, error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

exploreDatabase().catch(console.error);