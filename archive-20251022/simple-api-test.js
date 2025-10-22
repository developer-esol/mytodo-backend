// simple-api-test.js
const http = require('http');

const testData = JSON.stringify({
  userId: '68bba9aa738031d9bcf0bdf3',
  type: 'SYSTEM_UPDATE',
  title: 'API Test from Node',
  message: 'Testing the notification webhook endpoint',
  priority: 'NORMAL'
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

console.log('🚀 Testing notification webhook...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
    
    if (res.statusCode === 201) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(testData);
req.end();