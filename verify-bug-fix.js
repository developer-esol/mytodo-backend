/**
 * FINAL VERIFICATION - Demonstrates the bug fix
 * This simulates what happens when a user navigates back to a task page
 */

const mongoose = require("mongoose");

async function simulateUserFlow() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB\n');

    const Question = require('./models/Question');
    const User = require('./models/User');
    
    console.log('🎬 SIMULATING USER FLOW - Bug Fix Demonstration\n');
    console.log('='.repeat(70));
    
    // SCENARIO: User navigates back to task page
    console.log('\n📱 USER ACTION: Opens task details page (after previously viewing it)');
    console.log('🔧 BACKEND: Calls GET /api/tasks/{taskId}/questions');
    console.log('⚙️  EXECUTING: Question.find().populate()...\n');
    
    // This is exactly what the API does when fetching questions
    const taskId = '68ef87b4ba585abb62176aa7'; // Task with answered questions
    const questions = await Question.find({taskId: taskId})
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email") // THE FIX
      .sort("-createdAt")
      .lean();
    
    console.log(`📊 Query Result: Found ${questions.length} questions\n`);
    console.log('='.repeat(70));
    
    // Display what the frontend receives
    questions.forEach((q, i) => {
      if (q.status === 'answered') {
        console.log(`\n📝 QUESTION #${i + 1}: "${q.question.text}"`);
        console.log('-'.repeat(70));
        
        // This is what frontend sees
        const questionAskerName = q.userId 
          ? `${q.userId.firstName} ${q.userId.lastName}`
          : 'Anonymous User';
          
        const answererName = q.answer?.answeredBy
          ? `${q.answer.answeredBy.firstName} ${q.answer.answeredBy.lastName}`
          : 'Anonymous User';
        
        console.log(`👤 Asked by: ${questionAskerName}`);
        console.log(`💬 Answer: "${q.answer.text}"`);
        console.log(`✍️  Answered by: ${answererName}`);
        
        // Verification
        if (q.answer.answeredBy) {
          console.log(`\n✅ SUCCESS: Answerer details are present!`);
          console.log(`   - ID: ${q.answer.answeredBy._id}`);
          console.log(`   - Name: ${q.answer.answeredBy.firstName} ${q.answer.answeredBy.lastName}`);
          console.log(`   - Email: ${q.answer.answeredBy.email}`);
          console.log(`\n🎉 Frontend will display: "${answererName}" (NOT "Anonymous User")`);
        } else {
          console.log(`\n❌ BUG: Answerer details are MISSING!`);
          console.log(`   Frontend will display: "Anonymous User"`);
        }
      }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📈 FINAL VERIFICATION:');
    
    const answeredQuestions = questions.filter(q => q.status === 'answered');
    const questionsWithAnswererData = answeredQuestions.filter(q => q.answer?.answeredBy);
    
    console.log(`   Total answered questions: ${answeredQuestions.length}`);
    console.log(`   Questions with answerer data: ${questionsWithAnswererData.length}`);
    
    if (questionsWithAnswererData.length === answeredQuestions.length && answeredQuestions.length > 0) {
      console.log(`\n✅ ✅ ✅ BUG FIX VERIFIED!`);
      console.log(`   ALL answered questions have answerer details.`);
      console.log(`   User names will persist after page navigation.`);
      console.log(`   "Anonymous User" bug is FIXED! 🎉`);
    } else {
      console.log(`\n⚠️  Some questions are missing answerer data.`);
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

simulateUserFlow();
