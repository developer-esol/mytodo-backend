const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { adminAuth, superAdminAuth } = require('../middleware/adminAuthSimple');

// Import admin controllers
const { getDashboardStats, getSystemHealth, getRecentActivities, getAnalytics } = require('../controllers/admin/dashboardController');
const { getUsers, getUser, createUser, updateUser, deleteUser, suspendUser, activateUser, exportUsers, importUsers, bulkUpdateUsers } = require('../controllers/admin/userController');

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Dashboard routes
router.get('/dashboard/stats', adminAuth, getDashboardStats);
router.get('/dashboard/health', adminAuth, getSystemHealth);
router.get('/dashboard/activities', adminAuth, getRecentActivities);
router.get('/dashboard/analytics', adminAuth, getAnalytics);

// User management routes
router.get('/users', adminAuth, getUsers);
router.get('/users/:id', adminAuth, getUser);
router.post('/users', adminAuth, createUser);
router.put('/users/:id', adminAuth, updateUser);
router.delete('/users/:id', superAdminAuth, deleteUser);
router.patch('/users/:id/suspend', adminAuth, suspendUser);
router.patch('/users/:id/activate', adminAuth, activateUser);
router.get('/users/export/csv', adminAuth, exportUsers);
router.post('/users/import/csv', adminAuth, importUsers);
router.patch('/users/bulk-update', adminAuth, bulkUpdateUsers);

// Simple test route
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Admin routes are working!'
  });
});

module.exports = router;