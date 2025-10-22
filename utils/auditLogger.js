// Simple audit logger placeholder
const logger = require('./logger');

const logAdminAction = async (action, resourceType, resourceId, userId, userRole, details, oldValue, newValue, ipAddress, userAgent, success, error, severity, category) => {
  try {
    // Simple logging for now - can be enhanced later
    logger.info('Admin Action:', {
      action,
      resourceType,
      resourceId,
      userId,
      userRole,
      success,
      error,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('Audit logging error:', err);
  }
};

const auditLog = logAdminAction;

module.exports = {
  logAdminAction,
  auditLog
};