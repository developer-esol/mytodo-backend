// Test role-based filtering for admin user management
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
    console.log('🧪 Testing Role-Based User Filtering...\n');

    // Step 1: Admin login
    console.log('1. Admin login...');
    const loginResult = await makeRequest('POST', '/api/admin/login', {
      email: 'admin@mytodo.com',
      password: 'Admin123!'
    });

    if (loginResult.status !== 200 || loginResult.data.status !== 'success') {
      console.log('❌ Admin login failed:', loginResult);
      return;
    }

    const token = loginResult.data.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Test metadata endpoint
    console.log('\n2. Testing metadata endpoint...');
    const metadataResult = await makeRequest('GET', '/api/admin/metadata', null, token);
    console.log('Metadata result:', metadataResult.status);
    
    if (metadataResult.status === 200) {
      console.log('✅ Available roles:', metadataResult.data.data.roles.map(r => r.label).join(', '));
      console.log('✅ Available statuses:', metadataResult.data.data.statuses.map(s => s.label).join(', '));
    }

    // Step 3: Test all users (no filter)
    console.log('\n3. Testing all users (no filter)...');
    const allUsersResult = await makeRequest('GET', '/api/admin/users?page=1&limit=10', null, token);
    console.log('All users result:', allUsersResult.status);
    
    if (allUsersResult.status === 200) {
      const users = allUsersResult.data.data.users;
      console.log(`✅ Found ${users.length} users total`);
      
      // Show role distribution
      const roleCounts = {};
      users.forEach(user => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      });
      console.log('Role distribution:', roleCounts);
    }

    // Step 4: Test role filters
    const rolesToTest = ['admin', 'superadmin', 'poster', 'tasker', 'user'];
    
    for (const role of rolesToTest) {
      console.log(`\n4.${rolesToTest.indexOf(role) + 1} Testing role filter: ${role}...`);
      const roleFilterResult = await makeRequest('GET', `/api/admin/users?role=${role}&page=1&limit=10`, null, token);
      
      if (roleFilterResult.status === 200) {
        const filteredUsers = roleFilterResult.data.data.users;
        console.log(`✅ Found ${filteredUsers.length} users with role '${role}'`);
        
        // Verify all returned users have the correct role
        const incorrectRoles = filteredUsers.filter(user => user.role !== role);
        if (incorrectRoles.length === 0) {
          console.log(`✅ All users have correct role: ${role}`);
        } else {
          console.log(`❌ Found ${incorrectRoles.length} users with incorrect roles`);
        }
      } else {
        console.log(`❌ Role filter failed for '${role}':`, roleFilterResult);
      }
    }

    // Step 5: Test frontend role mapping
    console.log('\n5. Testing frontend role mapping...');
    const frontendRoles = ['Super Admin', 'Admin', 'Poster', 'Tasker'];
    
    for (const frontendRole of frontendRoles) {
      const mappingResult = await makeRequest('GET', `/api/admin/users?role=${encodeURIComponent(frontendRole)}&page=1&limit=5`, null, token);
      
      if (mappingResult.status === 200) {
        const users = mappingResult.data.data.users;
        console.log(`✅ Frontend role '${frontendRole}' returned ${users.length} users`);
        
        if (users.length > 0) {
          const actualRoles = [...new Set(users.map(u => u.role))];
          console.log(`   Actual backend roles: ${actualRoles.join(', ')}`);
        }
      } else {
        console.log(`❌ Frontend role mapping failed for '${frontendRole}'`);
      }
    }

    console.log('\n🎉 Role filtering test completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Role-Based Filtering Test...');
setTimeout(() => {
  testRoleFiltering();
}, 2000);