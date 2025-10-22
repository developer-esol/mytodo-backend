const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { adminAuth } = require('../../middleware/adminAuthSimple');

// Users list endpoint
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    
    // Build filter
    let filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle role filtering
    if (role && role !== '' && role !== 'All Roles' && role !== 'all') {
      // Convert frontend role values to backend role values
      const roleMapping = {
        'Poster': 'poster',
        'Tasker': 'tasker', 
        'Admin': 'admin',
        'Super Admin': 'superadmin',
        'User': 'user'
      };
      
      const mappedRole = roleMapping[role] || role.toLowerCase();
      filter.role = mappedRole;
    }
    
    // Handle status filtering 
    if (status && status !== '' && status !== 'All Statuses' && status !== 'all') {
      const statusMapping = {
        'Active': 'active',
        'Inactive': 'inactive', 
        'Suspended': 'suspended'
      };
      
      const mappedStatus = statusMapping[status] || status.toLowerCase();
      filter.status = mappedStatus;
    } else {
      filter.status = { $ne: 'deleted' }; // Always exclude deleted users
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await User.countDocuments(filter);
    
    // Format users data to include rating information for admin panel
    const formattedUsers = users.map(user => {
      const userObj = user.toObject({ transform: false }); // Get raw object without transforms
      
      return {
        _id: userObj._id,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        email: userObj.email,
        phone: userObj.phone,
        role: userObj.role,
        status: userObj.status,
        avatar: userObj.avatar,
        location: userObj.location,
        completedTasks: userObj.completedTasks || 0,
        isVerified: userObj.isVerified,
        isEmailVerified: userObj.isEmailVerified,
        isPhoneVerified: userObj.isPhoneVerified,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt,
        // Include rating information
        rating: userObj.rating || 0,
        ratingStats: {
          overall: {
            average: userObj.ratingStats?.overall?.average || 0,
            count: userObj.ratingStats?.overall?.count || 0,
            distribution: userObj.ratingStats?.overall?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          asPoster: {
            average: userObj.ratingStats?.asPoster?.average || 0,
            count: userObj.ratingStats?.asPoster?.count || 0
          },
          asTasker: {
            average: userObj.ratingStats?.asTasker?.average || 0,
            count: userObj.ratingStats?.asTasker?.count || 0
          }
        }
      };
    });
    
    res.json({
      status: 'success',
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// Get single user details with full rating information
router.get('/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const userObj = user.toObject({ transform: false }); // Get raw object without transforms
    
    // Format user data with complete rating information
    const formattedUser = {
      _id: userObj._id,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      email: userObj.email,
      phone: userObj.phone,
      role: userObj.role,
      status: userObj.status,
      avatar: userObj.avatar,
      location: userObj.location,
      bio: userObj.bio,
      skills: userObj.skills,
      completedTasks: userObj.completedTasks || 0,
      isVerified: userObj.isVerified,
      isEmailVerified: userObj.isEmailVerified,
      isPhoneVerified: userObj.isPhoneVerified,
      verification: userObj.verification,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
      // Include complete rating information
      rating: userObj.rating || 0,
      ratingStats: {
        overall: {
          average: userObj.ratingStats?.overall?.average || 0,
          count: userObj.ratingStats?.overall?.count || 0,
          distribution: userObj.ratingStats?.overall?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        },
        asPoster: {
          average: userObj.ratingStats?.asPoster?.average || 0,
          count: userObj.ratingStats?.asPoster?.count || 0
        },
        asTasker: {
          average: userObj.ratingStats?.asTasker?.average || 0,
          count: userObj.ratingStats?.asTasker?.count || 0
        }
      }
    };
    
    res.json({
      status: 'success',
      data: formattedUser
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user details'
    });
  }
});

module.exports = router;