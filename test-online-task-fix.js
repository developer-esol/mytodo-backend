/**
 * Test Online Task Creation Fix
 * 
 * This tests that Online tasks can be created WITHOUT coordinates
 * and that the validation error is resolved.
 */

const mongoose = require("mongoose");
const Task = require("./models/Task");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/airtasker-db")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

async function testOnlineTaskCreation() {
  try {
    console.log("\n🧪 Testing Online Task Creation (NO coordinates)...\n");

    // Simulate the exact data from the frontend
    const testData = {
      title: 'test huuu',
      categories: ['Web & App Development', 'Real Estate'],
      locationType: 'Online',
      time: 'Anytime',
      location: {
        address: 'Remote',
        // NO coordinates field at all
      },
      details: 'ibibilbjjjjjjjjnjbjblbb  jbihubububububuubuub',
      budget: 67000,
      currency: 'LKR',
      dateType: 'DoneOn',
      dateRange: {
        start: new Date('2025-10-20T00:00:00.000Z'),
        end: new Date('2025-10-20T23:59:59.999Z')
      },
      images: ['https://chamithimageupload.s3.eu-north-1.amazonaws.com/tasks/test.png'],
      status: 'open',
      createdBy: new mongoose.Types.ObjectId('68bba9aa738031d9bcf0bdf3')
    };

    console.log("📤 Creating task with data:");
    console.log(JSON.stringify(testData, null, 2));

    const task = new Task(testData);
    await task.save();

    console.log("\n✅ SUCCESS! Online task created without coordinates error!");
    console.log("\n📋 Created task:");
    console.log(`  ID: ${task._id}`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Location Type: ${task.locationType}`);
    console.log(`  Location Address: ${task.location.address}`);
    console.log(`  Has Coordinates: ${task.location.coordinates ? 'YES' : 'NO'}`);
    if (task.location.coordinates) {
      console.log(`  Coordinates Object:`, JSON.stringify(task.location.coordinates, null, 2));
    }
    // Clean up
    await Task.deleteOne({ _id: task._id });
    console.log("\n🧹 Test task deleted");

    console.log("\n✅ TEST PASSED: Online tasks work without coordinates!\n");

  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error:", error.message);
    if (error.errors) {
      console.error("\nValidation Errors:");
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    console.error("\n");
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
  }
}

testOnlineTaskCreation();
