const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Attendance = require('./models/Attendance');
const Group = require('./models/Group');

dotenv.config();

const cleanDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all regular non-admin users
    const result = await User.deleteMany({ role: { $ne: 'Admin' } });
    console.log(`🗑 Deleted ${result.deletedCount} non-admin user accounts.`);

    // Clean up attendance & groups
    await Attendance.deleteMany({});
    console.log('🗑 Cleared attendance records.');

    // Ensure Admin account exists
    let admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      admin = new User({
        username: 'Admin',
        name: 'Administrator',
        email: 'admin@attendance.com',
        password_hash: 'admin123',
        role: 'Admin',
        is_email_verified: true,
        is_manual_entry: false,
      });
      await admin.save();
      console.log('👑 Admin account created (Email: admin@attendance.com, Pass: admin123)');
    }

    console.log('✨ Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Clean DB error:', error.message);
    process.exit(1);
  }
};

cleanDatabase();
