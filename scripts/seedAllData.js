const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Inventory = require('../models/Inventory');
const Announcement = require('../models/Announcement');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedAllData();
  })
  .then(() => {
    console.log('All data seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding data:', error);
    process.exit(1);
  });

async function seedAllData() {
  try {
    console.log('🌱 Starting comprehensive data seeding...\n');

    // 1. Seed Users
    console.log('👥 Seeding users...');
    await seedUsers();
    
    // 2. Seed Services
    console.log('🔧 Seeding services...');
    await seedServices();
    
    // 3. Seed Inventory
    console.log('📦 Seeding inventory...');
    await seedInventory();
    
    // 4. Seed Bookings
    console.log('📅 Seeding bookings...');
    await seedBookings();
    
    // 5. Seed Announcements
    console.log('📢 Seeding announcements...');
    await seedAnnouncements();
    
    // 6. Seed Feedback
    console.log('⭐ Seeding feedback...');
    await seedFeedback();
    
    // 7. Seed Notifications
    console.log('🔔 Seeding notifications...');
    await seedNotifications();

    console.log('\n✅ All data seeded successfully!');
    console.log('\n📋 Summary:');
    console.log('- Users: Admin, Technicians, House Owners');
    console.log('- Services: 8 different service categories');
    console.log('- Inventory: Tools and equipment for services');
    console.log('- Bookings: Sample service bookings');
    console.log('- Announcements: Admin announcements');
    console.log('- Feedback: House owner ratings');
    console.log('- Notifications: System alerts');

  } catch (error) {
    console.error('Error in seedAllData:', error);
    throw error;
  }
}

async function seedUsers() {
  // Clear existing non-admin users
  await User.deleteMany({ role: { $ne: 'admin' } });
  
  const sampleUsers = [
    {
      username: 'john_plumber',
      email: 'john@plumbing.com',
      password: 'plumber123',
      mobile: '+1234567891',
      role: 'technician',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true
    },
    {
      username: 'sarah_electrician',
      email: 'sarah@electric.com',
      password: 'electric123',
      mobile: '+1234567892',
      role: 'technician',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true
    },
    {
      username: 'mike_owner',
      email: 'mike@home.com',
      password: 'owner123',
      mobile: '+1234567893',
      role: 'house_owner',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true
    },
    {
      username: 'lisa_owner',
      email: 'lisa@home.com',
      password: 'owner456',
      mobile: '+1234567894',
      role: 'house_owner',
      isEmailVerified: true,
      isMobileVerified: true,
      isActive: true
    }
  ];

  // Hash passwords
  const bcrypt = require('bcryptjs');
  for (let user of sampleUsers) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  const insertedUsers = await User.insertMany(sampleUsers);
  console.log(`✅ Created ${insertedUsers.length} users`);
  return insertedUsers;
}

async function seedServices() {
  // Clear existing services
  await Service.deleteMany({});
  
  const sampleServices = [
    {
      name: 'Plumbing Repair',
      description: 'Professional plumbing services including leak repairs, pipe installation, and fixture replacement.',
      category: 'plumbing',
      basePrice: 120,
      estimatedDuration: '2-4 hours',
      features: ['24/7 Emergency Service', 'Licensed Plumbers', 'Warranty Included'],
      requirements: ['Access to water shut-off', 'Clear work area']
    },
    {
      name: 'Electrical Installation',
      description: 'Complete electrical services for homes and offices with safety compliance.',
      category: 'electrician',
      basePrice: 150,
      estimatedDuration: '3-5 hours',
      features: ['Certified Electricians', 'Safety Inspections', 'Code Compliance'],
      requirements: ['Power access', 'Circuit breaker access']
    },
    {
      name: 'House Cleaning',
      description: 'Comprehensive cleaning services for residential properties.',
      category: 'cleaning',
      basePrice: 100,
      estimatedDuration: '4-6 hours',
      features: ['Eco-friendly Products', 'Deep Cleaning', 'Regular Maintenance'],
      requirements: ['Cleaning supplies provided', 'Access to all rooms']
    },
    {
      name: 'Carpentry Work',
      description: 'Custom carpentry and woodwork services for home improvement.',
      category: 'carpentry',
      basePrice: 130,
      estimatedDuration: '4-8 hours',
      features: ['Custom Designs', 'Quality Materials', 'Professional Finish'],
      requirements: ['Work space', 'Material specifications']
    },
    {
      name: 'Interior Painting',
      description: 'Professional interior painting with color consultation.',
      category: 'painting',
      basePrice: 200,
      estimatedDuration: '6-8 hours',
      features: ['Color Consultation', 'Premium Paints', 'Clean Finish'],
      requirements: ['Furniture moved', 'Ventilation']
    },
    {
      name: 'Garden Maintenance',
      description: 'Complete garden care including landscaping and maintenance.',
      category: 'gardening',
      basePrice: 80,
      estimatedDuration: '3-4 hours',
      features: ['Landscape Design', 'Plant Care', 'Seasonal Maintenance'],
      requirements: ['Garden access', 'Water source']
    },
    {
      name: 'Appliance Repair',
      description: 'Repair services for all major household appliances.',
      category: 'appliance_repair',
      basePrice: 90,
      estimatedDuration: '2-3 hours',
      features: ['Diagnostic Service', 'Parts Warranty', 'Same Day Service'],
      requirements: ['Appliance access', 'Model information']
    },
    {
      name: 'HVAC Service',
      description: 'Heating, ventilation, and air conditioning system services.',
      category: 'other',
      basePrice: 180,
      estimatedDuration: '4-6 hours',
      features: ['System Maintenance', 'Emergency Repairs', 'Energy Efficiency'],
      requirements: ['System access', 'Filter replacement']
    }
  ];

  const insertedServices = await Service.insertMany(sampleServices);
  console.log(`✅ Created ${insertedServices.length} services`);
  return insertedServices;
}

