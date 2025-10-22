// routes/docs/serviceFee.swagger.js
/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceFeeCalculation:
 *       type: object
 *       properties:
 *         budgetAmount:
 *           type: number
 *           description: Original budget amount
 *           example: 200
 *         serviceFee:
 *           type: number
 *           description: Calculated service fee
 *           example: 20
 *         totalAmount:
 *           type: number
 *           description: Total amount to charge customer (budget + service fee)
 *           example: 220
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: "USD"
 *         breakdown:
 *           type: object
 *           properties:
 *             basePercentage:
 *               type: number
 *               description: Base percentage used (e.g., 10 for 10%)
 *               example: 10
 *             calculatedFee:
 *               type: number
 *               description: Fee calculated using base percentage
 *               example: 20
 *             appliedFee:
 *               type: number
 *               description: Actual fee applied after min/max caps
 *               example: 20
 *             reason:
 *               type: string
 *               enum: [percentage_applied, minimum_fee_applied, maximum_fee_capped]
 *               description: Reason for the final fee amount
 *               example: "percentage_applied"
 *             minFeeInCurrency:
 *               type: number
 *               description: Minimum fee in the specified currency
 *               example: 5
 *             maxFeeInCurrency:
 *               type: number
 *               description: Maximum fee in the specified currency
 *               example: 50
 *
 *     ServiceFeeConfig:
 *       type: object
 *       properties:
 *         BASE_PERCENTAGE:
 *           type: number
 *           description: Base service fee percentage (0.10 for 10%)
 *           example: 0.10
 *         MIN_FEE_USD:
 *           type: number
 *           description: Minimum service fee in USD
 *           example: 5
 *         MAX_FEE_USD:
 *           type: number
 *           description: Maximum service fee in USD
 *           example: 50
 *         CURRENCY_RATES:
 *           type: object
 *           description: Exchange rates relative to USD
 *           properties:
 *             USD:
 *               type: number
 *               example: 1
 *             AUD:
 *               type: number
 *               example: 1.50
 *             EUR:
 *               type: number
 *               example: 0.85
 *         minFees:
 *           type: object
 *           description: Minimum fees in different currencies
 *         maxFees:
 *           type: object
 *           description: Maximum fees in different currencies
 *
 * tags:
 *   - name: Service Fee
 *     description: Service fee calculation and configuration
 */
