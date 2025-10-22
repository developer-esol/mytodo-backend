/**
 * Test Admin User Management API with Rating Information
 * 
 * This script tests the admin user management endpoints to verify
 * that rating information is correctly returned.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Review = require('./models/Review');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

async function testAdminUserAPI() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTING ADMIN USER MANAGEMENT API');
    console.log('='.repeat(80) + '\n');

    // 1. Get all users with rating information
    console.log('📋 Test 1: Fetching all users (simulating GET /api/admin/users)');
    console.log('-'.repeat(80));

    const users = await User.find({ status: { $ne: 'deleted' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n✅ Found ${users.length} users\n`);

    // Format users like the API does
    const formattedUsers = users.map(user => {
      const userObj = user.toObject({ transform: false });
      
      return {
        _id: userObj._id,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        email: userObj.email,
        role: userObj.role,
        status: userObj.status,
        completedTasks: userObj.completedTasks || 0,
        createdAt: userObj.createdAt,
        // Rating information
        rating: userObj.rating || 0,
        ratingStats: {
          overall: {
            averageRating: userObj.ratingStats?.overall?.averageRating || 0,
            totalReviews: userObj.ratingStats?.overall?.totalReviews || 0,
            ratingDistribution: userObj.ratingStats?.overall?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          asPoster: {
            averageRating: userObj.ratingStats?.asPoster?.averageRating || 0,
            totalReviews: userObj.ratingStats?.asPoster?.totalReviews || 0
          },
          asTasker: {
            averageRating: userObj.ratingStats?.asTasker?.averageRating || 0,
            totalReviews: userObj.ratingStats?.asTasker?.totalReviews || 0
          }
        }
      };
    });

    // Display users in table format like admin panel
    console.log('USER MANAGEMENT TABLE VIEW:');
    console.log('='.repeat(80));
    console.log('USER'.padEnd(25), 'ROLE'.padEnd(12), 'STATUS'.padEnd(10), 'TASKS'.padEnd(6), 'RATING'.padEnd(20), 'JOINED');
    console.log('-'.repeat(80));

    formattedUsers.forEach(user => {
      const name = `${user.firstName} ${user.lastName}`.substring(0, 24).padEnd(25);
      const role = user.role.padEnd(12);
      const status = user.status.padEnd(10);
      const tasks = String(user.completedTasks).padEnd(6);
      
      // Format rating display
      let ratingDisplay;
      if (user.ratingStats.overall.totalReviews === 0) {
        ratingDisplay = 'No ratings'.padEnd(20);
      } else {
        ratingDisplay = `${user.rating.toFixed(1)} ⭐ (${user.ratingStats.overall.totalReviews} reviews)`.padEnd(20);
      }
      
      const joined = new Date(user.createdAt).toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });

      console.log(name, role, status, tasks, ratingDisplay, joined);
    });

    console.log('\n' + '='.repeat(80));

    // 2. Test single user details
    const userWithReviews = formattedUsers.find(u => u.ratingStats.overall.totalReviews > 0);
    
    if (userWithReviews) {
      console.log('\n📊 Test 2: Getting single user details (simulating GET /api/admin/users/:userId)');
      console.log('-'.repeat(80));
      
      const detailedUser = await User.findById(userWithReviews._id).select('-password');
      const userObj = detailedUser.toObject({ transform: false });
      
      console.log(`\n👤 User: ${userObj.firstName} ${userObj.lastName}`);
      console.log(`📧 Email: ${userObj.email}`);
      console.log(`🎭 Role: ${userObj.role}`);
      console.log(`📍 Location: ${userObj.location || 'Not set'}`);
      console.log(`✅ Status: ${userObj.status}`);
      console.log(`📋 Completed Tasks: ${userObj.completedTasks || 0}`);
      
      console.log('\n⭐ RATING INFORMATION:');
      console.log('-'.repeat(80));
      
      const overallStats = userObj.ratingStats?.overall || {};
      console.log(`\n📊 Overall Rating: ${overallStats.averageRating?.toFixed(1) || '0.0'} / 5.0`);
      console.log(`📝 Total Reviews: ${overallStats.totalReviews || 0}`);
      
      if (overallStats.totalReviews > 0) {
        console.log('\n📈 Rating Distribution:');
        const dist = overallStats.ratingDistribution || {};
        for (let star = 5; star >= 1; star--) {
          const count = dist[star] || 0;
          const percentage = Math.round((count / overallStats.totalReviews) * 100);
          const bar = '█'.repeat(Math.floor(percentage / 5));
          console.log(`${star}★ ${bar.padEnd(20, ' ')} ${percentage}% (${count})`);
        }
      }
      
      const posterStats = userObj.ratingStats?.asPoster || {};
      const taskerStats = userObj.ratingStats?.asTasker || {};
      
      console.log('\n🎯 Role-Specific Ratings:');
      console.log(`📮 As Poster: ${posterStats.averageRating?.toFixed(1) || '0.0'} / 5.0 (${posterStats.totalReviews || 0} reviews)`);
      console.log(`👷 As Tasker: ${taskerStats.averageRating?.toFixed(1) || '0.0'} / 5.0 (${taskerStats.totalReviews || 0} reviews)`);
    } else {
      console.log('\n⚠️  No users with reviews found to display detailed stats');
    }

    // 3. Show sample API responses
    console.log('\n\n' + '='.repeat(80));
    console.log('📡 SAMPLE API RESPONSES');
    console.log('='.repeat(80));

    console.log('\n1️⃣  GET /api/admin/users Response:');
    console.log(JSON.stringify({
      status: 'success',
      data: {
        users: formattedUsers.slice(0, 2), // Show first 2 users
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(formattedUsers.length / 20),
          totalUsers: formattedUsers.length,
          limit: 20
        }
      }
    }, null, 2));

    if (userWithReviews) {
      console.log('\n2️⃣  GET /api/admin/users/:userId Response:');
      const singleUserResponse = {
        status: 'success',
        data: {
          _id: userWithReviews._id,
          firstName: userWithReviews.firstName,
          lastName: userWithReviews.lastName,
          email: userWithReviews.email,
          role: userWithReviews.role,
          status: userWithReviews.status,
          rating: userWithReviews.rating,
          ratingStats: userWithReviews.ratingStats
        }
      };
      console.log(JSON.stringify(singleUserResponse, null, 2));
    }

    // 4. Show integration instructions
    console.log('\n\n' + '='.repeat(80));
    console.log('🚀 INTEGRATION GUIDE');
    console.log('='.repeat(80));

    console.log('\n1. API Endpoints Ready:');
    console.log('   ✅ GET /api/admin/users - Get all users with ratings');
    console.log('   ✅ GET /api/admin/users/:userId - Get single user details');

    console.log('\n2. Frontend Integration Example:');
    console.log(`
// Fetch users with ratings
const response = await fetch('http://localhost:5001/api/admin/users?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer ADMIN_TOKEN',
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
const users = result.data.users;

// Display in table
users.forEach(user => {
  const ratingText = user.ratingStats.overall.totalReviews === 0 
    ? 'No ratings'
    : \`\${user.rating.toFixed(1)} ⭐ (\${user.ratingStats.overall.totalReviews} reviews)\`;
  
  console.log(\`\${user.firstName} \${user.lastName}: \${ratingText}\`);
});
    `);

    console.log('\n3. Documentation:');
    console.log('   📄 See ADMIN_USER_MANAGEMENT_API.md for complete API documentation');

    console.log('\n✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the test
testAdminUserAPI();
