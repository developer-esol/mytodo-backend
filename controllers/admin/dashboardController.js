const User = require('../../models/User');
const Task = require('../../models/Task');
const AuditLog = require('../../models/AuditLog');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const os = require('os');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // User statistics
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      status: { $ne: 'deleted' }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: { $ne: 'deleted' }
    });

    // Task statistics
    const totalTasks = await Task.countDocuments({ status: { $ne: 'deleted' } });
    const openTasks = await Task.countDocuments({ status: 'open' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const newTasksThisMonth = await Task.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const newTasksThisWeek = await Task.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Recent activity from audit logs
    const recentActivities = await AuditLog.find({
      timestamp: { $gte: sevenDaysAgo }
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('performedBy', 'firstName lastName email')
      .select('action resource timestamp performedBy success');

    // User growth data for charts (last 30 days)
    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Task completion rate by category
    const tasksByCategory = await Task.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          open: {
            $sum: {
              $cond: [{ $eq: ['$status', 'open'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          completed: 1,
          open: 1,
          completionRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }
            ]
          }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // System health metrics
    const systemHealth = {
      databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      systemMemory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          newThisWeek: newUsersThisWeek,
          growthData: userGrowthData
        },
        tasks: {
          total: totalTasks,
          open: openTasks,
          completed: completedTasks,
          newThisMonth: newTasksThisMonth,
          newThisWeek: newTasksThisWeek,
          byCategory: tasksByCategory
        },
        systemHealth,
        recentActivities
      }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Get system health information
 */
const getSystemHealth = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          responseTime: null
        },
        server: {
          status: 'running',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        system: {
          platform: os.platform(),
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          loadAverage: os.loadavg(),
          cpus: os.cpus().length
        }
      }
    };

    // Test database response time
    const start = Date.now();
    await User.findOne().lean();
    health.services.database.responseTime = Date.now() - start;

    // Determine overall health status
    if (health.services.database.status === 'disconnected') {
      health.status = 'unhealthy';
    } else if (health.services.database.responseTime > 1000) {
      health.status = 'degraded';
    }

    res.status(200).json({
      status: 'success',
      data: health
    });

  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch system health'
    });
  }
};

/**
 * Get recent activities from audit logs
 */
const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20, page = 1, severity, category } = req.query;

    const filter = {
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    };

    if (severity) {
      filter.severity = severity;
    }

    if (category) {
      filter.category = category;
    }

    const activities = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('performedBy', 'firstName lastName email avatar role')
      .populate('targetUser', 'firstName lastName email')
      .select('-userAgent -details.stack');

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    logger.error('Get recent activities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent activities'
    });
  }
};

/**
 * Get analytics data
 */
const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily user registrations
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Daily task creation
    const taskCreations = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // User role distribution
    const userRoles = await User.aggregate([
      {
        $match: { status: { $ne: 'deleted' } }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Task status distribution
    const taskStatuses = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Popular categories
    const popularCategories = await Task.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Activity trends
    const activityTrends = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          },
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count'
            }
          },
          totalActions: { $sum: '$count' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        period: days,
        userRegistrations,
        taskCreations,
        userRoles,
        taskStatuses,
        popularCategories,
        activityTrends
      }
    });

  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics data'
    });
  }
};

module.exports = {
  getDashboardStats,
  getSystemHealth,
  getRecentActivities,
  getAnalytics
};
