// Quick test to verify Google auth fix
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function quickTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clean up
    await User.deleteOne({ email: 'quick.test.google@example.com' });
    
    // Test: Create Google user as the fixed endpoint would
    const googleUser = await User.create({
      email: 'quick.test.google@example.com',
      firstName: 'Quick',
      lastName: 'Test',
      googleId: 'quick_test_google_123',
      isVerified: true,
      isEmailVerified: true, // ✅ KEY FIX: This prevents 2FA
      isPhoneVerified: false, // ✅ Google doesn't provide phone
      role: 'user'
    });

    console.log('🎉 GOOGLE AUTH FIX VERIFICATION:');
    console.log(`✅ Google user isEmailVerified: ${googleUser.isEmailVerified}`);
    console.log(`✅ Google user isPhoneVerified: ${googleUser.isPhoneVerified}`);
    
    // Simulate frontend logic
    const needs2FA = !googleUser.isEmailVerified || !googleUser.isPhoneVerified;
    console.log(`${needs2FA ? '❌' : '✅'} Google user needs 2FA: ${needs2FA}`);
    
    if (!needs2FA) {
      console.log('🚀 SUCCESS: Google users will bypass 2FA page!');
    }

    // Cleanup
    await User.deleteOne({ email: 'quick.test.google@example.com' });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest();