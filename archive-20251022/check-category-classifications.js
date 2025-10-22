// Check current category classifications
const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const checkCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const categories = await Category.find().sort('name');
    
    console.log('CURRENT CATEGORY CLASSIFICATIONS:');
    console.log('='.repeat(80));
    console.log('');
    
    const physical = [];
    const online = [];
    const both = [];
    const notSet = [];
    
    categories.forEach(cat => {
      const type = cat.locationType || 'not set';
      const display = `${cat.name.padEnd(45)} → ${type}`;
      
      if (type === 'physical') physical.push(display);
      else if (type === 'online') online.push(display);
      else if (type === 'both') both.push(display);
      else notSet.push(display);
    });
    
    console.log('🏠 PHYSICAL (In-person only):');
    console.log('-'.repeat(80));
    physical.forEach(cat => console.log(cat));
    
    console.log('\n💻 ONLINE (Remote only):');
    console.log('-'.repeat(80));
    online.forEach(cat => console.log(cat));
    
    console.log('\n🔄 BOTH (Either mode):');
    console.log('-'.repeat(80));
    both.forEach(cat => console.log(cat));
    
    if (notSet.length > 0) {
      console.log('\n⚠️  NOT SET:');
      console.log('-'.repeat(80));
      notSet.forEach(cat => console.log(cat));
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Physical: ${physical.length}`);
    console.log(`   Online: ${online.length}`);
    console.log(`   Both: ${both.length}`);
    console.log(`   Not Set: ${notSet.length}`);
    console.log(`   Total: ${categories.length}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkCategories();
