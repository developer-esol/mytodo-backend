const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const Payment = require('./models/Payment');
const Offer = require('./models/Offer');

async function debugTaskData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const taskId = '68c1208ecf90217bcd4467f9';
    
    // Get task WITHOUT population to see raw IDs
    const taskRaw = await Task.findById(taskId);
    console.log('📋 RAW TASK DATA:');
    console.log('  _id:', taskRaw._id);
    console.log('  createdBy:', taskRaw.createdBy);
    console.log('  assignedTo:', taskRaw.assignedTo);
    console.log('  status:', taskRaw.status);
    
    // Try to populate
    const taskPopulated = await Task.findById(taskId)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    console.log('\n📋 POPULATED TASK DATA:');
    console.log('  createdBy result:', taskPopulated.createdBy);
    console.log('  assignedTo result:', taskPopulated.assignedTo);
    
    // Check if users exist
    if (taskRaw.createdBy) {
      const posterUser = await User.findById(taskRaw.createdBy);
      console.log('\n👤 POSTER USER (createdBy):');
      console.log('  ID:', taskRaw.createdBy);
      console.log('  Found:', posterUser ? 'YES' : 'NO');
      if (posterUser) {
        console.log('  Name:', posterUser.firstName, posterUser.lastName);
      }
    } else {
      console.log('\n❌ Task.createdBy is NULL/undefined!');
    }
    
    if (taskRaw.assignedTo) {
      const taskerUser = await User.findById(taskRaw.assignedTo);
      console.log('\n👤 TASKER USER (assignedTo):');
      console.log('  ID:', taskRaw.assignedTo);
      console.log('  Found:', taskerUser ? 'YES' : 'NO');
      if (taskerUser) {
        console.log('  Name:', taskerUser.firstName, taskerUser.lastName);
      }
    } else {
      console.log('\n❌ Task.assignedTo is NULL/undefined!');
    }
    
    // Check offer
    const offer = await Offer.findOne({ taskId: taskId });
    console.log('\n🤝 OFFER DATA:');
    console.log('  taskTakerId:', offer.taskTakerId);
    
    if (offer.taskTakerId) {
      const offerTaker = await User.findById(offer.taskTakerId);
      console.log('  Task Taker User Found:', offerTaker ? 'YES' : 'NO');
      if (offerTaker) {
        console.log('  Name:', offerTaker.firstName, offerTaker.lastName);
      }
    }
    
    // Check payment
    const payment = await Payment.findOne({ task: taskId });
    console.log('\n💳 PAYMENT DATA:');
    console.log('  user field:', payment.user);
    console.log('  tasker field:', payment.tasker);
    
    if (payment.user) {
      const paymentUser = await User.findById(payment.user);
      console.log('  Payment User Found:', paymentUser ? 'YES' : 'NO');
      if (paymentUser) {
        console.log('  Name:', paymentUser.firstName, paymentUser.lastName);
      }
    }
    
    if (payment.tasker) {
      const paymentTasker = await User.findById(payment.tasker);
      console.log('  Payment Tasker Found:', paymentTasker ? 'YES' : 'NO');
      if (paymentTasker) {
        console.log('  Name:', paymentTasker.firstName, paymentTasker.lastName);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DIAGNOSIS:');
    
    if (!taskRaw.createdBy) {
      console.log('❌ CRITICAL: Task.createdBy is NULL!');
      console.log('   → Cannot generate receipts without poster information');
      console.log('   → Need to fix task data or use alternative field');
    }
    
    if (payment.user && !taskRaw.createdBy) {
      console.log('\n💡 SOLUTION: Use payment.user as poster instead of task.createdBy');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugTaskData();
