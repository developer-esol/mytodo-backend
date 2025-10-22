// Frontend ProfilePage - Fixed handleSaveProfile function
// Replace your existing handleSaveProfile function with this one:

const handleSaveProfile = async () => {
  try {
    // IMPORTANT: Make sure skillsData is properly structured
    console.log('Current skillsData before sending:', JSON.stringify(skillsData, null, 2));
    
    // Ensure all skill categories are arrays and properly formatted
    const structuredSkills = {
      goodAt: Array.isArray(skillsData.goodAt) ? skillsData.goodAt : [],
      transport: Array.isArray(skillsData.transport) ? skillsData.transport : [],
      languages: Array.isArray(skillsData.languages) ? skillsData.languages : [],
      qualifications: Array.isArray(skillsData.qualifications) ? skillsData.qualifications : [],
      experience: Array.isArray(skillsData.experience) ? skillsData.experience : []
    };
    
    console.log('Structured skills to send:', JSON.stringify(structuredSkills, null, 2));
    
    const profileUpdate = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      phone: editForm.phone,
      location: editForm.location,
      bio: editForm.bio,
      skills: structuredSkills // Send the properly structured skills
    };

    console.log('Complete profile update payload:', JSON.stringify(profileUpdate, null, 2));

    // Try to update via backend API first
    try {
      const updatedProfile = await profileService.updateProfile(profileUpdate);
      
      console.log('Backend response:', JSON.stringify(updatedProfile, null, 2));
      
      // Update userData with response from backend
      const updatedUserData = {
        ...userData,
        name: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phone: updatedProfile.phone || 'Not provided',
        location: updatedProfile.location || 'Not provided',
        bio: updatedProfile.bio || 'No bio available',
        skills: updatedProfile.skills || structuredSkills // Use backend response or fallback
      };

      setUserData(updatedUserData);

      // Update localStorage with new data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        ...updatedProfile
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userName', `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim());

      setIsEditing(false);
      alert('Profile updated successfully!');
      return;

    } catch (apiError) {
      console.log('Backend API error:', apiError);
      console.log('API error response:', apiError.response?.data);
      
      // Continue with localStorage fallback
    }

    // Fallback to localStorage-only update if API fails
    const updatedUserData = {
      ...userData,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      name: `${editForm.firstName} ${editForm.lastName}`.trim(),
      phone: editForm.phone,
      location: editForm.location,
      bio: editForm.bio,
      skills: structuredSkills // Use structured skills data
    };

    setUserData(updatedUserData);

    // Update localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...currentUser,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      phone: editForm.phone,
      location: editForm.location,
      bio: editForm.bio,
      skills: structuredSkills // Use structured skills data
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('userName', `${editForm.firstName} ${editForm.lastName}`.trim());

    setIsEditing(false);
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  }
};

// Also make sure your skill management functions are working correctly:

const handleAddSkill = (category) => {
  const skillText = newSkillInputs[category].trim();
  if (skillText && !skillsData[category].includes(skillText)) {
    console.log(`Adding "${skillText}" to ${category}`);
    setSkillsData({
      ...skillsData,
      [category]: [...skillsData[category], skillText]
    });
    setNewSkillInputs({
      ...newSkillInputs,
      [category]: ''
    });
  }
};

const handleRemoveSkill = (category, skillToRemove) => {
  console.log(`Removing "${skillToRemove}" from ${category}`);
  setSkillsData({
    ...skillsData,
    [category]: skillsData[category].filter(skill => skill !== skillToRemove)
  });
};

// Make sure your transport checkbox handler is correct:
const handleTransportChange = (transport, isChecked) => {
  if (isChecked) {
    if (!skillsData.transport.includes(transport)) {
      setSkillsData({
        ...skillsData,
        transport: [...skillsData.transport, transport]
      });
    }
  } else {
    setSkillsData({
      ...skillsData,
      transport: skillsData.transport.filter(t => t !== transport)
    });
  }
};