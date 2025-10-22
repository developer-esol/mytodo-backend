// Simple test for admin endpoints
const https = require('https');
const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
      data = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testEndpoints() {
  try {
    console.log('🔐 Testing admin login...');
    const loginResult = await makeRequest('POST', '/api/admin/login', {
      email: 'admin@mytodo.com',
      password: 'Admin123!'
    });
    
    console.log('Login result:', loginResult.status, loginResult.data?.status);
    
    if (loginResult.status === 200 && loginResult.data?.status === 'success') {
      const token = loginResult.data.data.token;
      console.log('✅ Admin login successful!');
      
      console.log('📊 Testing dashboard stats...');
      const dashboardResult = await makeRequest('GET', '/api/admin/dashboard/stats', null, token);
      console.log('Dashboard result:', dashboardResult.status, dashboardResult.data?.status);
      
      console.log('👥 Testing users endpoint...');
      const usersResult = await makeRequest('GET', '/api/admin/users?page=1&limit=20', null, token);
      console.log('Users result:', usersResult.status, usersResult.data?.status);
      
      console.log('🧪 Testing test endpoint...');
      const testResult = await makeRequest('GET', '/api/admin/test');
      console.log('Test result:', testResult.status, testResult.data?.status);
      
    } else {
      console.log('❌ Admin login failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testEndpoints();