const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api/admin';
let authToken = '';

async function testAdminAPI() {
  try {
    console.log('🚀 Testing Admin API Fixes...\n');
    
    // Test 1: Admin Login
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.status === 'success') {
      authToken = loginResponse.data.token;
      console.log('✅ Admin login successful');
    } else {
      throw new Error('Login failed');
    }
    
    // Test 2: Categories Endpoint
    console.log('\n2. Testing categories endpoint...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Categories response:');
    console.log('Status:', categoriesResponse.status);
    console.log('Categories count:', categoriesResponse.data.data.categories.length);
    
    if (categoriesResponse.data.data.categories.length > 0) {
      console.log('Sample categories:');
      categoriesResponse.data.data.categories.slice(0, 3).forEach(cat => {
        console.log(`  - ${cat.name} (${cat.description})`);
      });
    }
    
    // Test 3: Tasks Endpoint (without filter)
    console.log('\n3. Testing tasks endpoint (no filter)...');
    const tasksResponse = await axios.get(`${BASE_URL}/tasks?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Tasks response:');
    console.log('Status:', tasksResponse.status);
    console.log('Tasks count:', tasksResponse.data.data.tasks.length);
    
    if (tasksResponse.data.data.tasks.length > 0) {
      console.log('Sample task with user info:');
      const task = tasksResponse.data.data.tasks[0];
      console.log(`  Title: ${task.title}`);
      console.log(`  Created by: ${task.createdBy ? task.createdBy.firstName + ' ' + task.createdBy.lastName : 'Unknown User'}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Categories: ${task.categories ? task.categories.join(', ') : 'None'}`);
    }
    
    // Test 4: Tasks with Category Filter
    if (categoriesResponse.data.data.categories.length > 0) {
      console.log('\n4. Testing tasks endpoint with category filter...');
      const categoryName = categoriesResponse.data.data.categories[0].name;
      
      const filteredTasksResponse = await axios.get(`${BASE_URL}/tasks?category=${encodeURIComponent(categoryName)}&limit=3`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Filtered tasks response:');
      console.log(`Filter category: ${categoryName}`);
      console.log('Filtered tasks count:', filteredTasksResponse.data.data.tasks.length);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the tests
testAdminAPI();