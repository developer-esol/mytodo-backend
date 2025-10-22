const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  try {
    // Connect to the main database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to main database (Airtasker)');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@mytodo.com' });
    
    if (existingAdmin) {
      console.log('Updating existing admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'superadmin';
      existingAdmin.status = 'active';
      existingAdmin.isEmailVerified = true;
      existingAdmin.isPhoneVerified = true;
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@mytodo.com',
        password: hashedPassword,
        role: 'superadmin',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        phone: '+1234567890',
        location: 'System',
        bio: 'System Administrator'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎯 Admin Login Credentials:');
    console.log('📧 Email: admin@mytodo.com');
    console.log('🔑 Password: Admin123!');
    
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();