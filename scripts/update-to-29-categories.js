// Update categories to only include the specified 29 categories
// Alphabetically ordered with correct location types
const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Define the NEW category structure (ONLY these 29 categories)
const newCategories = [
  // Alphabetically ordered
  { name: 'Appliance Installation and Repair', locationType: 'both' },
  { name: 'Auto Mechanic and Electrician', locationType: 'physical' },
  { name: 'Building Maintenance and Renovations', locationType: 'physical' },
  { name: 'Business and Accounting', locationType: 'both' },
  { name: 'Carpentry', locationType: 'physical' },
  { name: 'Cleaning and Organising', locationType: 'physical' },
  { name: 'Delivery', locationType: 'physical' },
  { name: 'Education and Tutoring', locationType: 'both' },
  { name: 'Electrical', locationType: 'physical' },
  { name: 'Event Planning', locationType: 'both' },
  { name: 'Furniture Repair and Flatpack Assembly', locationType: 'physical' },
  { name: 'Gardening and Landscaping', locationType: 'physical' },
  { name: 'Graphic Design', locationType: 'online' },
  { name: 'Handyman and Handywomen', locationType: 'physical' },
  { name: 'Health & Fitness', locationType: 'both' },
  { name: 'IT & Tech', locationType: 'both' },
  { name: 'Legal Services', locationType: 'both' },
  { name: 'Marketing and Advertising', locationType: 'online' },
  { name: 'Music and Entertainment', locationType: 'both' },
  { name: 'Painting', locationType: 'physical' },
  { name: 'Personal Assistance', locationType: 'both' },
  { name: 'Pet Care', locationType: 'physical' },
  { name: 'Photography', locationType: 'both' },
  { name: 'Plumbing', locationType: 'physical' },
  { name: 'Real Estate', locationType: 'both' },
  { name: 'Removalist', locationType: 'physical' },
  { name: 'Something Else', locationType: 'both' },
  { name: 'Tours and Transport', locationType: 'physical' },
  { name: 'Web & App Development', locationType: 'online' }
];

const updateCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('🔄 UPDATING CATEGORIES TO NEW STRUCTURE');
    console.log('='.repeat(80));
    console.log(`Total new categories: ${newCategories.length}\n`);

    // Get all existing categories
    const existingCategories = await Category.find();
    console.log(`Current categories in database: ${existingCategories.length}\n`);

    // Step 1: Get the names of new categories
    const newCategoryNames = newCategories.map(c => c.name);

    // Step 2: Delete categories NOT in the new list
    console.log('📝 Step 1: Removing old categories...');
    console.log('-'.repeat(80));
    
    const categoriesToDelete = existingCategories.filter(
      cat => !newCategoryNames.includes(cat.name)
    );
    
    if (categoriesToDelete.length > 0) {
      console.log(`Found ${categoriesToDelete.length} categories to remove:`);
      categoriesToDelete.forEach(cat => {
        console.log(`   ❌ Removing: ${cat.name}`);
      });
      
      const deleteResult = await Category.deleteMany({
        name: { $nin: newCategoryNames }
      });
      console.log(`\n✅ Deleted ${deleteResult.deletedCount} categories\n`);
    } else {
      console.log('No categories to remove.\n');
    }

    // Step 3: Update or create categories
    console.log('📝 Step 2: Updating/Creating categories...');
    console.log('-'.repeat(80));
    
    let created = 0;
    let updated = 0;
    
    for (let i = 0; i < newCategories.length; i++) {
      const category = newCategories[i];
      const order = i + 1; // Alphabetical order
      
      const existing = await Category.findOne({ name: category.name });
      
      if (existing) {
        // Update existing category
        existing.locationType = category.locationType;
        existing.order = order;
        existing.isActive = true;
        existing.updatedAt = new Date();
        
        // Generate icon path if not exists
        if (!existing.icon) {
          const iconName = category.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9-]/g, '');
          existing.icon = `/images/categories/${iconName}.svg`;
        }
        
        await existing.save();
        console.log(`   ✏️  Updated: ${category.name.padEnd(45)} → ${category.locationType} (order: ${order})`);
        updated++;
      } else {
        // Create new category
        const iconName = category.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9-]/g, '');
        
        await Category.create({
          name: category.name,
          description: `Services related to ${category.name}`,
          icon: `/images/categories/${iconName}.svg`,
          locationType: category.locationType,
          order: order,
          isActive: true
        });
        
        console.log(`   ➕ Created: ${category.name.padEnd(45)} → ${category.locationType} (order: ${order})`);
        created++;
      }
    }

    // Step 4: Show summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY:');
    console.log('='.repeat(80));
    console.log(`✅ Categories created: ${created}`);
    console.log(`✅ Categories updated: ${updated}`);
    console.log(`✅ Categories deleted: ${categoriesToDelete.length}`);
    console.log(`✅ Total active categories: ${newCategories.length}`);

    // Step 5: Show breakdown by location type
    const physicalCount = newCategories.filter(c => c.locationType === 'physical').length;
    const onlineCount = newCategories.filter(c => c.locationType === 'online').length;
    const bothCount = newCategories.filter(c => c.locationType === 'both').length;

    console.log('\n📈 Category Location Types:');
    console.log(`   🏠 Physical (In-person only): ${physicalCount}`);
    console.log(`   💻 Online (Remote only): ${onlineCount}`);
    console.log(`   🔄 Both (Either mode): ${bothCount}`);

    // Step 6: Display all categories in order
    console.log('\n📋 ALL CATEGORIES (Alphabetical Order):');
    console.log('='.repeat(80));
    
    const finalCategories = await Category.find({ isActive: true }).sort({ order: 1 });
    
    console.log('\n🏠 PHYSICAL (In-person only):');
    console.log('-'.repeat(80));
    finalCategories
      .filter(c => c.locationType === 'physical')
      .forEach((cat, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${cat.name}`);
      });
    
    console.log('\n💻 ONLINE (Remote only):');
    console.log('-'.repeat(80));
    finalCategories
      .filter(c => c.locationType === 'online')
      .forEach((cat, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${cat.name}`);
      });
    
    console.log('\n🔄 BOTH (Either mode):');
    console.log('-'.repeat(80));
    finalCategories
      .filter(c => c.locationType === 'both')
      .forEach((cat, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${cat.name}`);
      });

    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION COMPLETE!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateCategories();
