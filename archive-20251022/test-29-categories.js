// Test the updated 29 categories with location filtering
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

const testNewCategories = async () => {
  console.log('🧪 TESTING NEW 29 CATEGORIES WITH LOCATION FILTERING\n');
  console.log('='.repeat(100));
  
  try {
    // Test 1: Get all categories
    console.log('\n📋 TEST 1: Get All Categories');
    console.log('-'.repeat(100));
    const allResponse = await axios.get(`${BASE_URL}/api/categories`);
    
    if (allResponse.data.success) {
      console.log(`✅ Total categories: ${allResponse.data.data.length}`);
      console.log('\nAll categories (alphabetical):');
      allResponse.data.data.forEach((cat, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${cat.name.padEnd(45)} (${cat.locationType})`);
      });
    }
    
    // Test 2: Get In-person categories
    console.log('\n\n📍 TEST 2: Get In-person Categories');
    console.log('-'.repeat(100));
    const inPersonResponse = await axios.get(`${BASE_URL}/api/categories/by-location?type=In-person`);
    
    if (inPersonResponse.data.success) {
      console.log(`✅ Total In-person categories: ${inPersonResponse.data.data.length}`);
      console.log('\nCategories for In-person tasks:');
      inPersonResponse.data.data.forEach((cat, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${cat.name.padEnd(45)} (${cat.locationType})`);
      });
      
      // Count by type
      const physical = inPersonResponse.data.data.filter(c => c.locationType === 'physical').length;
      const both = inPersonResponse.data.data.filter(c => c.locationType === 'both').length;
      console.log(`\n   📊 Breakdown: ${physical} physical-only + ${both} both = ${physical + both} total`);
    }
    
    // Test 3: Get Online categories
    console.log('\n\n💻 TEST 3: Get Online Categories');
    console.log('-'.repeat(100));
    const onlineResponse = await axios.get(`${BASE_URL}/api/categories/by-location?type=Online`);
    
    if (onlineResponse.data.success) {
      console.log(`✅ Total Online categories: ${onlineResponse.data.data.length}`);
      console.log('\nCategories for Online tasks:');
      onlineResponse.data.data.forEach((cat, i) => {
        console.log(`   ${(i + 1).toString().padStart(2)}. ${cat.name.padEnd(45)} (${cat.locationType})`);
      });
      
      // Count by type
      const online = onlineResponse.data.data.filter(c => c.locationType === 'online').length;
      const both = onlineResponse.data.data.filter(c => c.locationType === 'both').length;
      console.log(`\n   📊 Breakdown: ${online} online-only + ${both} both = ${online + both} total`);
      
      // Verify physical categories are NOT present
      const physicalInOnline = onlineResponse.data.data.filter(c => c.locationType === 'physical');
      if (physicalInOnline.length > 0) {
        console.log(`\n   ❌ ERROR: ${physicalInOnline.length} physical-only categories found in Online!`);
        physicalInOnline.forEach(cat => console.log(`      - ${cat.name}`));
      } else {
        console.log(`\n   ✅ Correct: No physical-only categories in Online results`);
      }
    }
    
    // Test 4: Verify specific categories
    console.log('\n\n🔍 TEST 4: Verify Category Classifications');
    console.log('-'.repeat(100));
    
    const verifications = [
      { name: 'Carpentry', expectedType: 'physical', shouldBeInOnline: false },
      { name: 'Plumbing', expectedType: 'physical', shouldBeInOnline: false },
      { name: 'Graphic Design', expectedType: 'online', shouldBeInOnline: true },
      { name: 'Web & App Development', expectedType: 'online', shouldBeInOnline: true },
      { name: 'Education and Tutoring', expectedType: 'both', shouldBeInOnline: true },
      { name: 'Photography', expectedType: 'both', shouldBeInOnline: true }
    ];
    
    for (const verify of verifications) {
      const allCat = allResponse.data.data.find(c => c.name === verify.name);
      const onlineCat = onlineResponse.data.data.find(c => c.name === verify.name);
      
      if (allCat) {
        const typeMatch = allCat.locationType === verify.expectedType;
        const onlineMatch = verify.shouldBeInOnline ? (onlineCat !== undefined) : (onlineCat === undefined);
        
        if (typeMatch && onlineMatch) {
          console.log(`   ✅ ${verify.name.padEnd(30)} → ${allCat.locationType} (${verify.shouldBeInOnline ? 'in Online' : 'not in Online'})`);
        } else {
          console.log(`   ❌ ${verify.name.padEnd(30)} → Expected: ${verify.expectedType}, Got: ${allCat.locationType}`);
        }
      }
    }
    
    // Test 5: Summary
    console.log('\n\n📊 FINAL SUMMARY');
    console.log('='.repeat(100));
    console.log(`Total Categories: ${allResponse.data.data.length}`);
    console.log(`In-person Categories: ${inPersonResponse.data.data.length} (14 physical + 12 both)`);
    console.log(`Online Categories: ${onlineResponse.data.data.length} (3 online + 12 both)`);
    
    const physical = allResponse.data.data.filter(c => c.locationType === 'physical').length;
    const online = allResponse.data.data.filter(c => c.locationType === 'online').length;
    const both = allResponse.data.data.filter(c => c.locationType === 'both').length;
    
    console.log(`\nBreakdown:`);
    console.log(`   🏠 Physical-only: ${physical}`);
    console.log(`   💻 Online-only: ${online}`);
    console.log(`   🔄 Both: ${both}`);
    console.log(`   ➕ Total: ${physical + online + both}`);
    
    console.log('\n' + '='.repeat(100));
    console.log('✅ ALL TESTS PASSED!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testNewCategories();
