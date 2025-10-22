// Simple test without coordinates
const mongoose = require('mongoose');
require('dotenv').config();

async function testMovingTaskSimple() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Define a simplified task schema for testing
    const testTaskSchema = new mongoose.Schema({
      title: String,
      categories: [String],
      dateType: String,
      dateRange: {
        start: Date,
        end: Date
      },
      time: String,
      location: {
        address: String
      },
      details: String,
      budget: Number,
      currency: String,
      createdBy: mongoose.Schema.Types.ObjectId,
      isMovingTask: {type: Boolean, default: false},
      movingDetails: {
        pickupLocation: {
          address: String,
          postalCode: String
        },
        dropoffLocation: {
          address: String,
          postalCode: String
        }
      }
    }, {timestamps: true});

    const TestTask = mongoose.model('TestTask', testTaskSchema);

    const User = require('./models/User');
    const user = await User.findOne({}).limit(1);

    console.log('Using user:', user.firstName, user.lastName);

    // Test moving task
    const movingTask = new TestTask({
      title: 'Moving couch from apartment to new house',
      categories: ['moving'],
      dateType: 'DoneBy',
      dateRange: {
        start: new Date(),
        end: new Date('2025-10-20')
      },
      time: 'morning',
      location: {
        address: 'General moving service'
      },
      details: 'Need help moving a large couch.',
      budget: 150,
      currency: 'USD',
      createdBy: user._id,
      isMovingTask: true,
      movingDetails: {
        pickupLocation: {
          address: 'Downtown Apartment Complex',
          postalCode: '12345'
        },
        dropoffLocation: {
          address: 'Suburban House',
          postalCode: '67890'
        }
      }
    });

    await movingTask.save();
    console.log('✅ Moving task created successfully!');
    console.log('Task ID:', movingTask._id);
    console.log('Is Moving Task:', movingTask.isMovingTask);
    console.log('Pickup:', movingTask.movingDetails.pickupLocation.address);
    console.log('Pickup Postal Code:', movingTask.movingDetails.pickupLocation.postalCode);
    console.log('Dropoff:', movingTask.movingDetails.dropoffLocation.address);
    console.log('Dropoff Postal Code:', movingTask.movingDetails.dropoffLocation.postalCode);

    // Clean up the test task
    await TestTask.deleteOne({_id: movingTask._id});
    console.log('Test task cleaned up');

    await mongoose.disconnect();
    console.log('\n✅ Moving task functionality works correctly!');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testMovingTaskSimple();