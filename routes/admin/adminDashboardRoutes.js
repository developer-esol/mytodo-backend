const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Task = require('../../models/Task');
const { adminAuth } = require('../../middleware/adminAuthSimple');

// Dashboard stats endpoint
router.get('/stats', adminAuth, async (req, res) => {
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
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const openTasks = await Task.countDocuments({ status: { $in: ['open', 'assigned', 'in-progress'] } });
    const newTasksThisMonth = await Task.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const newTasksThisWeek = await Task.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          newThisWeek: newUsersThisWeek
        },
        tasks: {
          total: totalTasks,
          open: openTasks,
          completed: completedTasks,
          newThisMonth: newTasksThisMonth,
          newThisWeek: newTasksThisWeek
        },
        systemHealth: {
          databaseStatus: 'connected',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats'
    });
  }
});

module.exports = router;