const mongoose = require('mongoose');
require('dotenv').config();

async function testReviewCreation() {
  try {
    console.log('🧪 Testing Direct Review Creation\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Review = require('./models/Review');
    const User = require('./models/User');
    
    // Get two users
    const users = await User.find().limit(2);
    const reviewer = users[0];
    const reviewee = users[1];
    
    console.log(`👤 Reviewer: ${reviewer.firstName} ${reviewer.lastName} (${reviewer._id})`);
    console.log(`👤 Reviewee: ${reviewee.firstName} ${reviewee.lastName} (${reviewee._id})\n`);
    
    console.log('📝 Creating review directly in database...\n');
    
    const reviewData = {
      revieweeId: reviewee._id,
      reviewerId: reviewer._id,
      rating: 5,
      reviewText: 'Excellent work! Very professional and delivered on time.',
      reviewerRole: reviewer.role || 'tasker'
    };
    
    console.log('Review Data:', JSON.stringify(reviewData, null, 2));
    
    const review = new Review(reviewData);
    
    console.log('\n💾 Saving review...');
    await review.save();
    
    console.log('✅ Review saved successfully!');
    console.log('Review ID:', review._id);
    console.log('Rating:', review.rating);
    console.log('Review Text:', review.reviewText);
    
    console.log('\n📊 Populating reviewer data...');
    await review.populate('reviewerId', 'firstName lastName avatar');
    
    console.log('✅ Populated reviewer:', review.reviewerId);
    
    console.log('\n🎉 Test completed successfully!');
    
    // Clean up - delete the test review
    console.log('\n🗑️  Cleaning up test review...');
    await Review.findByIdAndDelete(review._id);
    console.log('✅ Test review deleted');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Name:', error.name);
    process.exit(1);
  }
}

testReviewCreation();
