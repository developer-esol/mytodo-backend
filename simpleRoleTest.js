// Simple role filtering test
const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testRoleFiltering() {
  try {
    console.log('🔐 Testing admin login...');
    
    const loginResult = await makeRequest('POST', '/api/admin/login', {
      email: 'admin@mytodo.com',
      password: 'Admin123!'
    });

    console.log('Login result status:', loginResult.status);
    console.log('Login result data:', JSON.stringify(loginResult.data, null, 2));

    if (loginResult.status !== 200) {
      console.log('❌ Admin login failed');
      return;
    }

    const token = loginResult.data.data?.token || loginResult.data.token;
    
    if (!token) {
      console.log('❌ No token received');
      return;
    }

    console.log('✅ Admin login successful');

    // Test users endpoint
    console.log('\n📋 Testing users endpoint...');
    const usersResult = await makeRequest('GET', '/api/admin/users?page=1&limit=5', null, token);
    
    console.log('Users result status:', usersResult.status);
    
    if (usersResult.status === 200 && usersResult.data.data?.users) {
      const users = usersResult.data.data.users;
      console.log(`✅ Found ${users.length} users`);
      
      // Show first user to verify structure
      if (users.length > 0) {
        console.log('Sample user:', {
          id: users[0]._id,
          name: `${users[0].firstName} ${users[0].lastName}`,
          email: users[0].email,
          role: users[0].role,
          status: users[0].status
        });
      }

      // Test role filtering
      console.log('\n🔍 Testing role filter for "user"...');
      const roleFilterResult = await makeRequest('GET', '/api/admin/users?role=user&page=1&limit=3', null, token);
      
      if (roleFilterResult.status === 200) {
        const filteredUsers = roleFilterResult.data.data?.users || [];
        console.log(`✅ Role filter returned ${filteredUsers.length} users`);
        
        if (filteredUsers.length > 0) {
          console.log('Filtered user roles:', filteredUsers.map(u => u.role));
        }
      } else {
        console.log('❌ Role filter failed:', roleFilterResult.status);
      }

      // Test metadata endpoint
      console.log('\n📊 Testing metadata endpoint...');
      const metadataResult = await makeRequest('GET', '/api/admin/metadata', null, token);
      
      if (metadataResult.status === 200) {
        console.log('✅ Metadata endpoint working');
        console.log('Available roles:', metadataResult.data.data?.roles?.map(r => r.label));
      } else {
        console.log('❌ Metadata endpoint failed:', metadataResult.status);
      }

    } else {
      console.log('❌ Users endpoint failed:', usersResult.status);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
console.log('🚀 Starting Simple Role Test...\n');
setTimeout(() => {
  testRoleFiltering();
}, 1000);