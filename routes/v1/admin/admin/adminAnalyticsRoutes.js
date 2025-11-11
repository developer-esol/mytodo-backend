const express = require("express");
const router = express.Router();
const adminAnalyticsController = require("../../../../controllers/admin/analytics/admin.analytics.controller");
const { adminAuth } = require("../../../../middleware/adminAuthSimple");
const validators = require("../../../../validators/v1/admin/admin.validator");

// Analytics endpoint matching frontend expectations
router.get(
  "/",
  adminAuth,
  ...validators.getAnalytics,
  adminAnalyticsController.getAnalytics.bind(adminAnalyticsController)
);

module.exports = router;
