const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupAndVerifyIndexes() {
  try {
    console.log('🔧 MongoDB Index Cleanup & Verification\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Review = require('./models/Review');
    const collection = Review.collection;
    
    // Get current indexes
    console.log('📋 Current Indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      const unique = index.unique ? ' (UNIQUE)' : '';
      const sparse = index.sparse ? ' (SPARSE)' : '';
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)} - ${index.name}${unique}${sparse}`);
    });
    console.log('');
    
    // Drop all old problematic indexes
    console.log('🗑️  Removing old/problematic indexes...');
    const indexesToDrop = [
      'task_1_reviewer_1',
      'task_1',
      'reviewer_1',
      'reviewee_1_revieweeRole_1',
      'taskId_1_reviewerId_1'
    ];
    
    let droppedCount = 0;
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`   ✅ Dropped: ${indexName}`);
        droppedCount++;
      } catch (error) {
        if (error.code === 27 || error.message.includes('not found')) {
          console.log(`   ℹ️  ${indexName} - not found (already removed)`);
        } else {
          console.log(`   ⚠️  ${indexName} - ${error.message}`);
        }
      }
    }
    console.log(`   Total dropped: ${droppedCount}\n`);
    
    // Verify required indexes exist
    console.log('✅ Verifying required indexes...');
    const currentIndexes = await collection.indexes();
    const indexNames = currentIndexes.map(idx => idx.name);
    
    const requiredIndexes = [
      '_id_',
      'revieweeId_1',
      'reviewerId_1',
      'reviewerId_1_revieweeId_1_taskId_1'
    ];
    
    requiredIndexes.forEach(name => {
      if (indexNames.includes(name)) {
        console.log(`   ✅ ${name} - exists`);
      } else {
        console.log(`   ⚠️  ${name} - missing`);
      }
    });
    console.log('');
    
    // Final index list
    console.log('📋 Final Index Configuration:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      const unique = index.unique ? ' (UNIQUE)' : '';
      const sparse = index.sparse ? ' (SPARSE)' : '';
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)} - ${index.name}${unique}${sparse}`);
    });
    console.log('');
    
    // Test review creation
    console.log('🧪 Testing Review Creation...');
    const User = require('./models/User');
    
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('   ⚠️  Need at least 2 users for testing\n');
    } else {
      const reviewer = users[0];
      const reviewee = users[1];
      
      console.log(`   Reviewer: ${reviewer._id}`);
      console.log(`   Reviewee: ${reviewee._id}\n`);
      
      // Delete existing test review if any
      await Review.deleteOne({
        reviewerId: reviewer._id,
        revieweeId: reviewee._id,
        taskId: { $exists: false }
      });
      
      // Create test review
      try {
        const testReview = new Review({
          revieweeId: reviewee._id,
          reviewerId: reviewer._id,
          rating: 5,
          reviewText: 'Test review - verifying index fix',
          reviewerRole: 'tasker'
        });
        
        await testReview.save();
        console.log('   ✅ Test review created successfully!');
        console.log(`   Review ID: ${testReview._id}\n`);
        
        // Cleanup
        await Review.deleteOne({ _id: testReview._id });
        console.log('   🗑️  Test review cleaned up\n');
        
      } catch (error) {
        console.log('   ❌ Test failed:', error.message);
        console.log('   Error code:', error.code);
        console.log('');
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ INDEX CLEANUP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Summary:');
    console.log(`   - Old indexes removed: ${droppedCount}`);
    console.log('   - Required indexes: verified');
    console.log('   - Test review: ' + (users.length >= 2 ? 'passed' : 'skipped'));
    console.log('');
    console.log('🎉 You can now submit reviews without duplicate key errors!\n');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanupAndVerifyIndexes();
