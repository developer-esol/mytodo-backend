/**
 * Find tasks with Q&A data
 */

const mongoose = require("mongoose");

async function findTasksWithQuestions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB');

    const Question = require('./models/Question');
    const Task = require('./models/Task');
    
    // Find all questions
    const allQuestions = await Question.find().lean();
    console.log(`\n📊 Total questions in database: ${allQuestions.length}`);
    
    if (allQuestions.length === 0) {
      console.log('\n❌ No questions found in database');
      console.log('💡 Test the Q&A system by:');
      console.log('   1. Creating a task');
      console.log('   2. Asking a question on that task');
      console.log('   3. Answering the question');
      return;
    }
    
    // Group by task
    const questionsByTask = {};
    allQuestions.forEach(q => {
      const taskId = q.taskId.toString();
      if (!questionsByTask[taskId]) {
        questionsByTask[taskId] = [];
      }
      questionsByTask[taskId].push(q);
    });
    
    console.log(`📋 Questions found across ${Object.keys(questionsByTask).length} task(s)\n`);
    
    // Show details for each task
    for (const taskId in questionsByTask) {
      const task = await Task.findById(taskId).lean();
      const questions = questionsByTask[taskId];
      const answeredCount = questions.filter(q => q.status === 'answered').length;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Task: ${task ? task.title : 'Task not found'}`);
      console.log(`Task ID: ${taskId}`);
      console.log(`Questions: ${questions.length} (${answeredCount} answered, ${questions.length - answeredCount} pending)`);
      
      questions.forEach((q, i) => {
        console.log(`\n  ${i + 1}. "${q.question.text.substring(0, 50)}${q.question.text.length > 50 ? '...' : ''}"`);
        console.log(`     Status: ${q.status}`);
        if (q.answer && q.answer.text) {
          console.log(`     Answer: "${q.answer.text.substring(0, 50)}${q.answer.text.length > 50 ? '...' : ''}"`);
          console.log(`     AnsweredBy: ${q.answer.answeredBy ? q.answer.answeredBy.toString() : 'NOT SET (OLD DATA)'}`);
        }
      });
    }
    
    console.log(`\n${'='.repeat(60)}\n`);
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

findTasksWithQuestions();
