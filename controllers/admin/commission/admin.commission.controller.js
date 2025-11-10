const adminCommissionService = require("../../../servicesN/admin/commission/admin.commission.service");
const { logSuccess, logError } = require("../../../utils/requestLogger");

class AdminCommissionController {
  async getCommissionSettings(req, res) {
    try {
      const settings = await adminCommissionService.getCommissionSettings();

      logSuccess(
        req,
        "admin.commission.controller",
        "Get Commission Settings",
        {
          commissionRate: settings.commissionRate,
          minimumFee: settings.minimumFee,
          maximumFee: settings.maximumFee,
        }
      );

      res.json({
        status: "success",
        data: settings,
      });
    } catch (error) {
      logError(
        req,
        "admin.commission.controller",
        "Get Commission Settings",
        error
      );

      res.status(500).json({
        status: "error",
        message: "Failed to fetch commission settings",
        error: error.message,
      });
    }
  }

  async updateCommissionSettings(req, res) {
    try {
      const { commissionRate, minimumFee, maximumFee, currencyRates } =
        req.body;

      const settings = await adminCommissionService.updateCommissionSettings(
        commissionRate,
        minimumFee,
        maximumFee,
        currencyRates
      );

      logSuccess(
        req,
        "admin.commission.controller",
        "Update Commission Settings",
        {
          newCommissionRate: commissionRate,
          newMinimumFee: minimumFee,
          newMaximumFee: maximumFee,
          currencyRatesUpdated: !!currencyRates,
        }
      );

      res.json({
        status: "success",
        data: settings,
        message: "Commission settings updated successfully",
      });
    } catch (error) {
      logError(
        req,
        "admin.commission.controller",
        "Update Commission Settings",
        error,
        {
          attemptedCommissionRate: req.body.commissionRate,
          attemptedMinimumFee: req.body.minimumFee,
          attemptedMaximumFee: req.body.maximumFee,
        }
      );

      res.status(500).json({
        status: "error",
        message: "Failed to update commission settings",
        error: error.message,
      });
    }
  }
}

module.exports = new AdminCommissionController();
