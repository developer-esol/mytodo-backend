const logger = require("../../../config/logger");

class AdminCommissionService {
  async getCommissionSettings() {
    try {
      const { getServiceFeeConfig } = require("../../../utils/serviceFee");
      const config = getServiceFeeConfig();

      const commissionSettings = {
        id: 1,
        commissionRate: config.BASE_PERCENTAGE * 100,
        minimumFee: config.MIN_FEE_USD,
        maximumFee: config.MAX_FEE_USD,
        currency: "USD",
        isActive: true,
        appliesTo: "all_tasks",
        description: "Platform commission fee applied to completed tasks",
        supportedCurrencies: Object.keys(config.CURRENCY_RATES),
        currencyRates: config.CURRENCY_RATES,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return commissionSettings;
    } catch (error) {
      logger.error("Get commission settings service error", {
        service: "admin.commission.service",
        error: error.message,
      });
      throw error;
    }
  }

  async updateCommissionSettings(
    commissionRate,
    minimumFee,
    maximumFee,
    currencyRates
  ) {
    try {
      const { updateServiceFeeConfig } = require("../../../utils/serviceFee");
      const newConfig = {};

      if (commissionRate !== undefined) {
        newConfig.BASE_PERCENTAGE = commissionRate / 100;
      }

      if (minimumFee !== undefined) {
        newConfig.MIN_FEE_USD = minimumFee;
      }

      if (maximumFee !== undefined) {
        newConfig.MAX_FEE_USD = maximumFee;
      }

      if (currencyRates !== undefined) {
        newConfig.CURRENCY_RATES = currencyRates;
      }

      const updatedConfig = updateServiceFeeConfig(newConfig);

      const commissionSettings = {
        id: 1,
        commissionRate: updatedConfig.BASE_PERCENTAGE * 100,
        minimumFee: updatedConfig.MIN_FEE_USD,
        maximumFee: updatedConfig.MAX_FEE_USD,
        currency: "USD",
        isActive: true,
        appliesTo: "all_tasks",
        description: "Platform commission fee applied to completed tasks",
        supportedCurrencies: Object.keys(updatedConfig.CURRENCY_RATES),
        currencyRates: updatedConfig.CURRENCY_RATES,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return commissionSettings;
    } catch (error) {
      logger.error("Update commission settings service error", {
        service: "admin.commission.service",
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AdminCommissionService();
