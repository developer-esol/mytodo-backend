// routes/serviceFeeRoutes.js
const express = require("express");
const router = express.Router();
const {
  calculateServiceFee,
  getServiceFeeConfig,
  updateServiceFeeConfig,
  validateServiceFeeCalculation,
} = require("../../../utils/serviceFee");
const verifyFirebaseUser = require("../../../middleware/verifyFirebaseUser");
const validators = require("../../../validators/v1/payments/serviceFee.validator");

// Calculate service fee for a given amount
router.post(
  "/calculate",
  verifyFirebaseUser,
  validators.calculateServiceFee,
  async (req, res) => {
    try {
      const { amount, currency = "USD" } = req.body;

      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount provided",
        });
      }

      const calculation = calculateServiceFee(amount, currency);

      res.json({
        success: true,
        calculation,
      });
    } catch (error) {
      console.error("Service fee calculation error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get current service fee configuration
router.get("/config", verifyFirebaseUser, async (req, res) => {
  try {
    const config = getServiceFeeConfig();

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Get service fee config error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update service fee configuration (Admin only)
router.put(
  "/config",
  verifyFirebaseUser,
  validators.updateServiceFeeConfig,
  async (req, res) => {
    try {
      // TODO: Add admin role check here
      // if (!req.user.isAdmin) {
      //   return res.status(403).json({
      //     success: false,
      //     error: "Admin access required"
      //   });
      // }

      const newConfig = req.body;
      const updatedConfig = updateServiceFeeConfig(newConfig);

      res.json({
        success: true,
        message: "Service fee configuration updated",
        config: updatedConfig,
      });
    } catch (error) {
      console.error("Update service fee config error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Run service fee calculation tests
router.get("/test", verifyFirebaseUser, async (req, res) => {
  try {
    // Capture console output
    const originalLog = console.log;
    let testOutput = "";

    console.log = (message) => {
      testOutput += message + "\n";
    };

    validateServiceFeeCalculation();

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      testOutput,
    });
  } catch (error) {
    console.error("Service fee test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
