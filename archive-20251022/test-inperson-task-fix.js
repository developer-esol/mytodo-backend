/**
 * Test In-Person Task Creation with Coordinates
 */

const mongoose = require("mongoose");
const Task = require("./models/Task");

mongoose.connect("mongodb://localhost:27017/airtasker-db")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

async function testInPersonTaskCreation() {
  try {
    console.log("\n🧪 Testing In-Person Task Creation (WITH coordinates)...\n");

    const testData = {
      title: 'Fix my plumbing',
      categories: ['Plumbing'],
      locationType: 'In-person',
      time: 'Morning',
      location: {
        address: 'Melbourne VIC',
        coordinates: {
          type: 'Point',
          coordinates: [144.9631, -37.8136] // Melbourne [lng, lat]
        }
      },
      details: 'Need urgent plumbing fix',
      budget: 150,
      currency: 'AUD',
      dateType: 'Easy',
      dateRange: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      images: [],
      status: 'open',
      createdBy: new mongoose.Types.ObjectId('68bba9aa738031d9bcf0bdf3')
    };

    console.log("📤 Creating In-Person task with coordinates...");

    const task = new Task(testData);
    await task.save();

    console.log("\n✅ SUCCESS! In-Person task created WITH coordinates!");
    console.log("\n📋 Created task:");
    console.log(`  ID: ${task._id}`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Location Type: ${task.locationType}`);
    console.log(`  Location Address: ${task.location.address}`);
    console.log(`  Has Coordinates: ${task.location.coordinates ? 'YES' : 'NO'}`);
    if (task.location.coordinates) {
      console.log(`  Coordinates:`, task.location.coordinates.coordinates);
      console.log(`  Latitude: ${task.location.coordinates.coordinates[1]}`);
      console.log(`  Longitude: ${task.location.coordinates.coordinates[0]}`);
    }

    // Clean up
    await Task.deleteOne({ _id: task._id });
    console.log("\n🧹 Test task deleted");

    console.log("\n✅ TEST PASSED: In-Person tasks work WITH coordinates!\n");

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

testInPersonTaskCreation();
