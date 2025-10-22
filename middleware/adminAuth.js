const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { auditLog } = require('../utils/auditLogger');

// Regular user authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is not valid'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'Account is not active'
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
        status: 'error',
        message: 'Account is temporarily locked due to failed login attempts'
      });
    }

    // Update last activity
    user.updateActivity();

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Token verification failed'
    });
  }
};

// Admin authentication
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

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin token is not valid'
      });
    }

    if (!['admin', 'superadmin'].includes(user.role)) {
      // Log unauthorized admin access attempt
      await auditLog(
        'admin_access',
        'user',
        user._id,
        user._id,
        user.role,
        {
          action: 'unauthorized_admin_access_attempt',
          route: req.originalUrl,
          method: req.method
        },
        {},
        {},
        req.ip,
        req.get('User-Agent'),
        false,
        'Unauthorized admin access attempt',
        'high',
        'security'
      );

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'Admin account is not active'
      });
    }

    // Update last activity
    user.updateActivity();

    // Log admin access
    await auditLog(
      'admin_access',
      'user',
      user._id,
      user._id,
      user.role,
      {
        action: 'admin_panel_access',
        route: req.originalUrl,
        method: req.method
      },
      {},
      {},
      req.ip,
      req.get('User-Agent'),
      true,
      null,
      'medium',
      'authentication'
    );

    req.user = user;
    req.admin = user;
    next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    
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
      message: 'Admin token verification failed'
    });
  }
};

// Super admin authentication
const superAdminAuth = async (req, res, next) => {
  try {
    // First run admin auth
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.user || req.user.role !== 'superadmin') {
      // Log unauthorized superadmin access attempt
      await auditLog(
        'admin_access',
        'user',
        req.user?._id,
        req.user?._id,
        req.user?.role || 'unknown',
        {
          action: 'unauthorized_superadmin_access_attempt',
          route: req.originalUrl,
          method: req.method
        },
        {},
        {},
        req.ip,
        req.get('User-Agent'),
        false,
        'Unauthorized superadmin access attempt',
        'critical',
        'security'
      );

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Super admin privileges required.'
      });
    }

    next();
  } catch (error) {
    logger.error('Super admin auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Super admin authentication failed'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient privileges.'
      });
    }

    next();
  };
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
        user.updateActivity();
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  auth,
  adminAuth,
  superAdminAuth,
  authorize,
  optionalAuth
};
