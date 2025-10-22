require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Fix skills data by moving items from goodAt to correct categories
async function fixSkillsData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find the user
    const user = await User.findOne({ email: "janidu.effectivesolutions@gmail.com" });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Current skills structure:');
    console.log(JSON.stringify(user.skills, null, 2));
    
    // Define what belongs where
    const transportItems = ['Bicycle', 'Car', 'Online', 'Scooter', 'Truck', 'Walk'];
    const languageKeywords = ['English', 'Sinhala', 'Spanish', 'French', 'German', 'Japanese'];
    const qualificationKeywords = ['Degree', 'Bachelor', 'Master', 'PhD', 'Certificate', 'Diploma', 'Engineer'];
    const experienceKeywords = ['Expert', 'Experience', 'Trace Expert', 'Solutions', 'Effective Solution'];
    
    const currentGoodAt = user.skills?.goodAt || [];
    
    const newSkills = {
      goodAt: [],
      transport: user.skills?.transport || [],
      languages: user.skills?.languages || [],
      qualifications: user.skills?.qualifications || [],
      experience: user.skills?.experience || []
    };
    
    // Process each item in goodAt
    currentGoodAt.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Check if it's a transport method
      if (transportItems.some(transport => skillLower.includes(transport.toLowerCase()))) {
        console.log(`Moving "${skill}" to transport`);
        if (!newSkills.transport.includes(skill)) {
          newSkills.transport.push(skill);
        }
      }
      // Check if it contains language keywords
      else if (languageKeywords.some(lang => skillLower.includes(lang.toLowerCase())) || skillLower.includes('language')) {
        console.log(`Moving "${skill}" to languages`);
        // If it's a combined language string like "English , Sinhala", split it
        if (skill.includes(',')) {
          const langs = skill.split(',').map(l => l.trim());
          langs.forEach(lang => {
            if (lang && !newSkills.languages.includes(lang)) {
              newSkills.languages.push(lang);
            }
          });
        } else {
          if (!newSkills.languages.includes(skill)) {
            newSkills.languages.push(skill);
          }
        }
      }
      // Check if it's a qualification
      else if (qualificationKeywords.some(qual => skillLower.includes(qual.toLowerCase()))) {
        console.log(`Moving "${skill}" to qualifications`);
        if (!newSkills.qualifications.includes(skill)) {
          newSkills.qualifications.push(skill);
        }
      }
      // Check if it's experience
      else if (experienceKeywords.some(exp => skillLower.includes(exp.toLowerCase()))) {
        console.log(`Moving "${skill}" to experience`);
        if (!newSkills.experience.includes(skill)) {
          newSkills.experience.push(skill);
        }
      }
      // Keep in goodAt if it doesn't match other categories
      else {
        console.log(`Keeping "${skill}" in goodAt`);
        if (!newSkills.goodAt.includes(skill)) {
          newSkills.goodAt.push(skill);
        }
      }
    });
    
    console.log('\n--- Corrected skills structure ---');
    console.log(JSON.stringify(newSkills, null, 2));
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { skills: newSkills },
      { new: true, runValidators: true }
    ).select('email skills');
    
    console.log('\n--- Updated user skills ---');
    console.log(JSON.stringify(updatedUser.skills, null, 2));
    
    console.log('\n--- Summary ---');
    console.log(`Good At: ${newSkills.goodAt.length} items`);
    console.log(`Transport: ${newSkills.transport.length} items`);
    console.log(`Languages: ${newSkills.languages.length} items`);
    console.log(`Qualifications: ${newSkills.qualifications.length} items`);
    console.log(`Experience: ${newSkills.experience.length} items`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixSkillsData();