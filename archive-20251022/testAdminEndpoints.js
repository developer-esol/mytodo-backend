const axios = require('axios');

async function testAdminEndpoints() {
  try {
    // First login to get admin token
    console.log('🔐 Testing admin login...');
    const loginResponse = await axios.post('http://localhost:5001/api/admin/login', {
      email: 'admin@mytodo.com',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.status === 'success') {
      console.log('✅ Admin login successful!');
      const token = loginResponse.data.data.token;
      
      // Test dashboard stats endpoint
      console.log('📊 Testing dashboard stats...');
      const dashboardResponse = await axios.get('http://localhost:5001/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Dashboard stats successful!');
      console.log('Stats:', JSON.stringify(dashboardResponse.data, null, 2));
      
      // Test users endpoint
      console.log('👥 Testing users endpoint...');
      const usersResponse = await axios.get('http://localhost:5001/api/admin/users?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Users endpoint successful!');
      console.log('Users count:', usersResponse.data.data?.users?.length || 'N/A');
      
    } else {
      console.error('❌ Admin login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAdminEndpoints();