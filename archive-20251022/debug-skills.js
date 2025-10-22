require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Debug script to check and fix skills data
async function debugSkills() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find the user you're working with (update with your actual user ID or email)
    const user = await User.findOne({ email: "janidu.effectivesolutions@gmail.com" });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Current user skills structure:');
    console.log(JSON.stringify(user.skills, null, 2));
    
    // Check what transport skills might be in goodAt
    const transportItems = ['Bicycle', 'Car', 'Online', 'Scooter', 'Truck', 'Walk'];
    const skillsInGoodAt = user.skills?.goodAt || [];
    
    console.log('\n--- Skills Analysis ---');
    console.log('Skills in goodAt:', skillsInGoodAt);
    
    const actualGoodAt = [];
    const actualTransport = user.skills?.transport || [];
    
    // Separate skills properly
    skillsInGoodAt.forEach(skill => {
      if (transportItems.includes(skill)) {
        console.log(`Found transport skill in goodAt: ${skill}`);
        if (!actualTransport.includes(skill)) {
          actualTransport.push(skill);
        }
      } else {
        actualGoodAt.push(skill);
      }
    });
    
    console.log('Corrected goodAt:', actualGoodAt);
    console.log('Corrected transport:', actualTransport);
    
    // Update the user with corrected skills
    const correctedSkills = {
      goodAt: actualGoodAt,
      transport: actualTransport,
      languages: user.skills?.languages || [],
      qualifications: user.skills?.qualifications || [],
      experience: user.skills?.experience || []
    };
    
    console.log('\n--- Updating user with corrected skills ---');
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { skills: correctedSkills },
      { new: true }
    ).select('skills');
    
    console.log('Updated skills:');
    console.log(JSON.stringify(updatedUser.skills, null, 2));
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugSkills();