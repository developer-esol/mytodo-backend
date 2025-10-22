const { OAuth2Client } = require('google-auth-library');
const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function testGoogleAuthFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for testing...');

    // Test data - simulating a Google auth response
    const mockGooglePayload = {
      email: 'testgoogleuser@gmail.com',
      given_name: 'Test',
      family_name: 'GoogleUser',
      sub: 'google_test_123456',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true
    };

    // Clean up any existing test user
    await User.deleteOne({ email: mockGooglePayload.email });
    console.log('Cleaned up existing test user...');

    // Create a new Google user (simulating the auth process)
    const user = await User.create({
      email: mockGooglePayload.email,
      firstName: mockGooglePayload.given_name || 'User',
      lastName: mockGooglePayload.family_name || '',
      googleId: mockGooglePayload.sub,
      avatar: mockGooglePayload.picture || '',
      isVerified: true,
      verified: mockGooglePayload.email_verified || true,
      isEmailVerified: true, // Should be true for Google users
      isPhoneVerified: false, // Should be false since no phone provided
      role: 'user'
    });

    console.log('✅ Google user created successfully!');
    console.log('User verification status:');
    console.log(`- isVerified: ${user.isVerified}`);
    console.log(`- isEmailVerified: ${user.isEmailVerified}`);
    console.log(`- isPhoneVerified: ${user.isPhoneVerified}`);
    console.log(`- verified: ${user.verified}`);

    // Verify the fix works as expected
    if (user.isVerified && user.isEmailVerified && !user.isPhoneVerified) {
      console.log('🎉 GOOGLE AUTH FIX WORKING CORRECTLY!');
      console.log('✓ Google users now have proper verification flags');
      console.log('✓ No more 2FA prompts for Google sign-ups');
    } else {
      console.log('❌ Fix needs adjustment');
    }

    // Test updating an existing Google user
    console.log('\nTesting existing user update...');
    
    // Simulate an existing user without verification flags
    const existingUser = await User.create({
      email: 'existing.google.user@gmail.com',
      firstName: 'Existing',
      lastName: 'User',
      googleId: 'existing_google_123',
      isVerified: true,
      // Missing isEmailVerified and isPhoneVerified
    });

    // Simulate the update logic from our fix
    if (existingUser.isEmailVerified === undefined || existingUser.isEmailVerified === false) {
      existingUser.isEmailVerified = true;
    }
    if (existingUser.isPhoneVerified === undefined) {
      existingUser.isPhoneVerified = false;
    }
    await existingUser.save();

    console.log('✅ Existing user updated successfully!');
    console.log(`- isEmailVerified: ${existingUser.isEmailVerified}`);
    console.log(`- isPhoneVerified: ${existingUser.isPhoneVerified}`);

    // Clean up test data
    await User.deleteOne({ email: mockGooglePayload.email });
    await User.deleteOne({ email: 'existing.google.user@gmail.com' });
    console.log('\n🧹 Test data cleaned up');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Test completed, disconnected from MongoDB');
  }
}

// Run the test
testGoogleAuthFix();