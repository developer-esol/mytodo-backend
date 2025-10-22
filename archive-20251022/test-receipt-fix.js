// Test script for the enhanced receipt generation fix
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const TEST_TASK_ID = '68d8cc18c1ef842d1f3006c1'; // Task that has receipts

// Test token from the logs
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]eHAiOjE3NTk5MTQwOTV9.H9GdqiGwlU8BNZy-MdQdNvnOL-MbpGbBqGwOTdqPHiM';

async function testReceiptGeneration() {
  try {
    console.log('🔍 Testing receipt generation for task:', TEST_TASK_ID);
    
    // Test the enhanced getTaskReceipts endpoint
    const response = await axios.get(`${BASE_URL}/receipts/task/${TEST_TASK_ID}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Receipt API Response:', {
      status: response.status,
      data: response.data
    });
    
    if (response.data.receipts && response.data.receipts.length > 0) {
      console.log('📋 Found receipts:', response.data.receipts.map(r => ({
        id: r._id,
        number: r.receiptNumber,
        type: r.receiptType,
        amount: r.amount.total
      })));
    } else {
      console.log('⚠️ No receipts found in response');
    }
    
  } catch (error) {
    console.log('❌ Error testing receipt generation:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      code: error.code,
      fullError: error.toString()
    });
    
    // If it's a 404, the enhanced API should now try to generate receipts automatically
    if (error.response?.status === 404) {
      console.log('🔄 API returned 404, this should trigger automatic receipt generation...');
    }
  }
}

// Also test checking task details to see if it's properly completed
async function checkTaskDetails() {
  try {
    console.log('🔍 Checking task details for:', TEST_TASK_ID);
    
    const response = await axios.get(`${BASE_URL}/tasks/${TEST_TASK_ID}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Task Details:', {
      id: response.data._id,
      status: response.data.status,
      budget: response.data.budget,
      currency: response.data.currency,
      acceptedOffer: response.data.acceptedOffer ? 'Yes' : 'No'
    });
    
  } catch (error) {
    console.log('❌ Error fetching task details:', {
      message: error.response?.data?.message || error.message,
      code: error.code,
      fullError: error.toString()
    });
  }
}

async function runTests() {
  console.log('🚀 Starting receipt generation tests...\n');
  
  await checkTaskDetails();
  console.log(''); // Add spacing
  
  await testReceiptGeneration();
  console.log('\n✅ Test completed');
}

// Run the tests
runTests().catch(console.error);