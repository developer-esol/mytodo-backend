// routes/serviceFeeRoutes.js
const express = require("express");
const router = express.Router();
const { 
  calculateServiceFee, 
  getServiceFeeConfig, 
  updateServiceFeeConfig,
  validateServiceFeeCalculation 
} = require("../utils/serviceFee");
const verifyFirebaseUser = require("../middleware/verifyFirebaseUser");

/**
 * @swagger
 * /api/service-fee/calculate:
 *   post:
 *     summary: Calculate service fee for a given amount
 *     tags: [Service Fee]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Budget amount
 *                 example: 200
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 example: "USD"
 *     responses:
 *       200:
 *         description: Service fee calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 calculation:
 *                   type: object
 *                   properties:
 *                     budgetAmount:
 *                       type: number
 *                     serviceFee:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     breakdown:
 *                       type: object
 */
router.post("/calculate", verifyFirebaseUser, async (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount provided"
      });
    }
    
    const calculation = calculateServiceFee(amount, currency);
    
    res.json({
      success: true,
      calculation
    });
    
  } catch (error) {
    console.error("Service fee calculation error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/service-fee/config:
 *   get:
 *     summary: Get current service fee configuration
 *     tags: [Service Fee]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current service fee configuration
 */
router.get("/config", verifyFirebaseUser, async (req, res) => {
  try {
    const config = getServiceFeeConfig();
    
    res.json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error("Get service fee config error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/service-fee/config:
 *   put:
 *     summary: Update service fee configuration (Admin only)
 *     tags: [Service Fee]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               BASE_PERCENTAGE:
 *                 type: number
 *                 description: Base percentage (0.10 for 10%)
 *                 example: 0.12
 *               MIN_FEE_USD:
 *                 type: number
 *                 description: Minimum fee in USD
 *                 example: 7
 *               MAX_FEE_USD:
 *                 type: number
 *                 description: Maximum fee in USD
 *                 example: 75
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.put("/config", verifyFirebaseUser, async (req, res) => {
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
      config: updatedConfig
    });
    
  } catch (error) {
    console.error("Update service fee config error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/service-fee/test:
 *   get:
 *     summary: Run service fee calculation tests
 *     tags: [Service Fee]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Test results
 */
router.get("/test", verifyFirebaseUser, async (req, res) => {
  try {
    // Capture console output
    const originalLog = console.log;
    let testOutput = '';
    
    console.log = (message) => {
      testOutput += message + '\n';
    };
    
    validateServiceFeeCalculation();
    
    // Restore console.log
    console.log = originalLog;
    
    res.json({
      success: true,
      testOutput
    });
    
  } catch (error) {
    console.error("Service fee test error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
