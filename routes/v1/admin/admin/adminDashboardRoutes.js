const express = require("express");
const router = express.Router();
const adminDashboardController = require("../../../../controllers/admin/dashboard/admin.dashboard.controller");
const { adminAuth } = require("../../../../middleware/adminAuthSimple");

// Dashboard stats endpoint
router.get(
  "/stats",
  adminAuth,
  adminDashboardController.getDashboardStats.bind(adminDashboardController)
);

module.exports = router;
