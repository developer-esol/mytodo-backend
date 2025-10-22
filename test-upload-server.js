// Simple server for testing upload functionality
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5002; // Use different port to avoid conflicts

// CORS and basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import and use upload routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api', uploadRoutes);

// Simple health check
app.get('/', (req, res) => {
  res.json({ message: 'Upload test server is running', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Upload test server running on port ${PORT}`);
});