const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'Admin' });

    if (existingAdmin) {
      console.log('⚠️  An Admin account already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email:    ${existingAdmin.email}`);
      process.exit(0);
    }

    const admin = new User({
      username: 'Admin',
      name: 'Administrator',
      email: 'admin@attendance.com',
      password_hash: 'admin123',
      role: 'Admin',
      is_email_verified: true,
      is_manual_entry: false,
    });

    await admin.save();

    console.log('═══════════════════════════════════════════');
    console.log('  ✅ Default Admin Account Created!');
    console.log('  📧 Email:    admin@attendance.com');
    console.log('  🔑 Password: admin123');
    console.log('═══════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
