// debug-notification-api.js - Simple debug test for frontend integration
const http = require('http');

// Test the exact API response format that frontend expects
function debugNotificationAPI() {
  console.log('🔍 Debugging Notification API Response Format...\n');

  // Test data to send
  const testData = JSON.stringify({
    userId: '68bba9aa738031d9bcf0bdf3',
    type: 'SYSTEM_UPDATE', 
    title: 'Debug Test Notification',
    message: 'Testing frontend integration debug'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/notifications/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  console.log('📝 Step 1: Creating test notification via webhook...');

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`✅ Webhook Status: ${res.statusCode}`);
      
      if (res.statusCode === 201) {
        console.log('✅ Test notification created successfully!\n');
        
        // Now test the main API endpoint format
        testMainAPIEndpoint();
      } else {
        console.log('❌ Webhook failed:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Webhook request error:', error.message);
  });

  req.write(testData);
  req.end();
}

function testMainAPIEndpoint() {
  console.log('📝 Step 2: Testing main API endpoint response format...\n');
  console.log('🔍 Expected Frontend Request:');
  console.log('   GET /api/notifications?page=1&limit=20');
  console.log('   Headers: Authorization: Bearer <JWT_TOKEN>\n');
  
  console.log('📋 Expected Response Format for Frontend:');
  console.log(`   {
     "success": true,
     "data": [
       {
         "_id": "notification_id",
         "type": "OFFER_MADE",
         "title": "New Offer Received", 
         "message": "John made an offer...",
         "isRead": false,
         "createdAt": "2025-10-09T...",
         "metadata": {
           "taskTitle": "Clean Kitchen",
           "offerAmount": 50,
           "senderName": "John Doe"
         },
         "actionUrl": "/tasks/123"
       }
     ],
     "pagination": {
       "currentPage": 1,
       "totalPages": 1,
       "totalCount": 10,
       "hasNext": false,
       "hasPrev": false
     },
     "unreadCount": 7
   }\n`);

  console.log('🚨 POTENTIAL ISSUES TO CHECK:');
  console.log('   1. ❓ Is frontend using correct Authorization header?');
  console.log('   2. ❓ Is frontend calling correct URL (http://localhost:5001)?');
  console.log('   3. ❓ Is frontend parsing response.data.data correctly?');
  console.log('   4. ❓ Is user ID matching between frontend login and backend?');
  console.log('   5. ❓ Are notifications created for the logged-in user?\n');

  console.log('🔧 DEBUGGING STEPS FOR FRONTEND:');
  console.log('   1. Check browser Network tab for API calls');
  console.log('   2. Verify JWT token is being sent correctly');
  console.log('   3. Check console for API response data');
  console.log('   4. Verify user ID matches between login and notifications');
  console.log('   5. Test API directly with Postman/curl\n');

  console.log('📝 Manual Test Command (replace YOUR_JWT_TOKEN):');
  console.log('   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
  console.log('        http://localhost:5001/api/notifications\n');

  console.log('🎯 Quick Fix Test:');
  console.log('   1. Open browser dev tools');
  console.log('   2. Go to Network tab');
  console.log('   3. Reload notifications page');
  console.log('   4. Check if /api/notifications request appears');
  console.log('   5. Check response status and data');
}

// Run debug
debugNotificationAPI();

console.log('🚀 MyToDoo Notification API Debug Tool\n');
console.log('❓ Issue: Frontend shows "No notifications found" but backend has notifications\n');
console.log('🔍 This will help identify the exact issue...\n');