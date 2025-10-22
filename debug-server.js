// Debug server startup
const app = require("./app");
const http = require('http');

console.log('🔍 Starting server debug...');

// Create HTTP server
const server = http.createServer(app);

console.log('✅ HTTP server created');

const PORT = process.env.PORT || 5001;

server.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    return;
  }
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

console.log('📡 Server listen called...');