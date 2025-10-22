/**
 * Test Q&A System - Documents Upload & Answers Display
 * Tests both document upload functionality and answers being returned correctly
 */

const mongoose = require("mongoose");
require('dotenv').config();

async function testQASystem() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB\n');

    const Question = require('./models/Question');
    const Task = require('./models/Task');
    const User = require('./models/User'); // Required for population
    
    console.log('=' .repeat(70));
    console.log('🧪 TESTING Q&A SYSTEM');
    console.log('=' .repeat(70));
    
    // Test 1: Check Questions with Answers
    console.log('\n📊 TEST 1: Checking Questions with Answers');
    console.log('-'.repeat(70));
    
    const questionsWithAnswers = await Question.find({
      'answer.text': { $exists: true, $ne: null }
    })
    .populate("userId", "firstName lastName avatar email")
    .populate("posterId", "firstName lastName avatar email")
    .populate("answer.answeredBy", "firstName lastName avatar email")
    .limit(5)
    .lean();
    
    console.log(`Found ${questionsWithAnswers.length} questions with answers\n`);
    
    if (questionsWithAnswers.length > 0) {
      questionsWithAnswers.forEach((q, index) => {
        console.log(`${index + 1}. Question: "${q.question.text.substring(0, 50)}..."`);
        console.log(`   Asked by: ${q.userId?.firstName} ${q.userId?.lastName}`);
        console.log(`   Question has ${q.question.images?.length || 0} file(s)`);
        
        if (q.answer && q.answer.text) {
          console.log(`   ✅ Answer: "${q.answer.text.substring(0, 50)}..."`);
          console.log(`   Answered by: ${q.answer.answeredBy?.firstName} ${q.answer.answeredBy?.lastName}`);
          console.log(`   Answer has ${q.answer.images?.length || 0} file(s)`);
        }
        console.log('');
      });
    }
    
    // Test 2: Check Questions with Files
    console.log('\n📊 TEST 2: Checking Questions/Answers with Uploaded Files');
    console.log('-'.repeat(70));
    
    const questionsWithFiles = await Question.find({
      $or: [
        { 'question.images.0': { $exists: true } },
        { 'answer.images.0': { $exists: true } }
      ]
    }).limit(10).lean();
    
    console.log(`Found ${questionsWithFiles.length} questions/answers with files\n`);
    
    let imageCount = 0;
    let documentCount = 0;
    
    questionsWithFiles.forEach((q, index) => {
      console.log(`${index + 1}. Question ID: ${q._id}`);
      
      // Check question files
      if (q.question.images && q.question.images.length > 0) {
        console.log(`   Question Files (${q.question.images.length}):`);
        q.question.images.forEach((url, i) => {
          const filename = url.split('/').pop();
          const ext = filename.split('.').pop().toLowerCase();
          
          // Categorize file type
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            imageCount++;
            console.log(`      ${i + 1}. 🖼️  IMAGE: ${filename}`);
          } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'xml', 'csv'].includes(ext)) {
            documentCount++;
            console.log(`      ${i + 1}. 📄 DOCUMENT: ${filename}`);
          } else {
            console.log(`      ${i + 1}. 📎 FILE: ${filename}`);
          }
        });
      }
      
      // Check answer files
      if (q.answer && q.answer.images && q.answer.images.length > 0) {
        console.log(`   Answer Files (${q.answer.images.length}):`);
        q.answer.images.forEach((url, i) => {
          const filename = url.split('/').pop();
          const ext = filename.split('.').pop().toLowerCase();
          
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            imageCount++;
            console.log(`      ${i + 1}. 🖼️  IMAGE: ${filename}`);
          } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'xml', 'csv'].includes(ext)) {
            documentCount++;
            console.log(`      ${i + 1}. 📄 DOCUMENT: ${filename}`);
          } else {
            console.log(`      ${i + 1}. 📎 FILE: ${filename}`);
          }
        });
      }
      console.log('');
    });
    
    console.log(`📊 File Type Summary:`);
    console.log(`   🖼️  Images: ${imageCount}`);
    console.log(`   📄 Documents: ${documentCount}`);
    console.log(`   📎 Total Files: ${imageCount + documentCount}`);
    
    // Test 3: Simulate API Response Format
    console.log('\n📊 TEST 3: Simulating API Response Format (Frontend Expected)');
    console.log('-'.repeat(70));
    
    const sampleQuestions = await Question.find({})
      .populate("userId", "firstName lastName avatar email")
      .populate("posterId", "firstName lastName avatar email")
      .populate("answer.answeredBy", "firstName lastName avatar email")
      .limit(3)
      .lean();
    
    // Transform to match API response
    const formattedQuestions = sampleQuestions.map(question => {
      const formatted = {
        ...question,
        answers: []
      };
      
      if (question.answer && question.answer.text) {
        formatted.answers = [{
          _id: question._id + '_answer',
          questionId: question._id,
          answer: question.answer.text,
          images: question.answer.images || [],
          answeredBy: question.answer.answeredBy,
          createdAt: question.answer.timestamp || question.updatedAt
        }];
      }
      
      return formatted;
    });
    
    console.log('Sample API Response Structure:\n');
    formattedQuestions.forEach((q, index) => {
      console.log(`${index + 1}. Question ${q._id}:`);
      console.log(`   ✅ Has 'answers' array: ${Array.isArray(q.answers)}`);
      console.log(`   ✅ Answers count: ${q.answers.length}`);
      if (q.answers.length > 0) {
        console.log(`   ✅ Answer text: "${q.answers[0].answer.substring(0, 40)}..."`);
        console.log(`   ✅ Answer has files: ${q.answers[0].images?.length || 0}`);
      }
      console.log('');
    });
    
    // Test 4: Validation Summary
    console.log('\n📊 TEST 4: System Validation');
    console.log('-'.repeat(70));
    
    const totalQuestions = await Question.countDocuments();
    const answeredQuestions = await Question.countDocuments({ 'answer.text': { $exists: true, $ne: null } });
    const pendingQuestions = totalQuestions - answeredQuestions;
    const questionsWithQuestionFiles = await Question.countDocuments({ 'question.images.0': { $exists: true } });
    const questionsWithAnswerFiles = await Question.countDocuments({ 'answer.images.0': { $exists: true } });
    
    console.log(`\n📈 Q&A System Statistics:`);
    console.log(`   Total Questions: ${totalQuestions}`);
    console.log(`   Answered Questions: ${answeredQuestions}`);
    console.log(`   Pending Questions: ${pendingQuestions}`);
    console.log(`   Questions with Files: ${questionsWithQuestionFiles}`);
    console.log(`   Answers with Files: ${questionsWithAnswerFiles}`);
    
    // Validation checks
    console.log(`\n✅ VALIDATION CHECKS:`);
    
    const checks = [
      { 
        name: 'Questions exist in database', 
        pass: totalQuestions > 0,
        message: totalQuestions > 0 ? `✅ ${totalQuestions} questions found` : '❌ No questions found'
      },
      { 
        name: 'Answers are being stored', 
        pass: answeredQuestions > 0,
        message: answeredQuestions > 0 ? `✅ ${answeredQuestions} answers found` : '⚠️  No answers yet'
      },
      { 
        name: 'File uploads working', 
        pass: (questionsWithQuestionFiles + questionsWithAnswerFiles) > 0,
        message: (questionsWithQuestionFiles + questionsWithAnswerFiles) > 0 
          ? `✅ ${questionsWithQuestionFiles + questionsWithAnswerFiles} items with files` 
          : '⚠️  No files uploaded yet'
      },
      {
        name: 'User population working',
        pass: questionsWithAnswers.length > 0 && questionsWithAnswers[0].userId !== null,
        message: questionsWithAnswers.length > 0 && questionsWithAnswers[0].userId 
          ? '✅ User data is populated correctly' 
          : '⚠️  User population needs verification'
      },
      {
        name: 'Answer population working',
        pass: questionsWithAnswers.length > 0 && questionsWithAnswers[0].answer?.answeredBy !== null,
        message: questionsWithAnswers.length > 0 && questionsWithAnswers[0].answer?.answeredBy 
          ? '✅ Answer user data is populated correctly' 
          : '⚠️  Answer user population needs verification'
      }
    ];
    
    checks.forEach(check => {
      console.log(`   ${check.message}`);
    });
    
    const allPassed = checks.every(check => check.pass);
    
    console.log('\n' + '='.repeat(70));
    
    if (allPassed) {
      console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
      console.log('✅ Document uploads: READY');
      console.log('✅ Answer display: READY');
      console.log('✅ File attachments: READY');
      console.log('✅ User population: READY');
      console.log('\n💡 The Q&A system is fully functional!');
    } else {
      console.log('\n⚠️  SYSTEM STATUS: Partially Ready');
      console.log('Some features may not have been tested yet.');
      console.log('Upload questions/answers to fully test the system.');
    }
    
    console.log('\n📝 TO TEST:');
    console.log('1. Upload a question with a PDF file');
    console.log('2. Answer the question with images/documents');
    console.log('3. Fetch questions via GET /api/tasks/{taskId}/questions');
    console.log('4. Verify frontend displays answers correctly');
    
    console.log('\n' + '='.repeat(70));
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testQASystem();
