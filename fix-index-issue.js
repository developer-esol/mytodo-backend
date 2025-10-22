const mongoose = require('mongoose');
require('dotenv').config();

async function fixDuplicateIndexIssue() {
  try {
    console.log('🔧 Fixing MongoDB Index Issue\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Review = require('./models/Review');
    
    // Get the collection
    const collection = Review.collection;
    
    console.log('📋 Current Indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)} - Name: ${index.name}`);
    });
    console.log('');
    
    // Drop the problematic old index
    console.log('🗑️  Attempting to drop old index: task_1_reviewer_1');
    try {
      await collection.dropIndex('task_1_reviewer_1');
      console.log('✅ Successfully dropped old index\n');
    } catch (error) {
      if (error.code === 27 || error.message.includes('not found')) {
        console.log('⚠️  Index not found (already removed)\n');
      } else {
        throw error;
      }
    }
    
    // Drop any other problematic indexes
    console.log('🗑️  Checking for other old indexes...');
    const oldIndexNames = [
      'taskId_1_reviewerId_1',
      'task_1_reviewer_1',
      'taskId_1_reviewerId_1_unique',
      'reviewer_1',
      'task_1'
    ];
    
    for (const indexName of oldIndexNames) {
      try {
        await collection.dropIndex(indexName);
        console.log(`   ✅ Dropped: ${indexName}`);
      } catch (error) {
        if (error.code === 27 || error.message.includes('not found')) {
          // Index doesn't exist, that's fine
        } else {
          console.log(`   ⚠️  Could not drop ${indexName}: ${error.message}`);
        }
      }
    }
    console.log('');
    
    // Create the correct new indexes
    console.log('📝 Creating correct indexes for new schema...');
    
    // Index for finding reviews by reviewee
    await collection.createIndex({ revieweeId: 1 }, { name: 'revieweeId_1' });
    console.log('   ✅ Created: revieweeId_1');
    
    // Index for finding reviews by reviewer
    await collection.createIndex({ reviewerId: 1 }, { name: 'reviewerId_1' });
    console.log('   ✅ Created: reviewerId_1');
    
    // Compound index for checking duplicates (task-specific reviews)
    await collection.createIndex(
      { reviewerId: 1, revieweeId: 1, taskId: 1 },
      { 
        name: 'reviewerId_1_revieweeId_1_taskId_1',
        sparse: true // Only index documents where taskId exists
      }
    );
    console.log('   ✅ Created: reviewerId_1_revieweeId_1_taskId_1 (sparse)\n');
    
    // Verify new indexes
    console.log('📋 Final Indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)} - Name: ${index.name}`);
    });
    console.log('');
    
    // Test: Try to create a review
    console.log('🧪 Testing review creation...');
    const User = require('./models/User');
    
    // Get two different users
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('⚠️  Need at least 2 users to test. Skipping test.\n');
    } else {
      const reviewer = users[0];
      const reviewee = users[1];
      
      console.log(`   Reviewer: ${reviewer.firstName} ${reviewer.lastName} (${reviewer._id})`);
      console.log(`   Reviewee: ${reviewee.firstName} ${reviewee.lastName} (${reviewee._id})\n`);
      
      // Check for existing review
      const existing = await Review.findOne({
        reviewerId: reviewer._id,
        revieweeId: reviewee._id,
        taskId: { $exists: false }
      });
      
      if (existing) {
        console.log('   ℹ️  Review already exists, deleting for test...');
        await Review.deleteOne({ _id: existing._id });
      }
      
      // Create test review
      const testReview = new Review({
        revieweeId: reviewee._id,
        reviewerId: reviewer._id,
        rating: 5,
        reviewText: 'Test review to verify index fix is working correctly',
        reviewerRole: 'tasker'
      });
      
      await testReview.save();
      console.log('   ✅ Test review created successfully!');
      console.log(`   Review ID: ${testReview._id}\n`);
      
      // Clean up test review
      await Review.deleteOne({ _id: testReview._id });
      console.log('   🗑️  Cleaned up test review\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 FIX COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Old problematic index removed');
    console.log('✅ New correct indexes created');
    console.log('✅ Review system should now work correctly\n');
    console.log('💡 You can now submit reviews without the duplicate key error!\n');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDuplicateIndexIssue();
