require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));

// Test endpoint to update skills properly
app.post('/test/update-skills', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const { email, skills } = req.body;
    
    if (!email || !skills) {
      return res.status(400).json({ 
        error: 'Email and skills are required',
        received: { email, skills }
      });
    }
    
    console.log('Received skills data:', JSON.stringify(skills, null, 2));
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update skills with proper structure
    const updateData = {
      skills: {
        goodAt: skills.goodAt || [],
        transport: skills.transport || [],
        languages: skills.languages || [],
        qualifications: skills.qualifications || [],
        experience: skills.experience || []
      }
    };
    
    console.log('Updating with:', JSON.stringify(updateData, null, 2));
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('email skills');
    
    res.json({
      success: true,
      message: 'Skills updated successfully',
      data: {
        email: updatedUser.email,
        skills: updatedUser.skills
      }
    });
    
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to get current skills
app.get('/test/get-skills/:email', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const user = await User.findOne({ email: req.params.email }).select('email skills');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: {
        email: user.email,
        skills: user.skills
      }
    });
    
  } catch (error) {
    console.error('Error getting skills:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Skills test server running on port ${PORT}`);
  console.log(`Test update skills: POST http://localhost:${PORT}/test/update-skills`);
  console.log(`Test get skills: GET http://localhost:${PORT}/test/get-skills/your-email@gmail.com`);
});