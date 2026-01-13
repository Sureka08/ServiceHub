const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Sample users data
const sampleUsers = [
  {
    username: 'admin',
    email: 'adminservicehub@gmail.com',
    password: 'admin123',
    mobile: '+1234567890',
    role: 'admin',
    isEmailVerified: true,
    isMobileVerified: true
  },
  {
    username: 'john_plumber',
    email: 'john@plumbing.com',
    password: 'plumber123',
    mobile: '+1234567891',
    role: 'technician',
    isEmailVerified: true,
    isMobileVerified: true
  },
  {
    username: 'sarah_electrician',
    email: 'sarah@electric.com',
    password: 'electric123',
    mobile: '+1234567892',
    role: 'technician',
    isEmailVerified: true,
    isMobileVerified: true
  },
  {
    username: 'mike_owner',
    email: 'mike@home.com',
    password: 'owner123',
    mobile: '+1234567893',
    role: 'house_owner',
    isEmailVerified: true,
    isMobileVerified: true
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedUsers();
  })
  .then(() => {
    console.log('Users seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding users:', error);
    process.exit(1);
  });

async function seedUsers() {
  try {
    // Clear existing users (except keep admin if exists)
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('Cleared existing non-admin users');

    // Create users individually to ensure password hashing middleware works
    for (const userData of sampleUsers) {
      try {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${user.username} (${user.role}): ${user.email}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`User ${userData.username} already exists, skipping...`);
        } else {
          console.error(`Error creating user ${userData.username}:`, error.message);
        }
      }
    }

    console.log('User seeding completed!');

  } catch (error) {
    console.error('Error in seedUsers:', error);
    throw error;
  }
}

