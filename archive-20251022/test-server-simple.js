// Simple server connectivity test
const http = require('http');

console.log('Testing server connectivity...');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Server is responding!');
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response length:', data.length);
  });
});

req.on('error', (err) => {
  console.log('❌ Server error:', err.message);
  console.log('Error code:', err.code);
});

req.on('timeout', () => {
  console.log('❌ Request timeout');
  req.destroy();
});

req.end();