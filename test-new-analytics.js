// Test the new analytics endpoint structure
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testAnalytics = async () => {
  await connectDB();
  
  const User = require('./models/User');
  const Task = require('./models/Task');
  const Payment = require('./models/Payment');
  
  try {
    console.log('\n📊 Testing Analytics Data Structure...\n');
    
    // Overview data
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });
    const totalTasks = await Task.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    
    console.log('Overview:');
    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Total Tasks: ${totalTasks}`);
    console.log(`  Active Users: ${activeUsers}`);
    
    // User stats
    const userRoles = await User.aggregate([
      {
        $match: { status: { $ne: 'deleted' } }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\nUser Stats:');
    userRoles.forEach(role => {
      console.log(`  ${role._id}: ${role.count}`);
    });
    
    // Task stats
    const taskStatuses = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\nTask Stats:');
    taskStatuses.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });
    
    // Revenue stats
    const completedPayments = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$serviceFee' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\nRevenue Stats:');
    if (completedPayments.length > 0) {
      console.log(`  Total Payments: $${completedPayments[0].totalAmount.toFixed(2)}`);
      console.log(`  Total Fees: $${completedPayments[0].totalFees.toFixed(2)}`);
      console.log(`  Transaction Count: ${completedPayments[0].count}`);
    } else {
      console.log('  No completed payments found');
    }
    
    console.log('\n✅ Analytics data test complete!');
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 MongoDB disconnected');
  }
};

testAnalytics();
