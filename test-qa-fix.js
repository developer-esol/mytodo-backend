/**
 * Test specific task Q&A to verify fix
 */

const mongoose = require("mongoose");

async function testSpecificTask() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const Question = require('./models/Question');
    const User = require('./models/User'); // Need this for population
    
    // Test with task "test 678" which has answered questions
    const taskId = '68ef87b4ba585abb62176aa7';
    
    console.log(`\n🧪 Testing Q&A for task: ${taskId}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Simulate the API call - this is exactly what getTaskQuestions does
    const questions = await Question.find({taskId: taskId})
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email")
      .sort("-createdAt")
      .lean();
    
    console.log(`📊 Found ${questions.length} questions\n`);
    
    questions.forEach((q, index) => {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`QUESTION #${index + 1}`);
      console.log(`${'─'.repeat(60)}`);
      
      console.log(`\n📝 Question: "${q.question.text}"`);
      console.log(`   Status: ${q.status}`);
      console.log(`   Asked: ${q.question.timestamp}`);
      
      // Check userId population
      if (q.userId) {
        console.log(`\n👤 Asked by: ${q.userId.firstName} ${q.userId.lastName}`);
      } else {
        console.log(`\n❌ Asked by: NOT POPULATED`);
      }
      
      // Check if answered
      if (q.answer && q.answer.text) {
        console.log(`\n💬 Answer: "${q.answer.text}"`);
        console.log(`   Answered at: ${q.answer.timestamp}`);
        
        // THIS IS THE CRITICAL CHECK
        if (q.answer.answeredBy) {
          console.log(`\n✅ Answered by: ${q.answer.answeredBy.firstName} ${q.answer.answeredBy.lastName}`);
          console.log(`   Email: ${q.answer.answeredBy.email}`);
          console.log(`\n   🎉 SUCCESS! User details are populated correctly!`);
          console.log(`   The frontend will now show the correct user name instead of "Anonymous User"`);
        } else {
          console.log(`\n❌ Answered by: NOT POPULATED`);
          console.log(`   This will show as "Anonymous User" in the frontend`);
          console.log(`   THE BUG STILL EXISTS!`);
        }
      } else {
        console.log(`\n⏳ No answer yet (pending)`);
      }
    });
    
    console.log(`\n${'='.repeat(60)}`);
    
    // Summary
    const answeredQuestions = questions.filter(q => q.status === 'answered');
    const populatedAnswers = answeredQuestions.filter(q => q.answer?.answeredBy);
    
    console.log(`\n📈 RESULTS:`);
    console.log(`   Total questions: ${questions.length}`);
    console.log(`   Answered: ${answeredQuestions.length}`);
    console.log(`   Answers with user details: ${populatedAnswers.length}`);
    console.log(`   Missing user details: ${answeredQuestions.length - populatedAnswers.length}`);
    
    if (populatedAnswers.length === answeredQuestions.length && answeredQuestions.length > 0) {
      console.log(`\n✅ ✅ ✅ FIX VERIFIED! All answers have user details!`);
      console.log(`The bug is fixed - navigating away and back will now preserve user names.`);
    } else if (answeredQuestions.length > 0) {
      console.log(`\n⚠️  Some answers are missing user details.`);
      console.log(`This is likely because they were created before the answeredBy field was added.`);
    }
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testSpecificTask();
