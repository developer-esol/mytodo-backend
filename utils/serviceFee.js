// utils/serviceFee.js
const logger = require("../config/logger");

/**
 * Service Fee Configuration
 * These values should be configurable from admin dashboard
 */
const SERVICE_FEE_CONFIG = {
  // Base service fee percentage (10%)
  BASE_PERCENTAGE: 0.1,

  // Minimum service fee in USD (will be converted for other currencies)
  MIN_FEE_USD: 5,

  // Maximum service fee in USD (will be converted for other currencies)
  MAX_FEE_USD: 50,

  // Currency conversion rates (should be updated regularly or fetched from API)
  CURRENCY_RATES: {
    USD: 1,
    AUD: 1.5, // 1 USD = 1.50 AUD (approximate)
    LKR: 325, // 1 USD = 325 LKR (approximate)
    EUR: 0.85, // 1 USD = 0.85 EUR (approximate)
    GBP: 0.75, // 1 USD = 0.75 GBP (approximate)
  },
};

/**
 * Calculate service fee based on the budget amount and currency
 * @param {number} budgetAmount - The customer's budget amount
 * @param {string} currency - Currency code (USD, AUD, etc.)
 * @returns {Object} - Contains serviceFee, totalAmount, breakdown
 */
const calculateServiceFee = (budgetAmount, currency = "USD") => {
  try {
    if (!budgetAmount || isNaN(budgetAmount) || budgetAmount <= 0) {
      throw new Error("Invalid budget amount");
    }

    const currencyUpper = currency.toUpperCase();
    const exchangeRate = SERVICE_FEE_CONFIG.CURRENCY_RATES[currencyUpper] || 1;

    // Convert min/max fees to the target currency
    const minFeeInCurrency = SERVICE_FEE_CONFIG.MIN_FEE_USD * exchangeRate;
    const maxFeeInCurrency = SERVICE_FEE_CONFIG.MAX_FEE_USD * exchangeRate;

    // Calculate base service fee (10% of budget)
    // Calculate base service fee (10% of budget)
    const baseFee = budgetAmount * SERVICE_FEE_CONFIG.BASE_PERCENTAGE;

    // Apply min/max caps
    let serviceFee;
    let reason;

    // Service fee is taken from the original budget, not added on top
    if (baseFee < minFeeInCurrency) {
      serviceFee = minFeeInCurrency;
      reason = "Minimum service fee applied";
    } else if (baseFee > maxFeeInCurrency) {
      serviceFee = maxFeeInCurrency;
      reason = "Maximum service fee applied";
    } else {
      serviceFee = baseFee;
      reason = "Standard 10% service fee";
    }

    if (baseFee < minFeeInCurrency) {
      serviceFee = minFeeInCurrency;
      reason = "minimum_fee_applied";
    } else if (baseFee > maxFeeInCurrency) {
      serviceFee = maxFeeInCurrency;
      reason = "maximum_fee_capped";
    } else {
      serviceFee = baseFee;
      reason = "percentage_applied";
    }

    // Round to 2 decimal places
    serviceFee = Math.round(serviceFee * 100) / 100;
    const totalAmount = budgetAmount + serviceFee;

    return {
      budgetAmount: budgetAmount,
      serviceFee: serviceFee,
      totalAmount: totalAmount,
      currency: currencyUpper,
      breakdown: {
        basePercentage: SERVICE_FEE_CONFIG.BASE_PERCENTAGE * 100, // 10
        calculatedFee: Math.round(baseFee * 100) / 100,
        appliedFee: serviceFee,
        reason: reason,
        minFeeInCurrency: Math.round(minFeeInCurrency * 100) / 100,
        maxFeeInCurrency: Math.round(maxFeeInCurrency * 100) / 100,
      },
    };
  } catch (error) {
    logger.error("Service fee calculation failed", {
      file: "utils/serviceFee.js",
      function: "calculateServiceFee",
      error: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to calculate service fee: " + error.message);
  }
};

/**
 * Get service fee configuration (for admin dashboard)
 */
const getServiceFeeConfig = () => {
  return {
    ...SERVICE_FEE_CONFIG,
    // Add calculated values for different currencies
    minFees: Object.keys(SERVICE_FEE_CONFIG.CURRENCY_RATES).reduce(
      (acc, currency) => {
        acc[currency] =
          SERVICE_FEE_CONFIG.MIN_FEE_USD *
          SERVICE_FEE_CONFIG.CURRENCY_RATES[currency];
        return acc;
      },
      {}
    ),
    maxFees: Object.keys(SERVICE_FEE_CONFIG.CURRENCY_RATES).reduce(
      (acc, currency) => {
        acc[currency] =
          SERVICE_FEE_CONFIG.MAX_FEE_USD *
          SERVICE_FEE_CONFIG.CURRENCY_RATES[currency];
        return acc;
      },
      {}
    ),
  };
};

/**
 * Update service fee configuration (for admin dashboard)
 * @param {Object} newConfig - New configuration values
 */
const updateServiceFeeConfig = (newConfig) => {
  if (newConfig.BASE_PERCENTAGE !== undefined) {
    SERVICE_FEE_CONFIG.BASE_PERCENTAGE = newConfig.BASE_PERCENTAGE;
  }
  if (newConfig.MIN_FEE_USD !== undefined) {
    SERVICE_FEE_CONFIG.MIN_FEE_USD = newConfig.MIN_FEE_USD;
  }
  if (newConfig.MAX_FEE_USD !== undefined) {
    SERVICE_FEE_CONFIG.MAX_FEE_USD = newConfig.MAX_FEE_USD;
  }
  if (newConfig.CURRENCY_RATES !== undefined) {
    SERVICE_FEE_CONFIG.CURRENCY_RATES = {
      ...SERVICE_FEE_CONFIG.CURRENCY_RATES,
      ...newConfig.CURRENCY_RATES,
    };
  }

  logger.info("Service fee configuration updated", {
    file: "utils/serviceFee.js",
    function: "updateServiceFeeConfig",
    newConfig: SERVICE_FEE_CONFIG,
  });
  return SERVICE_FEE_CONFIG;
};

/**
 * Validate service fee calculation with examples
 */
const validateServiceFeeCalculation = () => {
  logger.info("=== Service Fee Calculation Examples ===", {
    file: "utils/serviceFee.js",
    function: "validateServiceFeeCalculation",
  });

  // Test cases
  const testCases = [
    { amount: 30, currency: "USD", expected: { fee: 5, reason: "minimum" } },
    {
      amount: 200,
      currency: "USD",
      expected: { fee: 20, reason: "percentage" },
    },
    { amount: 600, currency: "USD", expected: { fee: 50, reason: "maximum" } },
    { amount: 20, currency: "AUD", expected: { fee: 7.5, reason: "minimum" } }, // 5 USD = 7.5 AUD
    {
      amount: 300,
      currency: "AUD",
      expected: { fee: 30, reason: "percentage" },
    },
    { amount: 1000, currency: "AUD", expected: { fee: 75, reason: "maximum" } }, // 50 USD = 75 AUD
  ];

  const results = [];
  testCases.forEach((testCase, index) => {
    try {
      const result = calculateServiceFee(testCase.amount, testCase.currency);
      const testResult = {
        testCase: index + 1,
        amount: testCase.amount,
        currency: testCase.currency,
        serviceFee: result.serviceFee,
        totalAmount: result.totalAmount,
        reason: result.breakdown.reason,
        breakdown: result.breakdown,
      };
      results.push(testResult);

      logger.info(`Test Case ${index + 1}`, {
        file: "utils/serviceFee.js",
        function: "validateServiceFeeCalculation",
        ...testResult,
      });
    } catch (error) {
      logger.error(`Test Case ${index + 1} failed`, {
        file: "utils/serviceFee.js",
        function: "validateServiceFeeCalculation",
        error: error.message,
        testCase,
      });
    }
  });

  return results;
};

module.exports = {
  calculateServiceFee,
  getServiceFeeConfig,
  updateServiceFeeConfig,
  validateServiceFeeCalculation,
  SERVICE_FEE_CONFIG,
};
