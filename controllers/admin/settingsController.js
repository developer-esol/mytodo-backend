const asyncHandler = require('express-async-handler');
const logger = require('../../utils/logger');

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  SuperAdmin
const getSettings = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'System settings retrieved successfully',
    data: {
      general: {
        siteName: 'MyTodo',
        maintenanceMode: false,
        registrationOpen: true
      },
      features: {
        enablePayments: true,
        enableNotifications: true,
        enableChat: true
      },
      limits: {
        maxTasksPerUser: 100,
        maxFileSize: 10485760, // 10MB
        maxFilesPerTask: 5
      }
    }
  });
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  SuperAdmin
const updateSettings = asyncHandler(async (req, res) => {
  const { general, features, limits } = req.body;

  logger.info(`Settings updated by admin ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      general,
      features,
      limits
    }
  });
});

// @desc    Reset settings to default
// @route   POST /api/admin/settings/reset
// @access  SuperAdmin
const resetSettings = asyncHandler(async (req, res) => {
  logger.info(`Settings reset by admin ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: 'Settings reset to defaults successfully'
  });
});

// @desc    Get email templates
// @route   GET /api/admin/settings/email-templates
// @access  Admin
const getEmailTemplates = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Email templates retrieved successfully',
    data: {
      templates: [
        { id: 1, name: 'Welcome Email', subject: 'Welcome!', content: 'Welcome to MyTodo!' },
        { id: 2, name: 'Password Reset', subject: 'Reset Password', content: 'Click to reset your password.' }
      ]
    }
  });
});

// @desc    Update email template
// @route   PUT /api/admin/settings/email-templates/:id
// @access  Admin
const updateEmailTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  res.status(200).json({
    success: true,
    message: 'Email template updated successfully',
    data: { id, ...req.body }
  });
});

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
  getEmailTemplates,
  updateEmailTemplate
};
