require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');
    console.log('📍 Database:', mongoose.connection.db.databaseName);

    const count = await Student.countDocuments();
    console.log('👥 Student count:', count);

    const all = await Student.find({});
    console.log('📋 All students:', JSON.stringify(all, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

debug();