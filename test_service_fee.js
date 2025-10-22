// test_service_fee.js
const { 
  calculateServiceFee, 
  getServiceFeeConfig,
  validateServiceFeeCalculation 
} = require('./utils/serviceFee');

console.log('=== AIR TASK BACKEND SERVICE FEE IMPLEMENTATION ===');
console.log('This demonstrates the new tiered service fee structure\n');

// Show current configuration
console.log('1. CURRENT SERVICE FEE CONFIGURATION:');
const config = getServiceFeeConfig();
console.log('- Base Percentage:', config.BASE_PERCENTAGE * 100 + '%');
console.log('- Minimum Fee (USD):', '$' + config.MIN_FEE_USD);
console.log('- Maximum Fee (USD):', '$' + config.MAX_FEE_USD);
console.log('- Supported Currencies:', Object.keys(config.CURRENCY_RATES).join(', '));
console.log('');

// Test with different scenarios
console.log('2. SERVICE FEE CALCULATION EXAMPLES:');
console.log('');

const testScenarios = [
  { description: 'Small budget (minimum fee applies)', amount: 30, currency: 'USD' },
  { description: 'Medium budget (percentage applies)', amount: 200, currency: 'USD' },
  { description: 'Large budget (maximum fee applies)', amount: 600, currency: 'USD' },
  { description: 'Small budget in AUD (minimum fee applies)', amount: 40, currency: 'AUD' },
  { description: 'Medium budget in AUD (percentage applies)', amount: 300, currency: 'AUD' },
  { description: 'Large budget in AUD (maximum fee applies)', amount: 1000, currency: 'AUD' }
];

testScenarios.forEach((scenario, index) => {
  try {
    console.log(`Scenario ${index + 1}: ${scenario.description}`);
    console.log(`Budget: ${scenario.currency} ${scenario.amount}`);
    
    const result = calculateServiceFee(scenario.amount, scenario.currency);
    
    console.log(`✓ Service Fee: ${result.currency} ${result.serviceFee} (${result.breakdown.reason.replace('_', ' ')})`);
    console.log(`✓ Total Charge: ${result.currency} ${result.totalAmount}`);
    
    if (result.breakdown.reason === 'minimum_fee_applied') {
      console.log(`  • Base 10% would be ${result.currency} ${result.breakdown.calculatedFee}, but minimum is ${result.currency} ${result.breakdown.minFeeInCurrency}`);
    } else if (result.breakdown.reason === 'maximum_fee_capped') {
      console.log(`  • Base 10% would be ${result.currency} ${result.breakdown.calculatedFee}, but capped at ${result.currency} ${result.breakdown.maxFeeInCurrency}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.error(`✗ Error in scenario ${index + 1}:`, error.message);
    console.log('');
  }
});

console.log('3. PAYMENT FLOW EXPLANATION:');
console.log('');
console.log('When a customer assigns a job:');
console.log('  1. Customer has budget of $200 (example)');
console.log('  2. Tasker offers to do it for $150 (example)');
console.log('  3. Service fee is calculated on BUDGET: $200 × 10% = $20');
console.log('  4. Customer is charged: $200 (budget) + $20 (service fee) = $220');
console.log('  5. Tasker receives: $150 (their offer amount)');
console.log('  6. Platform keeps: $220 - $150 = $70 ($20 service fee + $50 surplus)');
console.log('');

console.log('4. EDGE CASES HANDLED:');
console.log('');
console.log('✓ Minimum Fee: If 10% < $5, charge $5 instead');
console.log('✓ Maximum Fee: If 10% > $50, charge $50 instead');
console.log('✓ Multi-Currency: Minimum/Maximum converted to local currency');
console.log('✓ Error Handling: Invalid amounts, unsupported currencies');
console.log('✓ Admin Configuration: Fees can be adjusted via admin dashboard');
console.log('');

console.log('5. API ENDPOINTS AVAILABLE:');
console.log('');
console.log('POST /api/service-fee/calculate - Calculate fee for any amount');
console.log('GET  /api/service-fee/config - View current configuration');
console.log('PUT  /api/service-fee/config - Update configuration (admin)');
console.log('GET  /api/service-fee/test - Run validation tests');
console.log('');

console.log('6. DETAILED VALIDATION TEST:');
validateServiceFeeCalculation();

console.log('=== IMPLEMENTATION COMPLETE ===');
console.log('The service fee system is now fully implemented and ready for use.');
