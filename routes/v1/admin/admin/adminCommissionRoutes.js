const express = require("express");
const router = express.Router();
const { adminAuth } = require("../../../../middleware/adminAuthSimple");
const validators = require("../../../../validators/v1/admin/admin.validator");

// Commission Settings Endpoint (maps to service fee configuration)
router.get("/", adminAuth, async (req, res) => {
  try {
    const { getServiceFeeConfig } = require("../../utils/serviceFee");
    const config = getServiceFeeConfig();

    // Transform service fee config to commission settings format expected by frontend
    const commissionSettings = {
      id: 1,
      commissionRate: config.BASE_PERCENTAGE * 100, // Convert to percentage (e.g., 10 for 10%)
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

    res.json({
      status: "success",
      data: commissionSettings,
    });
  } catch (error) {
    console.error("Get commission settings error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch commission settings",
      error: error.message,
    });
  }
});

// Update Commission Settings Endpoint
router.put(
  "/",
  adminAuth,
  ...validators.updateCommissionSettings,
  async (req, res) => {
    try {
      const { updateServiceFeeConfig } = require("../../utils/serviceFee");
      const { commissionRate, minimumFee, maximumFee, currencyRates } =
        req.body;

      // Transform commission settings format to service fee config format
      const newConfig = {};

      if (commissionRate !== undefined) {
        newConfig.BASE_PERCENTAGE = commissionRate / 100; // Convert percentage to decimal
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

      // Update the service fee configuration
      const updatedConfig = updateServiceFeeConfig(newConfig);

      // Transform back to commission settings format for response
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

      res.json({
        status: "success",
        data: commissionSettings,
        message: "Commission settings updated successfully",
      });
    } catch (error) {
      console.error("Update commission settings error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update commission settings",
        error: error.message,
      });
    }
  }
);

module.exports = router;
