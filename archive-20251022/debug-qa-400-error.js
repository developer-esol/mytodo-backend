// Debug the 400 error for Q&A API
const mongoose = require('mongoose');

async function debugQAAPI() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Question = require('./models/Question');
    const User = require('./models/User');
    
    const taskId = '68ef87b4ba585abb62176aa7';
    
    console.log(`🔍 Debugging task: ${taskId}`);
    
    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      console.log('❌ Task not found - this would cause 404, not 400');
      console.log('💡 The task ID might be invalid or deleted');
      return;
    }
    
    console.log('✅ Task found:', {
      id: task._id,
      title: task.title,
      createdBy: task.createdBy,
      status: task.status
    });
    
    // Check if task ID is valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      console.log('❌ Invalid ObjectId format - this would cause 400 error');
      return;
    }
    
    console.log('✅ Task ID is valid ObjectId format');
    
    // Check existing questions
    const questions = await Question.find({ taskId: taskId });
    console.log(`📋 Existing questions: ${questions.length}`);
    
    // Simulate the createQuestion validation
    console.log('\n🧪 Testing createQuestion validation logic:');
    
    // Test case 1: Empty questionText
    console.log('Test 1: Empty questionText');
    const emptyText = '';
    if (!emptyText || emptyText.trim().length === 0) {
      console.log('❌ Would return 400: "Question text is required"');
    }
    
    // Test case 2: Too long questionText
    console.log('Test 2: Long questionText');
    const longText = 'x'.repeat(501);
    if (longText.trim().length > 500) {
      console.log('❌ Would return 400: "Question text cannot exceed 500 characters"');
    }
    
    // Test case 3: Valid questionText
    console.log('Test 3: Valid questionText');
    const validText = 'What tools do I need for this task?';
    if (validText && validText.trim().length > 0 && validText.trim().length <= 500) {
      console.log('✅ Would pass validation');
    }
    
    console.log('\n🌐 Frontend Request Debugging:');
    console.log('❓ Common causes of 400 error:');
    console.log('1. Missing "questionText" field in request body');
    console.log('2. Empty or whitespace-only questionText');
    console.log('3. questionText longer than 500 characters');
    console.log('4. Invalid JSON in request body');
    console.log('5. Missing Content-Type: application/json header');
    console.log('6. Authentication middleware failing (but that would be 401, not 400)');
    
    console.log('\n📡 Correct API call format:');
    console.log(`POST http://localhost:5001/api/tasks/${taskId}/questions`);
    console.log('Headers:');
    console.log('  Authorization: Bearer <token>');
    console.log('  Content-Type: application/json');
    console.log('Body:');
    console.log('  { "questionText": "What tools do I need?" }');
    
    console.log('\n💡 Debugging steps:');
    console.log('1. Check frontend sends "questionText" (not "text" or "question")');
    console.log('2. Check questionText is not empty and under 500 chars');
    console.log('3. Check Content-Type header is set');
    console.log('4. Check request body is valid JSON');
    console.log('5. Add console.log in createQuestion controller to see request body');
    
    console.log('\n🔚 Debug completed');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

debugQAAPI();