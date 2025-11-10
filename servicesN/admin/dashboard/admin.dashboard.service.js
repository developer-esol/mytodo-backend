const adminUserRepository = require("../../../repository/admin/user/admin.user.repository");
const adminTaskRepository = require("../../../repository/admin/task/admin.task.repository");
const logger = require("../../../config/logger");

class AdminDashboardService {
  async getDashboardStats() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const userStats = await adminUserRepository.getUserStats(
        thirtyDaysAgo,
        sevenDaysAgo
      );
      const taskStats = await adminTaskRepository.getTaskStats(
        thirtyDaysAgo,
        sevenDaysAgo
      );

      return {
        users: userStats,
        tasks: taskStats,
        systemHealth: {
          databaseStatus: "connected",
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        },
      };
    } catch (error) {
      logger.error("Get dashboard stats service error", {
        service: "admin.dashboard.service",
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AdminDashboardService();
