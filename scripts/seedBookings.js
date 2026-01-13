const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Booking = require('./models/Booking');
const User = require('./models/User');
const Service = require('./models/Service');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedBookings();
  })
  .then(() => {
    console.log('Bookings seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding bookings:', error);
    process.exit(1);
  });

async function seedBookings() {
  try {
    // Get users and services
    const users = await User.find({});
    const services = await Service.find({});
    
    if (users.length === 0 || services.length === 0) {
      console.log('No users or services found. Please seed users and services first.');
      return;
    }

    const houseOwner = users.find(u => u.role === 'house_owner');
    const technician = users.find(u => u.role === 'technician');
    const plumbingService = services.find(s => s.category === 'plumbing');
    const electricalService = services.find(s => s.category === 'electrician');

    // Clear existing bookings
    await Booking.deleteMany({});
    console.log('Cleared existing bookings');

    // Sample bookings data
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
        houseOwner: houseOwner._id,
        service: services.find(s => s.category === 'cleaning')._id,
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        scheduledTime: '09:00',
        status: 'in_progress',
        address: '123 Main Street, City, State 12345',
        description: 'Deep cleaning of entire house',
        urgency: 'high',
        budget: 150,
        estimatedCost: services.find(s => s.category === 'cleaning').basePrice,
        technician: users.find(u => u.role === 'technician')._id,
        acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        technicianNotes: 'Started with kitchen and living room'
      }
    ];

    // Insert sample bookings
    const insertedBookings = await Booking.insertMany(sampleBookings);
    console.log(`Inserted ${insertedBookings.length} bookings`);

    // Display inserted bookings
    insertedBookings.forEach(booking => {
      console.log(`- Booking ${booking._id}: ${booking.status} - ${new Date(booking.scheduledDate).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('Error in seedBookings:', error);
    throw error;
  }
}













