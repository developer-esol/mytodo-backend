// Test the fixed receipt API behavior
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test tokens and task IDs from the error logs
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY][REDACTED_AWS_SECRET_ACCESS_KEY]eHAiOjE3NTk5MTQwOTV9.H9GdqiGwlU8BNZy-MdQdNvnOL-MbpGbBqGwOTdqPHiM';

const PROBLEM_TASKS = [
  '68c11241cf90217bcd4466e1',  // Task that was returning 400 error
  '68c1208ecf90217bcd4467f9'   // Another task with similar issue
];

async function testTaskReceipts(taskId) {
  try {
    console.log(`\n🧪 Testing receipt API for task: ${taskId}`);
    
    const response = await axios.get(`${BASE_URL}/receipts/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Success - Status: ${response.status}`);
    console.log(`📄 Response:`, {
      success: response.data.success,
      receiptsCount: response.data.data?.receipts?.length || 0,
      message: response.data.message,
      receipts: response.data.data?.receipts?.map(r => ({
        number: r.receiptNumber,
        type: r.receiptType,
        amount: r.amount
      })) || []
    });
    
    return response.data;
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ API Error - Status: ${error.response.status}`);
      console.log(`📄 Error Response:`, error.response.data);
    } else {
      console.log(`❌ Connection Error:`, error.message);
    }
    return null;
  }
}

async function testAllProblemTasks() {
  console.log('🚀 Testing receipt API fixes...\n');
  
  for (const taskId of PROBLEM_TASKS) {
    await testTaskReceipts(taskId);
  }
  
  // Test with task that has receipts
  console.log('\n🧪 Testing task with existing receipts:');
  await testTaskReceipts('68d8cc18c1ef842d1f3006c1');
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
testAllProblemTasks().catch(console.error);