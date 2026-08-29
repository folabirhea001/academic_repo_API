const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Delete existing admin
    await Admin.deleteMany({});

    // Create admin
    await Admin.create({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    });

    console.log('Admin account created successfully');
    console.log(`Username: ${process.env.ADMIN_USERNAME}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD}`);
    process.exit();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();