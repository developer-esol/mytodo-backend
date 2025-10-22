/**
 * Test Metadata Endpoint Fix
 * 
 * This script tests the /api/admin/metadata endpoint to verify
 * it now works without authentication
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

async function testMetadataEndpoint() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING METADATA ENDPOINT FIX');
  console.log('='.repeat(80) + '\n');

  try {
    console.log('📡 Testing: GET /api/admin/metadata (without authentication)');
    console.log('-'.repeat(80));

    const response = await axios.get(`${API_BASE_URL}/api/admin/metadata`);

    console.log('✅ Status:', response.status, response.statusText);
    console.log('✅ Response received successfully!\n');

    if (response.data.status === 'success') {
      console.log('📊 Metadata Content:');
      console.log(JSON.stringify(response.data, null, 2));

      const { roles, statuses } = response.data.data;

      console.log('\n📋 Roles Available:');
      roles.forEach(role => {
        console.log(`   - ${role.label} (value: "${role.value}")`);
      });

      console.log('\n📋 Statuses Available:');
      statuses.forEach(status => {
        console.log(`   - ${status.label} (value: "${status.value}")`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('✅ TEST PASSED: Metadata endpoint is working without authentication!');
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('⚠️  Unexpected response format:', response.data);
    }

  } catch (error) {
    console.log('❌ TEST FAILED!');
    console.log('-'.repeat(80));

    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);

      if (error.response.status === 401) {
        console.log('\n⚠️  ISSUE: Endpoint still requires authentication!');
        console.log('   Make sure the server has been restarted after the fix.');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server is not running!');
      console.log('   Please start the server with: npm run dev');
    } else {
      console.log('Error:', error.message);
    }

    console.log('\n' + '='.repeat(80) + '\n');
    process.exit(1);
  }

  // Test the test endpoint as well
  try {
    console.log('🧪 Bonus Test: GET /api/admin/test');
    console.log('-'.repeat(80));

    const testResponse = await axios.get(`${API_BASE_URL}/api/admin/test`);
    console.log('✅ Test endpoint also working!');
    console.log('Response:', testResponse.data);
    console.log('\n');

  } catch (error) {
    console.log('⚠️  Test endpoint not working (this is optional)');
  }

  console.log('📚 Frontend Integration Example:');
  console.log('-'.repeat(80));
  console.log(`
// Fetch metadata without authentication
async function loadMetadata() {
  try {
    const response = await axios.get('${API_BASE_URL}/api/admin/metadata');
    
    if (response.data.status === 'success') {
      const { roles, statuses } = response.data.data;
      console.log('Roles:', roles);
      console.log('Statuses:', statuses);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

loadMetadata();
  `);

  console.log('\n✅ All tests completed!\n');
}

// Run the test
console.log('\n⚠️  Note: Make sure the server is running (npm run dev) before running this test.\n');
testMetadataEndpoint();
