const adminAnalyticsRepository = require("../../../repository/admin/analytics/admin.analytics.repository");
const adminUserRepository = require("../../../repository/admin/user/admin.user.repository");
const adminTaskRepository = require("../../../repository/admin/task/admin.task.repository");
const logger = require("../../../config/logger");

class AdminAnalyticsService {
  parseTimeRange(timeRange) {
    let days = 30;
    if (timeRange === "7d") days = 7;
    else if (timeRange === "90d") days = 90;
    else if (timeRange === "1y") days = 365;
    return days;
  }

  async getAnalytics(timeRange = "30d") {
    try {
      const days = this.parseTimeRange(timeRange);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const now = new Date();

      const [
        userRegistrations,
        taskCreations,
        taskCompletions,
        revenueData,
        categoryPerformance,
        userRoles,
        taskStatuses,
        paymentStatuses,
        monthlyRevenue,
        topEarningCategories,
        totalRevenue,
      ] = await Promise.all([
        adminAnalyticsRepository.getUserRegistrations(startDate),
        adminTaskRepository.getTaskCreationsAggregation(startDate),
        adminTaskRepository.getTaskCompletionsAggregation(startDate),
        adminAnalyticsRepository.getRevenueData(startDate),
        adminTaskRepository.getCategoryPerformance(startDate),
        adminUserRepository.getUserRoleDistribution(),
        adminTaskRepository.getTaskStatusDistribution(),
        adminAnalyticsRepository.getPaymentStatuses(startDate),
        adminAnalyticsRepository.getMonthlyRevenue(
          new Date(now.getFullYear(), 0, 1)
        ),
        adminAnalyticsRepository.getTopEarningCategories(startDate),
        adminAnalyticsRepository.getTotalRevenue(startDate),
      ]);

      return {
        userRegistrations,
        taskCreations,
        taskCompletions,
        revenueData,
        categoryPerformance,
        userRoles,
        taskStatuses,
        paymentStatuses,
        monthlyRevenue,
        topEarningCategories,
        summary: {
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
          totalPayments: totalRevenue[0]?.totalPayments || 0,
          transactionCount: totalRevenue[0]?.transactionCount || 0,
          avgTransaction: totalRevenue[0]?.avgTransaction || 0,
          timeRange,
          startDate,
          endDate: now,
        },
      };
    } catch (error) {
      logger.error("Get analytics service error", {
        service: "admin.analytics.service",
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AdminAnalyticsService();
