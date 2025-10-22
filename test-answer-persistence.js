/**
 * Test Q&A Answer Display Fix
 * This script tests if answers and answerer details persist when fetching questions
 */

const mongoose = require("mongoose");

async function testAnswerPersistence() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const Question = require('./models/Question');
    const Task = require('./models/Task');
    const User = require('./models/User');
    
    console.log('\n🔍 Testing Q&A Answer Persistence...\n');
    
    // Find a task with questions
    const taskWithQuestions = await Task.findOne().lean();
    if (!taskWithQuestions) {
      console.log('❌ No tasks found in database');
      return;
    }
    
    console.log(`📝 Testing with task: "${taskWithQuestions.title}"`);
    console.log(`   Task ID: ${taskWithQuestions._id}`);
    
    // Find questions for this task
    const questions = await Question.find({ taskId: taskWithQuestions._id })
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email")
      .sort("-createdAt")
      .lean();
    
    console.log(`\n📊 Found ${questions.length} question(s) for this task\n`);
    
    if (questions.length === 0) {
      console.log('ℹ️  No questions found. Create some questions to test.');
      console.log('\n💡 To test:');
      console.log('1. Ask a question via API: POST /api/tasks/{taskId}/questions');
      console.log('2. Answer the question via API: POST /api/tasks/{taskId}/questions/{questionId}/answer');
      console.log('3. Run this script again');
      return;
    }
    
    // Display each question
    questions.forEach((q, index) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`QUESTION #${index + 1}`);
      console.log(`${'='.repeat(60)}`);
      
      // Question details
      console.log(`\n📝 Question:`);
      console.log(`   Text: "${q.question.text}"`);
      console.log(`   Asked: ${q.question.timestamp}`);
      console.log(`   Status: ${q.status}`);
      
      // Question asker details
      if (q.userId) {
        console.log(`\n👤 Asked by:`);
        console.log(`   Name: ${q.userId.firstName} ${q.userId.lastName}`);
        console.log(`   Email: ${q.userId.email}`);
        console.log(`   Avatar: ${q.userId.avatar || 'No avatar'}`);
      } else {
        console.log(`\n❌ Asked by: USER DATA MISSING (userId not populated)`);
      }
      
      // Task poster details
      if (q.posterId) {
        console.log(`\n📋 Task posted by:`);
        console.log(`   Name: ${q.posterId.firstName} ${q.posterId.lastName}`);
        console.log(`   Email: ${q.posterId.email}`);
      } else {
        console.log(`\n❌ Task poster: DATA MISSING (posterId not populated)`);
      }
      
      // Answer details
      if (q.answer && q.answer.text) {
        console.log(`\n✅ Answer:`);
        console.log(`   Text: "${q.answer.text}"`);
        console.log(`   Answered: ${q.answer.timestamp}`);
        
        // THIS IS THE KEY TEST - Check if answeredBy is populated
        if (q.answer.answeredBy) {
          console.log(`\n💚 Answered by: (POPULATED ✓)`);
          console.log(`   Name: ${q.answer.answeredBy.firstName} ${q.answer.answeredBy.lastName}`);
          console.log(`   Email: ${q.answer.answeredBy.email}`);
          console.log(`   Avatar: ${q.answer.answeredBy.avatar || 'No avatar'}`);
          console.log(`\n   ✅ FIX VERIFIED: answeredBy field is properly populated!`);
        } else {
          console.log(`\n❌ Answered by: NOT POPULATED - THIS IS THE BUG!`);
          console.log(`   This would show as "Anonymous User" in frontend`);
        }
      } else {
        console.log(`\n⏳ Answer: Not answered yet (status: ${q.status})`);
      }
    });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total questions: ${questions.length}`);
    console.log(`   Answered: ${questions.filter(q => q.status === 'answered').length}`);
    console.log(`   Pending: ${questions.filter(q => q.status === 'pending').length}`);
    
    const answeredWithPopulatedUser = questions.filter(q => 
      q.status === 'answered' && q.answer?.answeredBy
    ).length;
    const answeredWithMissingUser = questions.filter(q => 
      q.status === 'answered' && !q.answer?.answeredBy
    ).length;
    
    console.log(`\n   Answered with user details: ${answeredWithPopulatedUser}`);
    console.log(`   Answered WITHOUT user details: ${answeredWithMissingUser}`);
    
    if (answeredWithMissingUser > 0) {
      console.log(`\n❌ WARNING: ${answeredWithMissingUser} answer(s) missing user details!`);
      console.log(`   These were answered before the answeredBy field was added.`);
      console.log(`   They will show as "Anonymous User" in the frontend.`);
      console.log(`\n💡 Solution: Delete these old answers and re-answer the questions.`);
    } else if (answeredWithPopulatedUser > 0) {
      console.log(`\n✅ ALL ANSWERS HAVE USER DETAILS! Fix is working correctly.`);
    }
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testAnswerPersistence();
