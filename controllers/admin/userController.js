const User = require('../../models/User');
const { logAdminAction } = require('../../utils/auditLogger');
const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const { Transform } = require('json2csv');
const fs = require('fs');
const path = require('path');

/**
 * Get all users with filtering and pagination
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('-password -twoFactorSecret -passwordResetToken -emailVerificationToken')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Get single user by ID
 */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -twoFactorSecret -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get user's tasks and other related data
    const Task = require('../../models/Task');
    const taskStats = await Task.aggregate([
      {
        $match: { createdBy: user._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        taskStats
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user'
    });
  }
};

/**
 * Create new user
 */
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role = 'poster',
      status = 'active'
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      status,
      isEmailVerified: true // Admin-created users are pre-verified
    });

    await user.save();

    // Log admin action
    await logAdminAction(
      'create',
      'user',
      user._id,
      req.admin._id,
      req.admin.role,
      {
        userEmail: user.email,
        userRole: user.role
      },
      req.ip,
      req.get('User-Agent')
    );

    // Return user without password
    const userResponse = await User.findById(user._id)
      .select('-password -twoFactorSecret');

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Store previous values for audit
    const previousValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status
    };

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates._id;
    delete updates.__v;

    // Hash password if provided
    if (updates.newPassword) {
      const salt = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(updates.newPassword, salt);
      delete updates.newPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret');

    // Log admin action
    await logAdminAction(
      'update',
      'user',
      user._id,
      req.admin._id,
      req.admin.role,
      {
        updatedFields: Object.keys(updates),
        previousValues,
        newValues: updates
      },
      req.ip,
      req.get('User-Agent'),
      user._id
    );

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Soft delete by setting status to deleted
    user.status = 'deleted';
    await user.save();

    // Log admin action
    await logAdminAction(
      'delete',
      'user',
      user._id,
      req.admin._id,
      req.admin.role,
      {
        userEmail: user.email,
        deletedAt: new Date()
      },
      req.ip,
      req.get('User-Agent'),
      user._id
    );

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
};

/**
 * Suspend user
 */
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const previousStatus = user.status;
    user.status = 'suspended';
    await user.save();

    // Log admin action
    await logAdminAction(
      'user_suspend',
      'user',
      user._id,
      req.admin._id,
      req.admin.role,
      {
        reason,
        previousStatus,
        suspendedAt: new Date()
      },
      req.ip,
      req.get('User-Agent'),
      user._id
    );

    res.status(200).json({
      status: 'success',
      message: 'User suspended successfully'
    });

  } catch (error) {
    logger.error('Suspend user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to suspend user'
    });
  }
};

/**
 * Activate user
 */
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const previousStatus = user.status;
    user.status = 'active';
    await user.save();

    // Log admin action
    await logAdminAction(
      'user_activate',
      'user',
      user._id,
      req.admin._id,
      req.admin.role,
      {
        previousStatus,
        activatedAt: new Date()
      },
      req.ip,
      req.get('User-Agent'),
      user._id
    );

    res.status(200).json({
      status: 'success',
      message: 'User activated successfully'
    });

  } catch (error) {
    logger.error('Activate user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate user'
    });
  }
};

/**
 * Export users to CSV
 */
const exportUsers = async (req, res) => {
  try {
    const { format = 'csv', filters = {} } = req.body;

    const users = await User.find(filters)
      .select('-password -twoFactorSecret -passwordResetToken -emailVerificationToken')
      .lean();

    if (format === 'csv') {
      const fields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'status',
        'createdAt',
        'lastLogin',
        'completedTasks',
        'rating.average'
      ];

      const json2csvParser = new Transform({ fields });
      const csv = json2csvParser.transform(users);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="users.json"');
      res.json(users);
    }

    // Log export action
    await logAdminAction(
      'export_data',
      'user',
      null,
      req.admin._id,
      req.admin.role,
      {
        format,
        recordCount: users.length,
        filters
      },
      req.ip,
      req.get('User-Agent')
    );

  } catch (error) {
    logger.error('Export users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export users'
    });
  }
};

/**
 * Import users from CSV
 */
const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          processedCount++;
          
          const {
            firstName,
            lastName,
            email,
            phone,
            role = 'poster',
            status = 'active'
          } = row;

          if (!email || !firstName || !lastName) {
            errors.push({
              row: processedCount,
              error: 'Missing required fields (firstName, lastName, email)'
            });
            return;
          }

          // Check if user exists
          let user = await User.findOne({ email });
          
          if (user) {
            // Update existing user
            user.firstName = firstName;
            user.lastName = lastName;
            user.phone = phone;
            user.role = role;
            user.status = status;
            await user.save();
            updatedCount++;
          } else {
            // Create new user
            user = new User({
              firstName,
              lastName,
              email,
              phone,
              role,
              status,
              password: 'TempPassword123!', // Temporary password
              isEmailVerified: true
            });
            await user.save();
            createdCount++;
          }

        } catch (error) {
          errors.push({
            row: processedCount,
            error: error.message
          });
        }
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Log import action
        await logAdminAction(
          'import_data',
          'user',
          null,
          req.admin._id,
          req.admin.role,
          {
            processedCount,
            createdCount,
            updatedCount,
            errorCount: errors.length,
            fileName: req.file.originalname
          },
          req.ip,
          req.get('User-Agent')
        );

        res.status(200).json({
          status: 'success',
          message: 'Import completed',
          data: {
            processedCount,
            createdCount,
            updatedCount,
            errorCount: errors.length,
            errors: errors.slice(0, 10) // Return first 10 errors only
          }
        });
      });

  } catch (error) {
    logger.error('Import users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import users'
    });
  }
};

/**
 * Bulk update users
 */
const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updates, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User IDs array is required'
      });
    }

    let result;

    switch (action) {
      case 'updateStatus':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { status: updates.status } }
        );
        break;

      case 'updateRole':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { role: updates.role } }
        );
        break;

      case 'delete':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { $set: { status: 'deleted' } }
        );
        break;

      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid bulk action'
        });
    }

    // Log bulk action
    await logAdminAction(
      'bulk_action',
      'user',
      null,
      req.admin._id,
      req.admin.role,
      {
        action,
        userIds,
        updates,
        affectedCount: result.modifiedCount
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: `Bulk ${action} completed`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error('Bulk update users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to perform bulk update'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  exportUsers,
  importUsers,
  bulkUpdateUsers
};
