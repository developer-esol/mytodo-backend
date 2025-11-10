const adminAnalyticsService = require("../../../servicesN/admin/analytics/admin.analytics.service");
const { logSuccess, logError } = require("../../../utils/requestLogger");

class AdminAnalyticsController {
  async getAnalytics(req, res) {
    try {
      const { timeRange = "30d" } = req.query;

      const analytics = await adminAnalyticsService.getAnalytics(timeRange);

      logSuccess(req, "admin.analytics.controller", "Get Analytics", {
        timeRange,
        userRegistrations: analytics.userRegistrations?.length,
        revenueDataPoints: analytics.revenue?.length,
        totalRevenue: analytics.totalRevenue,
      });

      res.json({
        status: "success",
        data: analytics,
      });
    } catch (error) {
      logError(req, "admin.analytics.controller", "Get Analytics", error, {
        timeRange: req.query.timeRange,
      });

      res.status(500).json({
        status: "error",
        message: "Failed to fetch analytics data",
        error: error.message,
      });
    }
  }
}

module.exports = new AdminAnalyticsController();
