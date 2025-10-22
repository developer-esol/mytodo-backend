const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Task = require('../../models/Task');
const Payment = require('../../models/Payment');
const { adminAuth } = require('../../middleware/adminAuthSimple');

// Analytics endpoint matching frontend expectations
router.get('/', adminAuth, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Parse time range
    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '30d') days = 30;
    else if (timeRange === '90d') days = 90;
    else if (timeRange === '1y') days = 365;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const now = new Date();

    // User Analytics
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

    // Task Analytics
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

    const taskCompletions = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
            day: { $dayOfMonth: '$updatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Payment & Revenue Analytics
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
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
          totalRevenue: { $sum: '$serviceFee' },
          totalPayments: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgPayment: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Category Performance
    const categoryPerformance = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          taskCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          avgBudget: { $avg: '$budget' },
          totalBudget: { $sum: '$budget' }
        }
      },
      {
        $project: {
          category: '$_id',
          taskCount: 1,
          completedCount: 1,
          completionRate: {
            $cond: [
              { $eq: ['$taskCount', 0] },
              0,
              { $multiply: [{ $divide: ['$completedCount', '$taskCount'] }, 100] }
            ]
          },
          avgBudget: 1,
          totalBudget: 1
        }
      },
      {
        $sort: { taskCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // User Role Distribution
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

    // Task Status Distribution
    const taskStatuses = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Payment Status Distribution
    const paymentStatuses = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly Revenue Trend
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } // This year
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$serviceFee' },
          payments: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top Earning Categories (by service fees)
    const topEarningCategories = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'task',
          foreignField: '_id',
          as: 'taskInfo'
        }
      },
      {
        $unwind: '$taskInfo'
      },
      {
        $group: {
          _id: '$taskInfo.category',
          totalRevenue: { $sum: '$serviceFee' },
          totalPayments: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgRevenue: { $avg: '$serviceFee' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Calculate summary statistics
    const totalRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$serviceFee' },
          totalPayments: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgTransaction: { $avg: '$amount' }
        }
      }
    ]);

    const summary = totalRevenue[0] || {
      totalRevenue: 0,
      totalPayments: 0,
      transactionCount: 0,
      avgTransaction: 0
    };

    // Calculate overview statistics
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });
    const totalTasks = await Task.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    
    // Calculate previous period for growth rates
    const previousPeriodStart = new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000));
    const previousPeriodEnd = startDate;
    
    const previousUsers = await User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
      status: { $ne: 'deleted' }
    });
    
    const previousTasks = await Task.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
    });
    
    const previousRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const previousActiveUsers = await User.countDocuments({
      status: 'active',
      lastLogin: { $gte: previousPeriodStart, $lt: previousPeriodEnd }
    });
    
    // Calculate growth percentages
    const userGrowth = userRegistrations.reduce((acc, day) => acc + day.count, 0);
    const taskGrowth = taskCreations.reduce((acc, day) => acc + day.count, 0);
    
    const userGrowthPercent = previousUsers > 0 ? ((userGrowth - previousUsers) / previousUsers * 100) : 0;
    const taskGrowthPercent = previousTasks > 0 ? ((taskGrowth - previousTasks) / previousTasks * 100) : 0;
    const revenueGrowthPercent = previousRevenue[0]?.total > 0 
      ? ((summary.totalPayments - previousRevenue[0].total) / previousRevenue[0].total * 100) 
      : 0;
    const activeUserGrowthPercent = previousActiveUsers > 0 
      ? ((activeUsers - previousActiveUsers) / previousActiveUsers * 100) 
      : 0;
    
    // Calculate user role counts
    const posters = userRoles.find(r => r._id === 'poster')?.count || 0;
    const taskers = userRoles.find(r => r._id === 'tasker')?.count || 0;
    const admins = userRoles.find(r => r._id === 'admin')?.count || 0;
    
    // Get new users this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonthStart },
      status: { $ne: 'deleted' }
    });
    
    // Calculate task status counts
    const openTasks = taskStatuses.find(t => t._id === 'open')?.count || 0;
    const assignedTasks = taskStatuses.find(t => t._id === 'assigned')?.count || 0;
    const completedTasks = taskStatuses.find(t => t._id === 'completed')?.count || 0;
    const cancelledTasks = taskStatuses.find(t => t._id === 'cancelled')?.count || 0;
    
    const totalTasksForCompletion = openTasks + assignedTasks + completedTasks + cancelledTasks;
    const completionRate = totalTasksForCompletion > 0 
      ? (completedTasks / totalTasksForCompletion * 100) 
      : 0;
    
    const averageTaskValue = totalTasks > 0 
      ? await Task.aggregate([
          {
            $group: {
              _id: null,
              avg: { $avg: '$budget' }
            }
          }
        ]).then(result => result[0]?.avg || 0)
      : 0;
    
    // Calculate revenue stats
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisMonthRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const lastMonthRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const commissions = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$serviceFee' }
        }
      }
    ]);
    
    // Calculate average order value
    const averageOrderValue = summary.transactionCount > 0 
      ? summary.avgTransaction 
      : 0;
    
    // Build response matching frontend expectations
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers,
          totalTasks: totalTasks,
          totalRevenue: Math.round(summary.totalPayments * 100) / 100,
          activeUsers: activeUsers,
          userGrowth: Math.round(userGrowthPercent * 10) / 10,
          taskGrowth: Math.round(taskGrowthPercent * 10) / 10,
          revenueGrowth: Math.round(revenueGrowthPercent * 10) / 10,
          activeUserGrowth: Math.round(activeUserGrowthPercent * 10) / 10
        },
        userStats: {
          posters: posters,
          taskers: taskers,
          admins: admins,
          newUsersThisMonth: newUsersThisMonth
        },
        taskStats: {
          open: openTasks,
          assigned: assignedTasks,
          completed: completedTasks,
          cancelled: cancelledTasks,
          averageTaskValue: Math.round(averageTaskValue * 100) / 100,
          completionRate: Math.round(completionRate * 10) / 10
        },
        revenueStats: {
          thisMonth: Math.round((thisMonthRevenue[0]?.total || 0) * 100) / 100,
          lastMonth: Math.round((lastMonthRevenue[0]?.total || 0) * 100) / 100,
          commissions: Math.round((commissions[0]?.total || 0) * 100) / 100,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100
        },
        charts: {
          userRegistrations,
          taskCreations,
          taskCompletions,
          revenueData,
          monthlyRevenue
        },
        topCategories: categoryPerformance,
        monthlyTrends: monthlyRevenue.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          newUsers: userRegistrations.filter(u => 
            u._id.year === m._id.year && u._id.month === m._id.month
          ).reduce((sum, u) => sum + u.count, 0),
          tasksCreated: taskCreations.filter(t => 
            t._id.year === m._id.year && t._id.month === m._id.month
          ).reduce((sum, t) => sum + t.count, 0),
          revenue: Math.round(m.revenue * 100) / 100
        }))
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics data'
    });
  }
});

module.exports = router;