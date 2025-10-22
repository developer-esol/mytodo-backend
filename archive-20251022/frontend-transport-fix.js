// FRONTEND FIX: Update your transport checkbox section in ProfilePage.jsx
// Replace the transport section with this corrected version:

{/* How do you get around? - FIXED VERSION */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-3">How do you get around?</label>
  <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {['Bicycle', 'Car', 'Online', 'Scooter', 'Truck', 'Walk'].map((transport) => (
        <label key={transport} className="flex items-center">
          <input
            type="checkbox"
            checked={skillsData.transport.includes(transport)}
            onChange={(e) => {
              console.log(`Transport ${transport} checked:`, e.target.checked);
              if (e.target.checked) {
                // Add to transport, not goodAt
                if (!skillsData.transport.includes(transport)) {
                  setSkillsData({
                    ...skillsData,
                    transport: [...skillsData.transport, transport]
                  });
                  console.log('Added to transport:', transport);
                }
              } else {
                // Remove from transport
                setSkillsData({
                  ...skillsData,
                  transport: skillsData.transport.filter(t => t !== transport)
                });
                console.log('Removed from transport:', transport);
              }
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">{transport}</span>
        </label>
      ))}
    </div>
  </div>
</div>

// ALSO MAKE SURE your handleAddSkill function is correct:
const handleAddSkill = (category) => {
  const skillText = newSkillInputs[category].trim();
  if (skillText && !skillsData[category].includes(skillText)) {
    console.log(`Adding "${skillText}" to category "${category}"`);
    console.log('Current skillsData:', skillsData);
    
    const updatedSkillsData = {
      ...skillsData,
      [category]: [...skillsData[category], skillText]
    };
    
    console.log('Updated skillsData:', updatedSkillsData);
    setSkillsData(updatedSkillsData);
    
    setNewSkillInputs({
      ...newSkillInputs,
      [category]: ''
    });
  }
};

// DEBUGGING: Add this console.log right before sending to backend:
const handleSaveProfile = async () => {
  try {
    // DEBUGGING - Log the current state before processing
    console.log('=== DEBUGGING SKILLS SAVE ===');
    console.log('skillsData before processing:', JSON.stringify(skillsData, null, 2));
    console.log('editForm:', JSON.stringify(editForm, null, 2));
    
    // Create the profile update object
    const profileUpdate = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      phone: editForm.phone,
      location: editForm.location,
      bio: editForm.bio,
      skills: {
        goodAt: skillsData.goodAt || [],
        transport: skillsData.transport || [],
        languages: skillsData.languages || [],
        qualifications: skillsData.qualifications || [],
        experience: skillsData.experience || []
      }
    };

    console.log('Profile update payload:', JSON.stringify(profileUpdate, null, 2));
    console.log('=== END DEBUGGING ===');

    // Rest of your existing handleSaveProfile code...
    // ...
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  }
};