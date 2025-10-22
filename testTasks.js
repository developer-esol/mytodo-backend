// Test the tasks endpoint specifically
const http = require('http');

function makeRequest(method, path, token = null) {
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
    
    req.end();
  });
}

async function testTasksEndpoint() {
  try {
    console.log('🔐 Getting admin token...');
    
    // First login to get admin token
    const loginResult = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        email: 'admin@mytodo.com',
        password: 'Admin123!'
      });
      
      const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/admin/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
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
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    if (loginResult.status === 200 && loginResult.data?.status === 'success') {
      const token = loginResult.data.data.token;
      console.log('✅ Admin login successful!');
      
      console.log('📋 Testing tasks endpoint...');
      const tasksResult = await makeRequest('GET', '/api/admin/tasks?page=1&limit=20', token);
      console.log('Tasks result status:', tasksResult.status);
      
      if (tasksResult.status === 200) {
        console.log('✅ Tasks endpoint working!');
        console.log('Tasks count:', tasksResult.data?.data?.tasks?.length || 0);
      } else {
        console.log('❌ Tasks endpoint failed:');
        console.log('Error:', tasksResult.data);
      }
      
    } else {
      console.log('❌ Admin login failed:', loginResult.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTasksEndpoint();