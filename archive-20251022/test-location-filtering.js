// Test location type filtering API
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

const testLocationFiltering = async () => {
  console.log('🧪 Testing Location Type Category Filtering\n');
  console.log('='.repeat(80));
  
  try {
    // Test 1: Get In-person categories
    console.log('\n📍 TEST 1: Get In-person Categories');
    console.log('-'.repeat(80));
    const inPersonResponse = await axios.get(`${BASE_URL}/api/categories/by-location?type=In-person`);
    
    if (inPersonResponse.data.success) {
      console.log(`✅ Success! Found ${inPersonResponse.data.data.length} categories for In-person`);
      console.log('\nSample categories:');
      inPersonResponse.data.data.slice(0, 5).forEach(cat => {
        console.log(`   - ${cat.name.padEnd(40)} (${cat.locationType})`);
      });
      
      // Check if any "physical-only" categories are present
      const physicalCategories = inPersonResponse.data.data.filter(c => c.locationType === 'physical');
      console.log(`\n   Physical-only: ${physicalCategories.length}`);
      console.log(`   Both: ${inPersonResponse.data.data.length - physicalCategories.length}`);
    }
    
    // Test 2: Get Online categories
    console.log('\n\n💻 TEST 2: Get Online Categories');
    console.log('-'.repeat(80));
    const onlineResponse = await axios.get(`${BASE_URL}/api/categories/by-location?type=Online`);
    
    if (onlineResponse.data.success) {
      console.log(`✅ Success! Found ${onlineResponse.data.data.length} categories for Online`);
      console.log('\nSample categories:');
      onlineResponse.data.data.slice(0, 5).forEach(cat => {
        console.log(`   - ${cat.name.padEnd(40)} (${cat.locationType})`);
      });
      
      // Check if any "online-only" categories are present
      const onlineCategories = onlineResponse.data.data.filter(c => c.locationType === 'online');
      console.log(`\n   Online-only: ${onlineCategories.length}`);
      console.log(`   Both: ${onlineResponse.data.data.length - onlineCategories.length}`);
      
      // ❌ CHECK FOR BUG: Are any "physical" categories showing in Online?
      const physicalInOnline = onlineResponse.data.data.filter(c => c.locationType === 'physical');
      if (physicalInOnline.length > 0) {
        console.log(`\n❌ BUG FOUND! ${physicalInOnline.length} physical-only categories showing in Online:`);
        physicalInOnline.forEach(cat => {
          console.log(`   - ${cat.name}`);
        });
      } else {
        console.log(`\n✅ No physical-only categories in Online results (correct!)`);
      }
    }
    
    // Test 3: Check specific categories from screenshot
    console.log('\n\n🔍 TEST 3: Check Specific Categories from Screenshot');
    console.log('-'.repeat(80));
    const problematicCategories = [
      'Fence Construction',
      'Fitness Trainers', 
      'Flooring Solutions',
      'Food Services'
    ];
    
    for (const catName of problematicCategories) {
      const inOnline = onlineResponse.data.data.find(c => c.name === catName);
      if (inOnline) {
        console.log(`❌ "${catName}" (${inOnline.locationType}) - SHOULD NOT show in Online!`);
      } else {
        console.log(`✅ "${catName}" - Correctly filtered out from Online`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testLocationFiltering();
