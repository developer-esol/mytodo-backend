const axios = require('axios');

async function testAdminLogin() {
  try {
    const response = await axios.post('http://localhost:5001/api/admin/login', {
      email: 'admin@mytodo.com',
      password: 'Admin123!'
    });
    
    console.log('✅ Admin login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
  }
}

async function testAdminRoutes() {
  try {
    const response = await axios.get('http://localhost:5001/api/admin/test');
    console.log('✅ Admin test route working!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Admin test route failed:', error.response?.data || error.message);
  }
}

console.log('Testing admin integration...');
testAdminRoutes();
testAdminLogin();