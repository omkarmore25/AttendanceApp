const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy unique index on phone field if it exists
    try {
      await mongoose.connection.collection('users').dropIndex('phone_1');
      console.log('✅ Legacy phone_1 index dropped from users collection.');
    } catch (idxErr) {
      // Index did not exist or already dropped
    }

    // Auto-seed default Admin account if no admin exists
    try {
      const User = require('../models/User');
      let admin = await User.findOne({ role: 'Admin' });
      if (!admin) {
        admin = new User({
          username: 'System Admin',
          email: 'admin@attendance.com',
          password_hash: 'admin123',
          role: 'Admin',
          is_verified: true,
        });
        await admin.save();
        console.log('👑 Default Admin account created (admin@attendance.com / admin123)');
      }
    } catch (seedErr) {
      console.error('Error checking default admin account:', seedErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
