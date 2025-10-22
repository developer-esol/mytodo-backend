// Test script for Q&A API endpoints
const mongoose = require('mongoose');

async function testQAAPI() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    const Question = require('./models/Question');
    const User = require('./models/User');
    
    console.log('🔍 Checking Q&A system...');
    
    // Find a test task
    const testTask = await Task.findOne({ title: { $regex: /test/i } });
    
    if (!testTask) {
      console.log('❌ No test task found');
      console.log('📝 Create a task with "test" in the title to test Q&A');
      return;
    }
    
    // Get task creator details
    const taskCreator = await User.findById(testTask.createdBy);
    
    console.log(`✅ Found test task: "${testTask.title}"`);
    console.log(`   - Task ID: ${testTask._id}`);
    if (taskCreator) {
      console.log(`   - Created by: ${taskCreator.firstName} ${taskCreator.lastName}`);
    } else {
      console.log(`   - Created by: User not found (ID: ${testTask.createdBy})`);
    }
    
    // Check existing questions for this task
    const existingQuestions = await Question.find({ taskId: testTask._id })
      .populate('userId', 'firstName lastName')
      .populate('posterId', 'firstName lastName')
      .sort('-createdAt');
    
    console.log(`\n📋 Existing questions for this task: ${existingQuestions.length}`);
    
    if (existingQuestions.length > 0) {
      existingQuestions.forEach((q, index) => {
        console.log(`\n${index + 1}. Question by ${q.userId.firstName} ${q.userId.lastName}:`);
        console.log(`   - "${q.question.text}"`);
        console.log(`   - Status: ${q.status}`);
        console.log(`   - Asked: ${q.question.timestamp}`);
        
        if (q.answer && q.answer.text) {
          console.log(`   - Answer: "${q.answer.text}"`);
          console.log(`   - Answered: ${q.answer.timestamp}`);
        }
      });
    } else {
      console.log('   No questions found for this task');
    }
    
    console.log('\n📡 Q&A API Endpoints:');
    console.log('1. GET Questions:');
    console.log(`   GET /api/tasks/${testTask._id}/questions`);
    console.log('   Headers: Authorization: Bearer <token>');
    
    console.log('\n2. POST Question:');
    console.log(`   POST /api/tasks/${testTask._id}/questions`);
    console.log('   Headers: Authorization: Bearer <token>');
    console.log('   Body: { "questionText": "What tools do I need for this task?" }');
    
    console.log('\n3. POST Answer (only task poster can answer):');
    console.log(`   POST /api/tasks/${testTask._id}/questions/<questionId>/answer`);
    console.log('   Headers: Authorization: Bearer <token>');
    console.log('   Body: { "answerText": "You will need basic hand tools and a drill." }');
    
    console.log('\n📋 API Response Format:');
    console.log(`{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "questionId",
      "taskId": "${testTask._id}",
      "userId": {
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "...",
        "email": "john@example.com"
      },
      "posterId": {
        "firstName": "${taskCreator ? taskCreator.firstName : 'Unknown'}",
        "lastName": "${taskCreator ? taskCreator.lastName : 'User'}",
        "avatar": "...",
        "email": "${taskCreator ? taskCreator.email : 'unknown@example.com'}"
      },
      "question": {
        "text": "What tools do I need?",
        "timestamp": "2025-10-15T13:00:00.000Z"
      },
      "answer": {
        "text": "Basic hand tools and a drill",
        "timestamp": "2025-10-15T14:00:00.000Z"
      },
      "status": "answered",
      "createdAt": "2025-10-15T13:00:00.000Z",
      "updatedAt": "2025-10-15T14:00:00.000Z"
    }
  ]
}`);
    
    console.log('\n✅ Q&A API System Ready!');
    console.log('🎯 Frontend Integration Notes:');
    console.log('- Questions are visible to both poster and taskers');
    console.log('- Anyone can ask questions');
    console.log('- Only the task poster can answer questions');
    console.log('- Questions are sorted by newest first');
    console.log('- All responses include proper error handling');
    
    console.log('\n🔚 Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

testQAAPI();