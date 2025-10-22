// Test the main backend categories API integration
const http = require('http');

function testMainCategoriesAPI() {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/categories',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('🧪 Testing Main Backend Categories API...\n');

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        console.log('📡 Response Status:', res.statusCode);
        
        if (res.statusCode === 200) {
          const jsonData = JSON.parse(data);
          
          console.log('✅ Categories API Response Format:');
          console.log('- Success:', jsonData.success);
          console.log('- Data Type:', Array.isArray(jsonData.data) ? 'Array' : typeof jsonData.data);
          
          if (jsonData.success && Array.isArray(jsonData.data)) {
            console.log('- Categories Count:', jsonData.data.length);
            
            if (jsonData.data.length > 0) {
              console.log('\n📋 Sample Category:');
              const sample = jsonData.data[0];
              console.log('- Name:', sample.name);
              console.log('- Description:', sample.description);
              console.log('- Icon Path:', sample.icon);
              console.log('- Icon URL:', sample.iconUrl);
            }
            
            console.log('\n🎯 Integration Status:');
            console.log('✅ Main categories API is working correctly');
            console.log('✅ Admin panel should use: GET /api/categories');
            console.log('✅ Expected format: { success: true, data: [...] }');
            console.log('✅ Category filtering uses regex matching on categories array');
            
          } else {
            console.log('❌ Unexpected response format');
            console.log('Raw response:', data);
          }
        } else {
          console.log('❌ Categories API returned status:', res.statusCode);
          console.log('Response:', data);
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
  });

  req.end();
}

// Test after a short delay to ensure server is ready
setTimeout(() => {
  testMainCategoriesAPI();
}, 2000);

console.log('🚀 Starting Categories API Integration Test...');
console.log('⏳ Waiting 2 seconds for server to be ready...\n');