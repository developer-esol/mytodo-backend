const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

exports.getCategories = async (req, res) => {
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select('name description icon locationType');

    // Process categories to ensure icon URLs are complete and accessible
    const processedCategories = categories.map(category => {
      const categoryObj = category.toObject();
      
      // Ensure icon path is complete
      if (categoryObj.icon && !categoryObj.icon.startsWith('http')) {
        // If it's a relative path, make sure it starts with /
        if (!categoryObj.icon.startsWith('/')) {
          categoryObj.icon = '/' + categoryObj.icon;
        }
        // Add full URL for better frontend handling
        categoryObj.iconUrl = `${req.protocol}://${req.get('host')}${categoryObj.icon}`;
      }
      
      return categoryObj;
    });

    res.status(200).json({
      success: true,
      data: processedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

exports.getCategoriesByLocationType = async (req, res) => {
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { type } = req.query;

    // Validate type parameter
    if (!type || !['In-person', 'Online'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location type. Must be "In-person" or "Online"'
      });
    }

    // Build filter based on location type
    let filter = { isActive: true };
    
    if (type === 'In-person') {
      // Show physical and both categories
      filter.$or = [
        { locationType: 'physical' },
        { locationType: 'both' }
      ];
    } else if (type === 'Online') {
      // Show online and both categories
      filter.$or = [
        { locationType: 'online' },
        { locationType: 'both' }
      ];
    }

    const categories = await Category.find(filter)
      .sort({ order: 1, name: 1 })
      .select('name description icon locationType');

    // Process categories to ensure icon URLs are complete and accessible
    const processedCategories = categories.map(category => {
      const categoryObj = category.toObject();
      
      // Ensure icon path is complete
      if (categoryObj.icon && !categoryObj.icon.startsWith('http')) {
        // If it's a relative path, make sure it starts with /
        if (!categoryObj.icon.startsWith('/')) {
          categoryObj.icon = '/' + categoryObj.icon;
        }
        // Add full URL for better frontend handling
        categoryObj.iconUrl = `${req.protocol}://${req.get('host')}${categoryObj.icon}`;
      }
      
      return categoryObj;
    });

    res.status(200).json({
      success: true,
      data: processedCategories,
      locationType: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by location type',
      error: error.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, order } = req.body;
    
    const category = await Category.create({
      name,
      description,
      icon,
      order
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};
