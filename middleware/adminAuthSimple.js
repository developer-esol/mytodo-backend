const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-admin-token');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. Admin token required.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin token is not valid'
      });
    }

    if (!['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'Account is not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Admin token expired'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Super admin authentication middleware
const superAdminAuth = async (req, res, next) => {
  try {
    // First run admin auth
    adminAuth(req, res, (err) => {
      if (err) return next(err);
      
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Super admin privileges required.'
        });
      }
      
      next();
    });
  } catch (error) {
    console.error('Super admin auth error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  adminAuth,
  superAdminAuth
};