async function seedInventory() {
  // Clear existing inventory
  await Inventory.deleteMany({});
  
  // Get admin user for createdBy field
  const admin = await User.findOne({ role: 'admin' });
  
  const sampleInventory = [
    {
      name: 'Plumbing Wrench Set',
      description: 'Professional grade plumbing wrenches for various pipe sizes',
      category: 'plumbing',
      quantity: 15,
      unit: 'sets',
      price: 45.99,
      supplier: 'Professional Tools Co.',
      location: 'Tool Storage A',
      minimumStock: 5,
      specifications: ['Adjustable jaws', 'Non-slip grip', 'Heavy duty'],
      notes: 'Essential for all plumbing services',
      createdBy: admin._id
    },
    {
      name: 'Electrical Test Kit',
      description: 'Complete electrical testing equipment for safety checks',
      category: 'electrical',
      quantity: 8,
      unit: 'kits',
      price: 89.99,
      supplier: 'Safety Equipment Ltd.',
      location: 'Tool Storage B',
      minimumStock: 3,
      specifications: ['Voltage tester', 'Circuit finder', 'Safety gloves'],
      notes: 'Required for electrical safety compliance',
      createdBy: admin._id
    },
    {
      name: 'Cleaning Supplies Kit',
      description: 'Professional cleaning supplies for house cleaning services',
      category: 'cleaning',
      quantity: 25,
      unit: 'kits',
      price: 35.99,
      supplier: 'CleanPro Supplies',
      location: 'Cleaning Storage',
      minimumStock: 10,
      specifications: ['Eco-friendly', 'Multi-surface', 'Long-lasting'],
      notes: 'Replenish monthly based on usage',
      createdBy: admin._id
    },
    {
      name: 'Carpentry Tool Set',
      description: 'Complete carpentry tools for woodworking projects',
      category: 'carpentry',
      quantity: 12,
      unit: 'sets',
      price: 120.99,
      supplier: 'WoodCraft Tools',
      location: 'Tool Storage C',
      minimumStock: 4,
      specifications: ['Saws', 'Hammers', 'Measuring tools', 'Safety gear'],
      notes: 'High-quality tools for professional finish',
      createdBy: admin._id
    },
    {
      name: 'Paint Supplies',
      description: 'Professional painting supplies and equipment',
      category: 'painting',
      quantity: 20,
      unit: 'sets',
      price: 55.99,
      supplier: 'PaintPro Supplies',
      location: 'Painting Storage',
      minimumStock: 8,
      specifications: ['Brushes', 'Rollers', 'Drop cloths', 'Tape'],
      notes: 'Check supplies before each painting job',
      createdBy: admin._id
    }
  ];

  const insertedInventory = await Inventory.insertMany(sampleInventory);
  console.log(`✅ Created ${insertedInventory.length} inventory items`);
  return insertedInventory;
}

async function seedBookings() {
  // Clear existing bookings
  await Booking.deleteMany({});
  
  // Get users and services
  const users = await User.find({});
  const services = await Service.find({});
  
  const houseOwner = users.find(u => u.role === 'house_owner');
  const technician = users.find(u => u.role === 'technician');
  const plumbingService = services.find(s => s.category === 'plumbing');
  const electricalService = services.find(s => s.category === 'electrician');
  const cleaningService = services.find(s => s.category === 'cleaning');

  const sampleBookings = [
    {
      houseOwner: houseOwner._id,
      service: plumbingService._id,
      technician: technician._id,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      scheduledTime: '10:00',
      status: 'accepted',
      address: '123 Main Street, City, State 12345',
      description: 'Fix leaking kitchen sink and replace faucet',
      urgency: 'medium',
      budget: 150,
      estimatedCost: plumbingService.basePrice,
      acceptedAt: new Date(),
      technicianNotes: 'Will bring necessary tools and parts'
    },
    {
      houseOwner: houseOwner._id,
      service: electricalService._id,
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      scheduledTime: '14:00',
      status: 'pending',
      address: '123 Main Street, City, State 12345',
      description: 'Install new ceiling fan in living room',
      urgency: 'normal',
      budget: 200,
      estimatedCost: electricalService.basePrice
    },
    {
      houseOwner: users.find(u => u.username === 'lisa_owner')._id,
      service: cleaningService._id,
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      scheduledTime: '09:00',
      status: 'in_progress',
      address: '456 Oak Avenue, City, State 12345',
      description: 'Deep cleaning of entire house',
      urgency: 'high',
      budget: 150,
      estimatedCost: cleaningService.basePrice,
      technician: users.find(u => u.username === 'sarah_electrician')._id,
      acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      technicianNotes: 'Started with kitchen and living room'
    }
  ];

  const insertedBookings = await Booking.insertMany(sampleBookings);
  console.log(`✅ Created ${insertedBookings.length} bookings`);
  return insertedBookings;
}

