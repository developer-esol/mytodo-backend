const express = require("express");
const router = express.Router();
const logger = require("../../../config/logger");

logger.info("Loading admin routes", {
  service: "admin.routes",
  file: "adminRoutes.js",
});

// Import modular admin route files
const adminAuthRoutes = require("./admin/adminAuthRoutes");
const adminDashboardRoutes = require("./admin/adminDashboardRoutes");
const adminUserRoutes = require("./admin/adminUserRoutes");
const adminTaskRoutes = require("./admin/adminTaskRoutes");
const adminAnalyticsRoutes = require("./admin/adminAnalyticsRoutes");
const adminCommissionRoutes = require("./admin/adminCommissionRoutes");
const adminMetadataRoutes = require("./admin/adminMetadataRoutes");
const adminEmailRoutes = require("./admin/adminEmailRoutes");
const adminCategoryRoutes = require("./admin/adminCategoryRoutes");

// Mount route modules with their respective paths
router.use("/", adminAuthRoutes); // /api/admin/login
router.use("/dashboard", adminDashboardRoutes); // /api/admin/dashboard/stats
router.use("/users", adminUserRoutes); // /api/admin/users
router.use("/tasks", adminTaskRoutes); // /api/admin/tasks
router.use("/analytics", adminAnalyticsRoutes); // /api/admin/analytics
router.use("/commission-settings", adminCommissionRoutes); // /api/admin/commission-settings
router.use("/smtp-settings", adminEmailRoutes); // /api/admin/smtp-settings
router.use("/categories", adminCategoryRoutes); // /api/admin/categories
router.use("/", adminMetadataRoutes); // /api/admin/metadata, /api/admin/test

logger.info("Admin routes loaded successfully", {
  service: "admin.routes",
  file: "adminRoutes.js",
  routes: [
    "/login",
    "/dashboard/stats",
    "/users",
    "/tasks",
    "/analytics",
    "/commission-settings",
    "/smtp-settings",
    "/categories",
    "/metadata",
    "/test",
  ],
});
module.exports = router;
