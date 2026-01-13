const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/service-booking-app';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedTechnicians();
  })
  .then(() => {
    console.log('Technicians seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding technicians:', error);
    process.exit(1);
  });

async function seedTechnicians() {
  try {
    // Check if technicians already exist
    const existingTechnicians = await User.find({ role: 'technician' });
    
    if (existingTechnicians.length > 0) {
      console.log('Technicians already exist:');
      existingTechnicians.forEach(tech => {
        console.log(`- ${tech.username} (${tech.email})`);
      });
      return;
    }

    const technicians = [
      {
        username: 'john_plumber',
        email: 'john.plumber@servicehub.com',
        password: 'tech123',
        mobile: '+1234567891',
        role: 'technician',
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        specialties: ['Plumbing', 'Water Heater Repair', 'Pipe Installation']
      },
      {
        username: 'sarah_electrician',
        email: 'sarah.electrician@servicehub.com',
        password: 'tech123',
        mobile: '+1234567892',
        role: 'technician',
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        specialties: ['Electrical', 'Wiring', 'Outlet Installation']
      },
      {
        username: 'mike_painter',
        email: 'mike.painter@servicehub.com',
        password: 'tech123',
        mobile: '+1234567893',
        role: 'technician',
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        specialties: ['Painting', 'Interior Design', 'Color Consultation']
      },
      {
        username: 'lisa_cleaner',
        email: 'lisa.cleaner@servicehub.com',
        password: 'tech123',
        mobile: '+1234567894',
        role: 'technician',
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        specialties: ['House Cleaning', 'Deep Cleaning', 'Window Cleaning']
      },
      {
        username: 'david_handyman',
        email: 'david.handyman@servicehub.com',
        password: 'tech123',
        mobile: '+1234567895',
        role: 'technician',
        isEmailVerified: true,
        isMobileVerified: true,
        isActive: true,
        specialties: ['General Repair', 'Furniture Assembly', 'Home Maintenance']
      }
    ];

    console.log('Creating technicians...');
    
    for (const techData of technicians) {
      const technician = new User(techData);
      await technician.save();
      console.log(`✅ Created technician: ${technician.username}`);
    }

    console.log('\n🎉 All technicians created successfully!');
    console.log('\n📋 Technician Login Credentials:');
    technicians.forEach(tech => {
      console.log(`Username: ${tech.username}`);
      console.log(`Email: ${tech.email}`);
      console.log(`Password: ${tech.password}`);
      console.log(`Specialties: ${tech.specialties.join(', ')}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error in seedTechnicians:', error);
    throw error;
  }
}








