require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const Category = require('./models/Category');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));

// Serve static files with CORS headers (the fix)
app.use('/images', cors(), express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public')));

// Test endpoint to check categories
app.get('/test/categories', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select('name description icon')
      .limit(3);

    const processedCategories = categories.map(category => {
      const categoryObj = category.toObject();
      
      if (categoryObj.icon && !categoryObj.icon.startsWith('http')) {
        if (!categoryObj.icon.startsWith('/')) {
          categoryObj.icon = '/' + categoryObj.icon;
        }
        categoryObj.iconUrl = `${req.protocol}://${req.get('host')}${categoryObj.icon}`;
      }
      
      return categoryObj;
    });

    res.json({
      success: true,
      message: 'Icons should now be accessible with CORS headers',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      data: processedCategories,
      testUrls: processedCategories.map(cat => cat.iconUrl)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test categories API: http://localhost:${PORT}/test/categories`);
  console.log(`Test icon access: http://localhost:${PORT}/images/categories/fence-construction.svg`);
});