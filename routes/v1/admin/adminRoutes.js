const express = require("express");
const router = express.Router();

console.log("🔧 Loading admin routes...");

// Import modular admin route files
const adminAuthRoutes = require("./admin/adminAuthRoutes");
const adminDashboardRoutes = require("./admin/adminDashboardRoutes");
const adminUserRoutes = require("./admin/adminUserRoutes");
const adminTaskRoutes = require("./admin/adminTaskRoutes");
const adminAnalyticsRoutes = require("./admin/adminAnalyticsRoutes");
const adminCommissionRoutes = require("./admin/adminCommissionRoutes");
const adminMetadataRoutes = require("./admin/adminMetadataRoutes");

// Mount route modules with their respective paths
router.use("/", adminAuthRoutes); // /api/admin/login
router.use("/dashboard", adminDashboardRoutes); // /api/admin/dashboard/stats
router.use("/users", adminUserRoutes); // /api/admin/users
router.use("/tasks", adminTaskRoutes); // /api/admin/tasks
router.use("/analytics", adminAnalyticsRoutes); // /api/admin/analytics
router.use("/commission-settings", adminCommissionRoutes); // /api/admin/commission-settings
router.use("/", adminMetadataRoutes); // /api/admin/metadata, /api/admin/test

console.log("✅ Admin routes loaded successfully");
module.exports = router;
