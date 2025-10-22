const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkExistingGoogleUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Checking existing Google users...\n');

    // Find users with Google IDs
    const googleUsers = await User.find({ 
      googleId: { $exists: true, $ne: null } 
    });

    console.log(`Found ${googleUsers.length} Google users:`);
    
    googleUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   - googleId: ${user.googleId}`);
      console.log(`   - isVerified: ${user.isVerified}`);
      console.log(`   - verified: ${user.verified}`);
      console.log(`   - isEmailVerified: ${user.isEmailVerified}`);
      console.log(`   - isPhoneVerified: ${user.isPhoneVerified}`);
      console.log(`   - phone: ${user.phone || 'N/A'}`);
    });

    // Check regular users too for comparison
    const regularUsers = await User.find({ 
      googleId: { $exists: false },
      isVerified: true 
    }).limit(3);

    console.log(`\n\nFor comparison, ${regularUsers.length} regular verified users:`);
    regularUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   - isVerified: ${user.isVerified}`);
      console.log(`   - isEmailVerified: ${user.isEmailVerified}`);
      console.log(`   - isPhoneVerified: ${user.isPhoneVerified}`);
      console.log(`   - phone: ${user.phone || 'N/A'}`);
    });

    // Check what the correct logic should be
    console.log('\n\n=== ANALYSIS ===');
    console.log('The frontend should use this logic:');
    console.log('');
    console.log('For users WITH phone numbers:');
    console.log('  needs2FA = !isEmailVerified || !isPhoneVerified');
    console.log('');
    console.log('For users WITHOUT phone numbers (like Google users):');
    console.log('  needs2FA = !isEmailVerified');
    console.log('');
    console.log('Or more specifically:');
    console.log('  const hasPhone = user.phone && user.phone.trim() !== "";');
    console.log('  const needsEmailVerification = !user.isEmailVerified;');
    console.log('  const needsPhoneVerification = hasPhone && !user.isPhoneVerified;');
    console.log('  const needs2FA = needsEmailVerification || needsPhoneVerification;');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkExistingGoogleUsers();