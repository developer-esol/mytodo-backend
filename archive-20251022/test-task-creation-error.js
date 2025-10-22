// Test task creation to see the exact error
const axios = require('axios');

const testTaskCreation = async () => {
  console.log('🧪 Testing Task Creation\n');
  console.log('='.repeat(80));
  
  // Simulate a typical task creation request from the frontend
  const taskData = {
    title: "Test Online Task",
    category: "Graphic Design", // Single category
    dateType: "DoneBy",
    date: "2025-11-15",
    time: "Anytime",
    locationType: "Online", // This is required!
    details: "Need a logo design",
    budget: "500",
    currency: "AUD"
    // No location field - should be optional for Online tasks
  };

  console.log('Test 1: Creating Online task without location (should work)');
  console.log('Request data:', JSON.stringify(taskData, null, 2));
  
  try {
    const response = await axios.post('http://localhost:5001/api/tasks', taskData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with real token
      }
    });
    
    console.log('\n✅ Success!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('\n❌ Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  
  // Test 2: In-person task without location (should fail)
  const inPersonTaskData = {
    title: "Test In-person Task",
    category: "Plumbing",
    dateType: "DoneBy",
    date: "2025-11-15",
    time: "Morning",
    locationType: "In-person",
    details: "Fix leaking pipe",
    budget: "200",
    currency: "AUD"
    // Missing location - should fail
  };

  console.log('\nTest 2: Creating In-person task without location (should fail)');
  console.log('Request data:', JSON.stringify(inPersonTaskData, null, 2));
  
  try {
    const response = await axios.post('http://localhost:5001/api/tasks', inPersonTaskData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    console.log('\n✅ Success (unexpected!)');
  } catch (error) {
    console.log('\n❌ Expected Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n' + '='.repeat(80));
  
  // Test 3: Task without locationType (should fail)
  const noLocationTypeTaskData = {
    title: "Test Task",
    category: "Education and Tutoring",
    dateType: "DoneBy",
    date: "2025-11-15",
    time: "Afternoon",
    location: "Melbourne",
    details: "Need math tutoring",
    budget: "100",
    currency: "AUD"
    // Missing locationType - should fail
  };

  console.log('\nTest 3: Creating task without locationType (should fail)');
  console.log('Request data:', JSON.stringify(noLocationTypeTaskData, null, 2));
  
  try {
    const response = await axios.post('http://localhost:5001/api/tasks', noLocationTypeTaskData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    console.log('\n✅ Success (unexpected!)');
  } catch (error) {
    console.log('\n❌ Expected Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

console.log('⚠️  NOTE: You need to replace YOUR_TOKEN_HERE with a real auth token');
console.log('⚠️  OR test this directly from the frontend\n');

testTaskCreation();
