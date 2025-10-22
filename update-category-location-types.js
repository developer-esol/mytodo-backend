// Update categories with locationType field
const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Define which categories are physical, online, or both
const categoryLocationTypes = {
  // Physical only (must be done in person)
  physical: [
    'Fence Construction',
    'Flooring Solutions',
    'Furniture Assembly',
    'Gardening Services',
    'Gas Fitting',
    'General Cleaning',
    'General Handyperson',
    'General Plumbing',
    'Glass Work',
    'Gutter & Window Cleaning',
    'Hazardous Materials',
    'Herbalists',
    'Homestays / Accomodation',
    'Hospitality Services',
    'Cleaning',
    'Moving',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Pet Care',
    'Dog Walking',
    'Babysitting',
    'Personal Care',
    'Home Repair',
    'Landscaping',
    'Pool Maintenance',
    'Pest Control',
    'Removalists',
    'Handyman and Handywomen',
    'Building',
    'Auto Repair',
    'Beauty Services',
    'Catering',
    'Cooking',
    'Baking',
    'Delivery',
    'Food Services',
    'Equipment Rental',
    'Fencing',
    'Grocery Shopping',
    'Gift Shopping',
    'Event Setup',
    'Decoration',
    'Assembly',
    'Appliance Repair',
    'Tours and Transport',
    'Driving',
    'Exercise',
    'Fitness Trainers',
    'Massage Therapy',
    'Real Estate'
  ],
  
  // Online only (can be done remotely)
  online: [
    'Graphic Design',
    'Web & App Development',
    'IT & Tech',
    'Computer Help',
    'Design',
    'Editing',
    'Bookkeeping',
    'Marketing and Advertising',
    'General Business & Admin',
    'Financial Planning',
    'Legal Services',
    'Writing',
    'Content Creation',
    'Video Editing',
    'Software Development',
    'Data Entry',
    'Virtual Assistant',
    'Online Research',
    'SEO Services',
    'Social Media Management',
    'Transcription',
    'Translation',
    'Voice Over'
  ],
  
  // Both (can be done either in-person or online)
  both: [
    'Music and Entertainment',
    'Photography',
    'Personal Assistance',
    'Health & Fitness',
    'Event Planning',
    'Consulting',
    'Tutoring',
    'Teaching',
    'Coaching',
    'Training',
    'Something Else'
  ]
};

const updateCategoryLocationTypes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let updatedCount = 0;
    let notFoundCategories = [];

    // Update physical categories
    for (const categoryName of categoryLocationTypes.physical) {
      const result = await Category.updateOne(
        { name: categoryName },
        { $set: { locationType: 'physical', updatedAt: Date.now() } }
      );
      
      if (result.matchedCount > 0) {
        updatedCount++;
        console.log(`✅ Updated "${categoryName}" → physical`);
      } else {
        notFoundCategories.push({ name: categoryName, type: 'physical' });
      }
    }

    // Update online categories
    for (const categoryName of categoryLocationTypes.online) {
      const result = await Category.updateOne(
        { name: categoryName },
        { $set: { locationType: 'online', updatedAt: Date.now() } }
      );
      
      if (result.matchedCount > 0) {
        updatedCount++;
        console.log(`✅ Updated "${categoryName}" → online`);
      } else {
        notFoundCategories.push({ name: categoryName, type: 'online' });
      }
    }

    // Update both categories
    for (const categoryName of categoryLocationTypes.both) {
      const result = await Category.updateOne(
        { name: categoryName },
        { $set: { locationType: 'both', updatedAt: Date.now() } }
      );
      
      if (result.matchedCount > 0) {
        updatedCount++;
        console.log(`✅ Updated "${categoryName}" → both`);
      } else {
        notFoundCategories.push({ name: categoryName, type: 'both' });
      }
    }

    // Update any remaining categories without locationType to 'both' (default)
    const remainingResult = await Category.updateMany(
      { locationType: { $exists: false } },
      { $set: { locationType: 'both', updatedAt: Date.now() } }
    );

    console.log('\n📊 Update Summary:');
    console.log(`✅ Total categories updated: ${updatedCount}`);
    console.log(`✅ Categories set to default (both): ${remainingResult.modifiedCount}`);
    
    if (notFoundCategories.length > 0) {
      console.log(`\n⚠️  Categories not found in database (${notFoundCategories.length}):`);
      notFoundCategories.forEach(cat => {
        console.log(`   - ${cat.name} (expected type: ${cat.type})`);
      });
    }

    // Show breakdown
    const physicalCount = await Category.countDocuments({ locationType: 'physical' });
    const onlineCount = await Category.countDocuments({ locationType: 'online' });
    const bothCount = await Category.countDocuments({ locationType: 'both' });
    
    console.log('\n📈 Category Location Types Breakdown:');
    console.log(`   🏠 Physical (In-person only): ${physicalCount}`);
    console.log(`   💻 Online (Remote only): ${onlineCount}`);
    console.log(`   🔄 Both (In-person or Online): ${bothCount}`);
    console.log(`   📊 Total: ${physicalCount + onlineCount + bothCount}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Category location types updated successfully!');

  } catch (error) {
    console.error('❌ Error updating categories:', error);
    process.exit(1);
  }
};

updateCategoryLocationTypes();
