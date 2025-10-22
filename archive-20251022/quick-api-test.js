// Quick test to see what the API is returning
const axios = require('axios');

const testAPI = async () => {
  console.log('🧪 Testing API Responses\n');
  console.log('='.repeat(80));
  
  try {
    // Test Online filtering
    console.log('\n💻 GET /api/categories/by-location?type=Online\n');
    const response = await axios.get('http://localhost:5001/api/categories/by-location?type=Online');
    
    console.log(`Status: ${response.status}`);
    console.log(`Total categories returned: ${response.data.data.length}`);
    console.log('\nFirst 10 categories:');
    
    response.data.data.slice(0, 10).forEach((cat, i) => {
      console.log(`   ${(i + 1).toString().padStart(2)}. ${cat.name.padEnd(45)} (${cat.locationType})`);
    });
    
    // Check if any physical categories are present
    const physicalCategories = response.data.data.filter(c => c.locationType === 'physical');
    
    if (physicalCategories.length > 0) {
      console.log('\n❌ ERROR: Physical-only categories found in Online results:');
      physicalCategories.forEach(cat => {
        console.log(`   - ${cat.name}`);
      });
    } else {
      console.log('\n✅ Correct: No physical-only categories in Online results');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Is the backend server running on port 5001?');
  }
};

testAPI();
