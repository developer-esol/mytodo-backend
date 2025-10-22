// Simple test for moving task creation
const mongoose = require('mongoose');
require('dotenv').config();

async function testMovingTask() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Task = require('./models/Task');
    const User = require('./models/User');

    // Find an existing user
    const user = await User.findOne({}).limit(1);
    if (!user) {
      console.log('No users found in database');
      return;
    }

    console.log('Using user:', user.firstName, user.lastName);

    // Test 1: Create a moving task (mobile scenario)
    console.log('\n🚛 Testing Moving Task Creation...');
    
    const movingTask = new Task({
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
      details: 'Need help moving a large couch. Heavy and requires 2-3 people.',
      budget: 150,
      currency: 'USD',
      createdBy: user._id,
      // Moving-specific fields
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
    console.log('Pickup Location:', movingTask.movingDetails.pickupLocation.address);
    console.log('Pickup Postal Code:', movingTask.movingDetails.pickupLocation.postalCode);
    console.log('Dropoff Location:', movingTask.movingDetails.dropoffLocation.address);
    console.log('Dropoff Postal Code:', movingTask.movingDetails.dropoffLocation.postalCode);

    // Test 2: Retrieve the task to verify data persistence
    console.log('\n📖 Testing task retrieval...');
    const retrievedTask = await Task.findById(movingTask._id);
    
    if (retrievedTask.isMovingTask && retrievedTask.movingDetails) {
      console.log('✅ Moving details preserved in database');
      console.log('Retrieved pickup postal code:', retrievedTask.movingDetails.pickupLocation.postalCode);
      console.log('Retrieved dropoff postal code:', retrievedTask.movingDetails.dropoffLocation.postalCode);
    } else {
      console.log('❌ Moving details not properly saved');
    }

    // Test 3: Create a normal task (should not have moving details)
    console.log('\n🏠 Testing Normal Task Creation...');
    
    const normalTask = new Task({
      title: 'Clean the house',
      categories: ['cleaning'],
      dateType: 'Easy',
      dateRange: {
        start: new Date(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      },
      time: 'anytime',
      location: {
        address: 'My house'
      },
      details: 'Need someone to clean the entire house',
      budget: 100,
      currency: 'USD',
      createdBy: user._id
      // No moving fields - should default to false
    });

    await normalTask.save();
    console.log('✅ Normal task created successfully!');
    console.log('Is Moving Task:', normalTask.isMovingTask || false);

    console.log('\n🧪 API Endpoint Information:');
    console.log('For mobile app requests, include these headers:');
    console.log('- User-Agent: MyToDoo-Mobile/1.0.0');
    console.log('- X-Platform: mobile');
    console.log('\nAnd include these fields in the request body for moving tasks:');
    console.log('- isMovingTask: true');
    console.log('- pickupLocation: "address"');
    console.log('- pickupPostalCode: "12345"');
    console.log('- dropoffLocation: "address"');
    console.log('- dropoffPostalCode: "67890"');

    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testMovingTask();