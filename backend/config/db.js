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
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
