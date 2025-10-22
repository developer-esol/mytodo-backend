const mongoose = require('mongoose');
require('dotenv').config();

async function addSampleReviews() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");
    
    const Review = require('./models/Review');
    const User = require('./models/User');
    const Task = require('./models/Task');
    
    // Get users and tasks
    const users = await User.find().limit(10);
    const tasks = await Task.find({ status: 'completed' }).limit(15);
    
    console.log(`📊 Found ${users.length} users and ${tasks.length} completed tasks\n`);
    
    if (users.length < 2 || tasks.length < 1) {
      console.log("⚠️  Not enough users or tasks to create reviews");
      process.exit(0);
    }
    
    const sampleComments = [
      "Excellent work! Very professional and completed the task quickly. Would definitely hire again!",
      "Great attention to detail. Communication was clear and timely throughout.",
      "Professional and reliable. Exceeded my expectations!",
      "Good work overall. Task completed as agreed.",
      "Outstanding service! Went above and beyond what was required.",
      "Very satisfied with the quality of work. Highly recommended!",
      "Quick response and great communication. Will work together again.",
      "Professional approach and excellent results. Thank you!",
      "Fantastic job! Exactly what I needed and delivered on time.",
      "Reliable and skilled. Made the whole process easy.",
      "Top-notch service. Very impressed with the outcome.",
      "Great experience working together. Would recommend to others.",
      "Efficient and professional. Task completed perfectly.",
      "Very happy with the service provided. Five stars!",
      "Excellent communication and quality work. Highly satisfied!",
      "Professional, punctual, and did a great job overall.",
      "Smooth collaboration and great results. Thank you!",
      "Quality work delivered on time. Will definitely hire again.",
      "Very pleased with the outcome. Highly professional!",
      "Great work ethic and attention to detail. Recommended!"
    ];
    
    let reviewsCreated = 0;
    
    // Create reviews for completed tasks
    for (let i = 0; i < tasks.length && reviewsCreated < 20; i++) {
      const task = tasks[i];
      
      // Skip if task doesn't have both creator and assignee
      if (!task.createdBy || !task.assignedTo) {
        continue;
      }
      
      // Poster reviews Tasker
      if (reviewsCreated < 20) {
        try {
          const existingReview1 = await Review.findOne({
            task: task._id,
            reviewer: task.createdBy,
            reviewee: task.assignedTo
          });
          
          if (!existingReview1) {
            const review1 = new Review({
              task: task._id,
              reviewer: task.createdBy,
              reviewee: task.assignedTo,
              reviewerRole: 'poster',
              revieweeRole: 'tasker',
              rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
              comment: sampleComments[reviewsCreated % sampleComments.length],
              isVisible: true
            });
            
            await review1.save();
            await Review.updateUserRating(task.assignedTo);
            reviewsCreated++;
            console.log(`✅ Review ${reviewsCreated}: Poster → Tasker (Task: ${task.title.substring(0, 30)}...)`);
          } else {
            console.log(`⏭️  Skipping existing review for task: ${task.title.substring(0, 30)}...`);
          }
        } catch (error) {
          if (error.code === 11000) {
            console.log(`⏭️  Duplicate review skipped for task: ${task.title.substring(0, 30)}...`);
          } else {
            throw error;
          }
        }
      }
      
      // Tasker reviews Poster
      if (reviewsCreated < 20) {
        try {
          const existingReview2 = await Review.findOne({
            task: task._id,
            reviewer: task.assignedTo,
            reviewee: task.createdBy
          });
          
          if (!existingReview2) {
            const review2 = new Review({
              task: task._id,
              reviewer: task.assignedTo,
              reviewee: task.createdBy,
              reviewerRole: 'tasker',
              revieweeRole: 'poster',
              rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
              comment: sampleComments[(reviewsCreated + 10) % sampleComments.length],
              isVisible: true
            });
            
            await review2.save();
            await Review.updateUserRating(task.createdBy);
            reviewsCreated++;
            console.log(`✅ Review ${reviewsCreated}: Tasker → Poster (Task: ${task.title.substring(0, 30)}...)`);
          } else {
            console.log(`⏭️  Skipping existing review for task: ${task.title.substring(0, 30)}...`);
          }
        } catch (error) {
          if (error.code === 11000) {
            console.log(`⏭️  Duplicate review skipped for task: ${task.title.substring(0, 30)}...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log(`\n🎉 Total reviews created: ${reviewsCreated}`);
    
    // Show summary
    const totalReviews = await Review.countDocuments();
    console.log(`\n📊 Database Summary:`);
    console.log(`   Total Reviews: ${totalReviews}`);
    
    // Show updated user ratings
    console.log(`\n📈 Updated User Ratings:`);
    const usersWithReviews = await User.find({
      'ratingStats.overall.totalReviews': { $gt: 0 }
    }).select('firstName lastName ratingStats.overall');
    
    usersWithReviews.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName}: ${user.ratingStats.overall.averageRating.toFixed(1)}⭐ (${user.ratingStats.overall.totalReviews} reviews)`);
    });
    
    console.log("\n✅ Sample reviews added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addSampleReviews();
