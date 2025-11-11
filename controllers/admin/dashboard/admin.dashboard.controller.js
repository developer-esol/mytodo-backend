const adminDashboardService = require("../../../servicesN/admin/dashboard/admin.dashboard.service");
const { logSuccess, logError } = require("../../../utils/requestLogger");

class AdminDashboardController {
  async getDashboardStats(req, res) {
    try {
      const stats = await adminDashboardService.getDashboardStats();

      logSuccess(req, "admin.dashboard.controller", "Get Dashboard Stats", {
        totalUsers: stats.users?.total,
        totalTasks: stats.tasks?.total,
        totalRevenue: stats.revenue?.total,
      });

      res.json({
        status: "success",
        data: stats,
      });
    } catch (error) {
      logError(req, "admin.dashboard.controller", "Get Dashboard Stats", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch dashboard stats",
      });
    }
  }
}

module.exports = new AdminDashboardController();
