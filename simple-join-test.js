// Simple test for join endpoint
const http = require('http');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/group-chats/68eb385d8e68b13383514220/join',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]eHAiOjE3NjAyNDk1MjV9',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();