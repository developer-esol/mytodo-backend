const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateAllGoogleUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Updating all existing Google users...\n');

    // Find and update all Google users
    const result = await User.updateMany(
      { 
        googleId: { $exists: true, $ne: null },
        $or: [
          { isEmailVerified: { $ne: true } },
          { isPhoneVerified: { $exists: false } }
        ]
      },
      { 
        $set: { 
          isEmailVerified: true,  // Google email is verified
          isPhoneVerified: false  // Google doesn't provide phone
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} Google users`);

    // Verify the update
    const updatedUsers = await User.find({ 
      googleId: { $exists: true, $ne: null } 
    }).select('firstName lastName email isEmailVerified isPhoneVerified');

    console.log('\n📋 Updated Google users verification status:');
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   - isEmailVerified: ${user.isEmailVerified} ✅`);
      console.log(`   - isPhoneVerified: ${user.isPhoneVerified} ✅`);
    });

    console.log('\n🎉 All Google users updated successfully!');
    console.log('✅ Google users will no longer see 2FA prompts');
    console.log('✅ Existing Google users can now sign in without issues');

  } catch (error) {
    console.error('Error updating Google users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateAllGoogleUsers();