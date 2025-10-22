const http = require('http');

// Test basic HTTP request to admin endpoints
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: `/api/admin${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function simpleTest() {
  try {
    console.log('🚀 Testing Admin API with simple HTTP...\n');
    
    // Test 1: Admin Login
    console.log('1. Testing admin login...');
    const loginResult = await makeRequest('/login', 'POST', {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    console.log('Login Status:', loginResult.status);
    console.log('Login Response:', loginResult.data.substring(0, 200));
    
    if (loginResult.status === 200) {
      const loginData = JSON.parse(loginResult.data);
      const token = loginData.token;
      console.log('✅ Login successful, got token');
      
      // Test 2: Categories
      console.log('\n2. Testing categories...');
      const categoriesResult = await makeRequest('/categories', 'GET');
      console.log('Categories Status:', categoriesResult.status);
      
      // Test 3: Tasks
      console.log('\n3. Testing tasks...');  
      const tasksResult = await makeRequest('/tasks?limit=3', 'GET');
      console.log('Tasks Status:', tasksResult.status);
      console.log('Tasks Response:', tasksResult.data.substring(0, 300));
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleTest();