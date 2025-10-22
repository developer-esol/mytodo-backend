const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Test route to get categories
app.get('/test/categories', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const categories = await Category.find({}).limit(10);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route to check if a specific icon exists
app.get('/test/icon/:iconName', (req, res) => {
  const iconPath = path.join(__dirname, 'public', 'images', 'categories', req.params.iconName + '.svg');
  res.sendFile(iconPath);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Test categories at: http://localhost:${PORT}/test/categories`);
  console.log(`Test icon at: http://localhost:${PORT}/test/icon/fence-construction`);
  console.log(`Direct icon access: http://localhost:${PORT}/images/categories/fence-construction.svg`);
});