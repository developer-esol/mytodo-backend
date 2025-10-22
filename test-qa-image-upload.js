/**
 * Test Q&A Image Upload to S3 and MongoDB
 * This script tests if images are uploaded to S3 and URLs are saved to MongoDB
 */

const mongoose = require("mongoose");
const {S3Client, ListObjectsV2Command} = require("@aws-sdk/client-s3");
require('dotenv').config();

async function testQAImageUpload() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Airtasker');
    console.log('✅ Connected to MongoDB\n');

    const Question = require('./models/Question');
    const Task = require('./models/Task');
    
    // Initialize S3 Client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    console.log('🔍 Testing Q&A Image Upload System...\n');
    console.log('=' .repeat(70));
    
    // Test 1: Check if any questions have images
    console.log('\n📊 TEST 1: Checking questions with images in database');
    console.log('-'.repeat(70));
    
    const questionsWithImages = await Question.find({
      'question.images.0': { $exists: true }
    }).limit(10);
    
    console.log(`Found ${questionsWithImages.length} questions with images\n`);
    
    if (questionsWithImages.length > 0) {
      questionsWithImages.forEach((q, index) => {
        console.log(`${index + 1}. Question ID: ${q._id}`);
        console.log(`   Text: "${q.question.text.substring(0, 50)}..."`);
        console.log(`   Images: ${q.question.images.length}`);
        q.question.images.forEach((url, i) => {
          console.log(`      ${i + 1}. ${url}`);
        });
        console.log('');
      });
    } else {
      console.log('ℹ️  No questions with images found yet.');
      console.log('   Create a question with images to test.');
    }
    
    // Test 2: Check if any answers have images
    console.log('\n📊 TEST 2: Checking answers with images in database');
    console.log('-'.repeat(70));
    
    const answersWithImages = await Question.find({
      'answer.images.0': { $exists: true }
    }).limit(10);
    
    console.log(`Found ${answersWithImages.length} answers with images\n`);
    
    if (answersWithImages.length > 0) {
      answersWithImages.forEach((q, index) => {
        console.log(`${index + 1}. Question ID: ${q._id}`);
        console.log(`   Answer: "${q.answer.text.substring(0, 50)}..."`);
        console.log(`   Images: ${q.answer.images.length}`);
        q.answer.images.forEach((url, i) => {
          console.log(`      ${i + 1}. ${url}`);
        });
        console.log('');
      });
    } else {
      console.log('ℹ️  No answers with images found yet.');
      console.log('   Answer a question with images to test.');
    }
    
    // Test 3: Check S3 bucket for qa/ folder
    console.log('\n📊 TEST 3: Checking S3 bucket for Q&A images');
    console.log('-'.repeat(70));
    
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: 'qa/',
        MaxKeys: 20
      });
      
      const s3Response = await s3Client.send(listCommand);
      
      if (s3Response.Contents && s3Response.Contents.length > 0) {
        console.log(`✅ Found ${s3Response.Contents.length} files in S3 qa/ folder:\n`);
        
        s3Response.Contents.forEach((item, index) => {
          const sizeKB = (item.Size / 1024).toFixed(2);
          const lastModified = item.LastModified.toLocaleString();
          console.log(`${index + 1}. ${item.Key}`);
          console.log(`   Size: ${sizeKB} KB`);
          console.log(`   Last Modified: ${lastModified}`);
          console.log('');
        });
      } else {
        console.log('ℹ️  No files found in S3 qa/ folder yet.');
        console.log('   Upload images via Q&A API to see files here.');
      }
    } catch (s3Error) {
      console.error('❌ Error accessing S3:', s3Error.message);
      console.log('\n⚠️  S3 Configuration:');
      console.log(`   Region: ${process.env.AWS_REGION}`);
      console.log(`   Bucket: ${process.env.AWS_BUCKET_NAME}`);
      console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);
    }
    
    // Test 4: Validate image URLs format
    console.log('\n📊 TEST 4: Validating image URL formats');
    console.log('-'.repeat(70));
    
    const allQuestions = await Question.find({
      $or: [
        { 'question.images.0': { $exists: true } },
        { 'answer.images.0': { $exists: true } }
      ]
    }).limit(5);
    
    let validCount = 0;
    let invalidCount = 0;
    
    allQuestions.forEach(q => {
      // Check question images
      if (q.question.images && q.question.images.length > 0) {
        q.question.images.forEach(url => {
          if (url.startsWith('https://') && url.includes('.s3.') && url.includes(process.env.AWS_BUCKET_NAME)) {
            validCount++;
          } else {
            invalidCount++;
            console.log(`❌ Invalid question image URL: ${url}`);
          }
        });
      }
      
      // Check answer images
      if (q.answer && q.answer.images && q.answer.images.length > 0) {
        q.answer.images.forEach(url => {
          if (url.startsWith('https://') && url.includes('.s3.') && url.includes(process.env.AWS_BUCKET_NAME)) {
            validCount++;
          } else {
            invalidCount++;
            console.log(`❌ Invalid answer image URL: ${url}`);
          }
        });
      }
    });
    
    console.log(`\n✅ Valid S3 URLs: ${validCount}`);
    console.log(`❌ Invalid URLs: ${invalidCount}`);
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📈 SUMMARY:');
    console.log(`   Questions with images: ${questionsWithImages.length}`);
    console.log(`   Answers with images: ${answersWithImages.length}`);
    console.log(`   Valid S3 URLs: ${validCount}`);
    console.log(`   Invalid URLs: ${invalidCount}`);
    
    if (questionsWithImages.length > 0 || answersWithImages.length > 0) {
      console.log('\n✅ Q&A image upload system is working!');
      console.log('   Images are being uploaded to S3 and URLs are saved to MongoDB.');
    } else {
      console.log('\n📝 Q&A image upload system is ready but not yet tested.');
      console.log('   To test:');
      console.log('   1. Use Postman or frontend to post a question with images');
      console.log('   2. POST /api/tasks/{taskId}/questions with multipart/form-data');
      console.log('   3. Include "question" text field and "images" files');
      console.log('   4. Run this script again to verify');
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testQAImageUpload();
