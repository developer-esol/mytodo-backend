// Minimal test server
const express = require("express");
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Minimal server working!', timestamp: new Date() });
});

const PORT = 5001;

const server = app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    return;
  }
  console.log(`🚀 Minimal server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

console.log('🔍 Server setup complete');

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('👋 Server shutting down');
  server.close();
});

process.on('SIGINT', () => {
  console.log('👋 Server shutting down');
  server.close();
  process.exit(0);
});