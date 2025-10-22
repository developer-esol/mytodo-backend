// Direct test of joinGroupChat logic without HTTP
const mongoose = require('mongoose');

// Import models
const Task = require('./models/Task');
const Offer = require('./models/Offer'); 
const User = require('./models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/airTaskerDB')
  .then(() => console.log('MongoDB connected for direct test'))
  .catch(err => console.log('MongoDB connection error:', err));

async function testJoinGroupChatLogic() {
  try {
    const taskId = '68e764a59d20929e97a0687e'; // Updated to match frontend error
    const userId = '68d295e638cbeb79a7d7cf8e'; // kasun Pasan

    console.log('Testing joinGroupChat logic directly...');
    console.log(`Task ID: ${taskId}`);
    console.log(`User ID: ${userId}`);

    // Step 1: Find the task
    const task = await Task.findById(taskId).populate('createdBy');
    console.log(`\n--- Task Lookup ---`);
    if (!task) {
      console.log('Task not found!');
      
      // Let's see what tasks exist
      console.log('\n--- Available Tasks ---');
      const allTasks = await Task.find().select('_id title createdBy').limit(10);
      console.log(`Found ${allTasks.length} tasks in database:`);
      allTasks.forEach((t, index) => {
        console.log(`Task ${index + 1}: ${t._id} - ${t.title || 'No title'}`);
      });
      
      return;
    }
    console.log(`Found task: ${task.title || task._id}`);
    console.log(`Task created by: ${task.createdBy?._id || task.createdBy}`);

    // Step 2: Check if user is the task poster
    const isTaskPoster = task.createdBy._id.toString() === userId;
    console.log(`\n--- Permission Check ---`);
    console.log(`Is user task poster? ${isTaskPoster}`);

    // Step 3: Check if user has made an offer
    console.log(`\n--- Offer Lookup ---`);
    const userOffer = await Offer.findOne({ taskId, taskTakerId: userId });
    console.log(`User offer found: ${userOffer ? 'Yes' : 'No'}`);
    if (userOffer) {
      console.log(`Offer details:`, {
        id: userOffer._id,
        amount: userOffer.offer?.amount,
        status: userOffer.status,
        createdAt: userOffer.createdAt
      });
    }

    const hasOffer = !!userOffer;
    console.log(`Has offer: ${hasOffer}`);

    // Step 4: Final permission result
    console.log(`\n--- Final Result ---`);
    const canJoin = isTaskPoster || hasOffer;
    console.log(`Can join group chat: ${canJoin}`);
    console.log(`Reason: ${isTaskPoster ? 'Task poster' : hasOffer ? 'Has offer' : 'No permission'}`);

    // Step 5: Debug - show all offers for this task
    console.log(`\n--- All Offers for Task ---`);
    const allOffers = await Offer.find({ taskId }).limit(5);
    console.log(`Total offers found for task: ${allOffers.length}`);
    allOffers.forEach((offer, index) => {
      console.log(`Offer ${index + 1}:`, {
        id: offer._id,
        taskTakerId: offer.taskTakerId,
        amount: offer.offer?.amount,
        status: offer.status
      });
    });

    // Step 6: Debug - show all offers by this user
    console.log(`\n--- All Offers by User ---`);
    const userOffers = await Offer.find({ taskTakerId: userId }).limit(5);
    console.log(`Total offers found by user: ${userOffers.length}`);
    userOffers.forEach((offer, index) => {
      console.log(`User offer ${index + 1}:`, {
        id: offer._id,
        taskId: offer.taskId,
        amount: offer.offer?.amount,
        status: offer.status
      });
    });

  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    mongoose.connection.close();
  }
}

testJoinGroupChatLogic();