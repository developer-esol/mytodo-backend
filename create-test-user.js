const mongoose = require('mongoose'); 
const User = require('./models/User.js');

mongoose.connect('mongodb://localhost:27017/airtasksystem').then(async () => {
  console.log('Connected to MongoDB');
  
  // Create the test user that matches the JWT token
  const userId = '68d295e638cbeb79a7d7cf8e';
  const hashedPassword = 'testpassword123'; // Not hashed for simplicity
  
  const testUser = new User({
    _id: userId,
    firstName: 'kasun',
    lastName: 'Pasan', 
    email: 'janidu.ophtha@gmail.com',
    phone: '+94754640658',
    password: hashedPassword,
    role: 'user',
    isVerified: true,
    verified: false,
    rating: 4,
    completedTasks: 138,
    bio: 'No bio available',
    location: 'Colombo, Western Province',
    skills: {
      goodAt: [
        'test 1',
        'test 2', 
        'Bicycle',
        'Car',
        'Online',
        'Truck',
        'english',
        'Bsc.hons.Software Engineer'
      ],
      transport: [],
      languages: [],
      qualifications: [],
      experience: []
    },
    legacySkills: [
      'test 1',
      'test 2',
      'Bicycle', 
      'Car',
      'Online',
      'Truck',
      'english',
      'Bsc.hons.Software Engineer'
    ],
    verification: { ratifyId: { status: null } }
  });
  
  try {
    await testUser.save();
    console.log(`✅ Created test user: ${testUser.email} (ID: ${testUser._id})`);
  } catch (error) {
    if (error.code === 11000) {
      console.log(`✅ User already exists: ${testUser.email}`);
    } else {
      throw error;
    }
  }
  
  process.exit(0);
}).catch(err => { 
  console.error('Error:', err); 
  process.exit(1); 
});