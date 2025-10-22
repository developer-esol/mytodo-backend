const http = require('http');

// Simple test to check if server is running
const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/tasks',  // A simple endpoint that should exist
  method: 'GET'
};

console.log('Testing server connectivity...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body (first 200 chars):', data.substring(0, 200));
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.error('Full error:', e);
});

req.end();