async function seedAnnouncements() {
  // Clear existing announcements
  await Announcement.deleteMany({});
  
  // Get admin user
  const admin = await User.findOne({ role: 'admin' });
  
  const sampleAnnouncements = [
    {
      title: 'New Service Categories Available',
      content: 'We are excited to announce that we have added new service categories including HVAC maintenance and appliance repair. Our technicians are fully trained and certified to provide these services.',
      type: 'general',
      priority: 'normal',
      targetAudience: 'all',
      startDate: new Date(),
      createdBy: admin._id
    },
    {
      title: 'Emergency Service Hotline',
      content: 'For urgent plumbing and electrical emergencies, call our 24/7 hotline at 1-800-EMERGENCY. Our technicians are available round the clock for critical issues.',
      type: 'urgent',
      priority: 'high',
      targetAudience: 'customers',
      startDate: new Date(),
      createdBy: admin._id
    },
    {
      title: 'Technician Training Program',
      content: 'All our technicians will be attending advanced training sessions next week. This will ensure better service quality and customer satisfaction.',
      type: 'maintenance',
      priority: 'low',
      targetAudience: 'technicians',
      startDate: new Date(),
      createdBy: admin._id
    }
  ];

  const insertedAnnouncements = await Announcement.insertMany(sampleAnnouncements);
  console.log(`✅ Created ${insertedAnnouncements.length} announcements`);
  return insertedAnnouncements;
}

async function seedFeedback() {
  // Clear existing feedback
  await Feedback.deleteMany({});
  
  // Get users and services
  const users = await User.find({});
  const services = await Service.find({});
  const bookings = await Booking.find({ status: 'completed' });
  
  if (bookings.length === 0) {
    console.log('⚠️ No completed bookings found for feedback');
    return;
  }

  const sampleFeedback = [
    {
      houseOwner: users.find(u => u.role === 'house_owner')._id,
      technician: users.find(u => u.username === 'john_plumber')._id,
      service: services.find(s => s.category === 'plumbing')._id,
      booking: bookings[0]._id,
      rating: 5,
      comment: 'Excellent service! John was professional, punctual, and fixed the plumbing issue quickly. Highly recommended!',
      categories: [
        { category: 'quality', rating: 5 },
        { category: 'punctuality', rating: 5 },
        { category: 'communication', rating: 5 },
        { category: 'cleanliness', rating: 4 },
        { category: 'professionalism', rating: 5 },
        { category: 'value_for_money', rating: 5 }
      ],
      isVerified: true,
      status: 'approved'
    }
  ];

  const insertedFeedback = await Feedback.insertMany(sampleFeedback);
  console.log(`✅ Created ${insertedFeedback.length} feedback entries`);
  return insertedFeedback;
}

async function seedNotifications() {
  // Clear existing notifications
  await Notification.deleteMany({});
  
  // Get users
  const users = await User.find({});
  const admin = users.find(u => u.role === 'admin');
  const houseOwner = users.find(u => u.role === 'house_owner');
  const technician = users.find(u => u.role === 'technician');

  const sampleNotifications = [
    {
      recipient: admin._id,
      type: 'booking_created',
      title: 'New Service Booking',
      message: `${houseOwner.username} has booked Plumbing Repair for ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()} at 10:00. Urgency: medium`,
      relatedEntity: 'booking',
      entityId: new mongoose.Types.ObjectId(),
      priority: 'medium',
      actionRequired: true
    },
    {
      recipient: admin._id,
      type: 'inventory_alert',
      title: 'Low Stock Alert',
      message: 'Inventory item "Plumbing Wrench Set" is running low. Current stock: 15 sets',
      relatedEntity: 'inventory',
      entityId: new mongoose.Types.ObjectId(),
      priority: 'medium',
      actionRequired: true
    }
  ];

  const insertedNotifications = await Notification.insertMany(sampleNotifications);
  console.log(`✅ Created ${insertedNotifications.length} notifications`);
  return insertedNotifications;
}
