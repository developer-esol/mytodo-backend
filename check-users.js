const mongoose = require('mongoose'); 
mongoose.connect('mongodb://localhost:27017/airtasksystem').then(async () => {
  const User = require('./models/User.js');
  const users = await User.find({}).limit(5).select('_id firstName lastName email');
  console.log('Users in database:');
  users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}`));
  process.exit(0);
}).catch(err => { console.error('Error:', err); process.exit(1); });