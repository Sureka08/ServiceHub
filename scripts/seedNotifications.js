const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Notification = require('./models/Notification');
const User = require('./models/User');
const Service = require('./models/Service');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedNotifications();
  })
  .then(() => {
    console.log('Notifications seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  });

async function seedNotifications() {
  try {
    // Get users and services
    const users = await User.find({});
    const services = await Service.find({});
    
    if (users.length === 0 || services.length === 0) {
      console.log('No users or services found. Please seed users and services first.');
      return;
    }

    const admin = users.find(u => u.role === 'admin');
    const houseOwner = users.find(u => u.role === 'house_owner');
    const technician = users.find(u => u.role === 'technician');

    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('Cleared existing notifications');

    // Sample notifications data
    const sampleNotifications = [
      {
        recipient: admin._id,
        type: 'booking_created',
        title: 'New Service Booking',
        message: `${houseOwner.username} has booked Plumbing Repair for ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()} at 10:00. Urgency: medium`,
        relatedEntity: 'booking',
        entityId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
        priority: 'medium',
        actionRequired: true
      },
      {
        recipient: admin._id,
        type: 'booking_created',
        title: 'High Urgency Booking',
        message: `${houseOwner.username} has booked Electrical Installation for ${new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString()} at 14:00. Urgency: high`,
        relatedEntity: 'booking',
        entityId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
        priority: 'high',
        actionRequired: true
      },
      {
        recipient: admin._id,
        type: 'booking_started',
        title: 'Service Started',
        message: `${technician.username} has started the cleaning service for ${houseOwner.username}`,
        relatedEntity: 'booking',
        entityId: new mongoose.Types.ObjectId(), // Generate a new ObjectId
        priority: 'low',
        actionRequired: false,
        isRead: true
      }
    ];

    // Insert sample notifications
    const insertedNotifications = await Notification.insertMany(sampleNotifications);
    console.log(`Inserted ${insertedNotifications.length} notifications`);

    // Display inserted notifications
    insertedNotifications.forEach(notification => {
      console.log(`- ${notification.type}: ${notification.title} (Priority: ${notification.priority})`);
    });

  } catch (error) {
    console.error('Error in seedNotifications:', error);
    throw error;
  }
}
