const asyncHandler = require('express-async-handler');
const AuditLog = require('../../models/AuditLog');
const logger = require('../../utils/logger');

// @desc    Get audit logs
// @route   GET /api/admin/audit
// @access  Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const logs = await AuditLog.find()
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs'
    });
  }
});

// @desc    Get audit log statistics
// @route   GET /api/admin/audit/stats
// @access  Admin
const getAuditStats = asyncHandler(async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const todayLogs = await AuditLog.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    res.status(200).json({
      success: true,
      message: 'Audit statistics retrieved successfully',
      data: {
        totalLogs,
        todayLogs,
        averageDaily: Math.round(totalLogs / 30)
      }
    });
  } catch (error) {
    logger.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit statistics'
    });
  }
});

// @desc    Export audit logs
// @route   GET /api/admin/audit/export
// @access  Admin
const exportAuditLogs = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Audit logs export generated',
    data: { exportUrl: '/exports/audit-logs.csv' }
  });
});

// @desc    Get security events
// @route   GET /api/admin/audit/security
// @access  Admin
const getSecurityEvents = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Security events retrieved successfully',
    data: { events: [], total: 0 }
  });
});

module.exports = {
  getAuditLogs,
  getAuditStats,
  exportAuditLogs,
  getSecurityEvents
};
