// test-kasun-notifications.js - Test API for Kasun Pasan's notifications
const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const notificationService = require('./services/notificationService');

async function testKasunNotifications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/airtasksystem');
    console.log('🧪 Testing notification API for Kasun Pasan...\n');
    
    const kasunUser = await User.findOne({ 
      firstName: 'kasun', 
      lastName: 'Pasan' 
    });
    
    if (!kasunUser) {
      console.log('❌ Kasun user not found');
      process.exit(1);
    }
    
    console.log(`✅ Testing for user: ${kasunUser.firstName} ${kasunUser.lastName} (${kasunUser.email})`);
    console.log(`   User ID: ${kasunUser._id}\n`);
    
    // Test 1: Direct database query
    console.log('📝 Test 1: Direct database query');
    const directNotifs = await Notification.find({ recipient: kasunUser._id }).sort({ createdAt: -1 });
    const directUnread = await Notification.countDocuments({ recipient: kasunUser._id, isRead: false });
    
    console.log(`   Total notifications: ${directNotifs.length}`);
    console.log(`   Unread notifications: ${directUnread}`);
    console.log('   Notification list:');
    directNotifs.forEach((n, i) => {
      console.log(`     ${i+1}. ${n.title} - ${n.isRead ? 'READ' : 'UNREAD'} (${n.type})`);
    });
    
    // Test 2: Notification service (same as controller uses)
    console.log('\n📝 Test 2: Notification service (getUserNotifications)');
    const serviceResult = await notificationService.getUserNotifications(kasunUser._id, {
      page: 1,
      limit: 20
    });
    
    console.log(`   Service returned: ${serviceResult.notifications.length} notifications`);
    console.log(`   Unread count: ${serviceResult.unreadCount}`);
    console.log(`   Total count: ${serviceResult.pagination.totalCount}`);
    
    // Test 3: Simulate the exact API response format
    console.log('\n📝 Test 3: API Response Format');
    const apiResponse = {
      success: true,
      data: serviceResult.notifications,
      pagination: serviceResult.pagination,
      unreadCount: serviceResult.unreadCount
    };
    
    console.log('   API Response Structure:');
    console.log(`   {`);
    console.log(`     "success": ${apiResponse.success},`);
    console.log(`     "data": [...${apiResponse.data.length} notifications...],`);
    console.log(`     "pagination": { totalCount: ${apiResponse.pagination.totalCount}, ... },`);
    console.log(`     "unreadCount": ${apiResponse.unreadCount}`);
    console.log(`   }`);
    
    // Test 4: Unread count endpoint format
    console.log('\n📝 Test 4: Unread Count API Response');
    const unreadResponse = {
      success: true,
      unreadCount: serviceResult.unreadCount,
      meta: {
        userId: kasunUser._id.toString(),
        userEmail: kasunUser.email,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('   Unread Count API Response:');
    console.log(`   {`);
    console.log(`     "success": ${unreadResponse.success},`);
    console.log(`     "unreadCount": ${unreadResponse.unreadCount},`);
    console.log(`     "meta": { "userId": "${unreadResponse.meta.userId}", ... }`);
    console.log(`   }`);
    
    console.log('\n🎯 ANALYSIS:');
    if (serviceResult.unreadCount > 0 && serviceResult.notifications.length > 0) {
      console.log('✅ Backend is working perfectly!');
      console.log(`   - User has ${serviceResult.unreadCount} unread notifications`);
      console.log(`   - Service returns ${serviceResult.notifications.length} notifications`);
      console.log(`   - All data is correctly formatted`);
      console.log('\n❌ ISSUE IS IN FRONTEND:');
      console.log('   1. Frontend not calling the API correctly');
      console.log('   2. Frontend not parsing the response correctly');
      console.log('   3. Frontend authentication token might be wrong');
      console.log('   4. Frontend might be calling wrong endpoint');
      
      console.log('\n🔧 FRONTEND DEBUGGING STEPS:');
      console.log('   1. Check browser Network tab - are API calls being made?');
      console.log('   2. Verify API endpoint: GET /api/notifications');
      console.log('   3. Check Authorization header: Bearer <JWT_TOKEN>');
      console.log('   4. Verify response parsing: use response.data (not response.data.data)');
      console.log('   5. Check for JavaScript errors in browser console');
      
    } else {
      console.log('❌ Backend issue detected');
    }
    
    console.log(`\n💡 Expected frontend behavior:`);
    console.log(`   - Should show ${serviceResult.unreadCount} in notification badge`);
    console.log(`   - Should display ${serviceResult.notifications.length} notifications in list`);
    console.log(`   - First notification should be: "${serviceResult.notifications[0]?.title}"`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testKasunNotifications();