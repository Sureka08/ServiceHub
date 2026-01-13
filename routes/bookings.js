const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification'); // Added Notification model
const Feedback = require('../models/Feedback'); // Added Feedback model
const Announcement = require('../models/Announcement'); // Added Announcement model
const smsService = require('../utils/smsService'); // Added SMS service

// Helper function to reduce inventory quantities when booking is created
const reduceInventoryOnBooking = async (selectedInventory) => {
  try {
    console.log('🔧 reduceInventoryOnBooking called with:', selectedInventory);
    
    if (!selectedInventory || selectedInventory.length === 0) {
      console.log('ℹ️ No inventory items to reduce for booking');
      return { success: true, message: 'No inventory items selected' };
    }

    console.log('📦 Reducing inventory for booking with items:', selectedInventory.length);
    
    const reductionResults = [];
    
    for (const item of selectedInventory) {
      console.log('🔍 Processing inventory item:', item);
      const inventoryItem = await Inventory.findById(item.itemId);
      
      if (!inventoryItem) {
        console.error(`❌ Inventory item not found: ${item.itemId}`);
        reductionResults.push({
          itemId: item.itemId,
          itemName: item.name,
          success: false,
          error: 'Item not found'
        });
        continue;
      }
      
      console.log(`📦 Found inventory item: ${inventoryItem.name}, current quantity: ${inventoryItem.quantity}`);

      // Check if sufficient stock is available
      if (inventoryItem.quantity < item.quantity) {
        console.error(`Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Required: ${item.quantity}`);
        reductionResults.push({
          itemId: item.itemId,
          itemName: item.name,
          success: false,
          error: `Insufficient stock. Available: ${inventoryItem.quantity}, Required: ${item.quantity}`
        });
        continue;
      }

      // Reduce the quantity
      const oldQuantity = inventoryItem.quantity;
      inventoryItem.quantity = Math.max(0, inventoryItem.quantity - item.quantity);
      
      // Update the updatedAt timestamp
      inventoryItem.updatedAt = new Date();
      
      await inventoryItem.save();
      
      console.log(`Reduced ${inventoryItem.name} from ${oldQuantity} to ${inventoryItem.quantity}`);
      
      reductionResults.push({
        itemId: item.itemId,
        itemName: item.name,
        success: true,
        oldQuantity,
        newQuantity: inventoryItem.quantity,
        reducedBy: item.quantity
      });
    }

    const failedReductions = reductionResults.filter(r => !r.success);
    if (failedReductions.length > 0) {
      return {
        success: false,
        message: 'Some inventory items could not be reduced',
        failedItems: failedReductions,
        successfulItems: reductionResults.filter(r => r.success)
      };
    }

    return {
      success: true,
      message: 'All inventory items reduced successfully',
      results: reductionResults
    };

  } catch (error) {
    console.error('Error reducing inventory on booking:', error);
    return {
      success: false,
      message: 'Error reducing inventory',
      error: error.message
    };
  }
};

// Helper function to restore inventory quantities when booking is cancelled
const restoreInventoryOnCancellation = async (selectedInventory) => {
  try {
    if (!selectedInventory || selectedInventory.length === 0) {
      console.log('No inventory items to restore for cancelled booking');
      return { success: true, message: 'No inventory items to restore' };
    }

    console.log('Restoring inventory for cancelled booking with items:', selectedInventory.length);
    
    const restorationResults = [];
    
    for (const item of selectedInventory) {
      const inventoryItem = await Inventory.findById(item.itemId);
      
      if (!inventoryItem) {
        console.error(`Inventory item not found for restoration: ${item.itemId}`);
        restorationResults.push({
          itemId: item.itemId,
          itemName: item.name,
          success: false,
          error: 'Item not found'
        });
        continue;
      }

      // Restore the quantity
      const oldQuantity = inventoryItem.quantity;
      inventoryItem.quantity += item.quantity;
      
      // Update the updatedAt timestamp
      inventoryItem.updatedAt = new Date();
      
      await inventoryItem.save();
      
      console.log(`Restored ${inventoryItem.name} from ${oldQuantity} to ${inventoryItem.quantity}`);
      
      restorationResults.push({
        itemId: item.itemId,
        itemName: item.name,
        success: true,
        oldQuantity,
        newQuantity: inventoryItem.quantity,
        restoredBy: item.quantity
      });
    }

    return {
      success: true,
      message: 'Inventory restored successfully',
      results: restorationResults
    };

  } catch (error) {
    console.error('Error restoring inventory on cancellation:', error);
    return {
      success: false,
      message: 'Error restoring inventory',
      error: error.message
    };
  }
};

// Helper function to consume inventory when booking is completed
const consumeInventory = async (booking) => {
  try {
    if (!booking.selectedInventory || booking.selectedInventory.length === 0) {
      console.log('No inventory items to consume for booking:', booking._id);
      return;
    }

    console.log('Consuming inventory for booking:', booking._id);
    
    for (const item of booking.selectedInventory) {
      const inventoryItem = await Inventory.findById(item.itemId);
      
      if (!inventoryItem) {
        console.error(`Inventory item not found: ${item.itemId}`);
        continue;
      }

      // Check if sufficient stock is available
      if (inventoryItem.quantity < item.quantity) {
        console.error(`Insufficient stock for ${inventoryItem.name}. Required: ${item.quantity}, Available: ${inventoryItem.quantity}`);
        
        // Create low stock notification
        try {
          const adminUsers = await User.find({ role: 'admin' });
          for (const admin of adminUsers) {
            const notification = new Notification({
              recipient: admin._id,
              type: 'inventory_alert',
              title: 'Insufficient Stock Alert',
              message: `Cannot complete booking ${booking._id} - insufficient stock for ${inventoryItem.name}. Required: ${item.quantity}, Available: ${inventoryItem.quantity}`,
              relatedEntity: 'inventory',
              entityId: inventoryItem._id,
              priority: 'high',
              actionRequired: true
            });
            await notification.save();
          }
        } catch (notificationError) {
          console.error('Error creating insufficient stock notification:', notificationError);
        }
        
        continue;
      }

      // Consume the inventory
      inventoryItem.quantity -= item.quantity;
      await inventoryItem.save();
      
      console.log(`Consumed ${item.quantity} ${inventoryItem.unit} of ${inventoryItem.name}`);

      // Check if item is now low stock and create notification
      if (inventoryItem.quantity <= inventoryItem.reorderLevel) {
        try {
          const adminUsers = await User.find({ role: 'admin' });
          for (const admin of adminUsers) {
            const notification = new Notification({
              recipient: admin._id,
              type: 'inventory_alert',
              title: 'Low Stock Alert',
              message: `Inventory item "${inventoryItem.name}" is now low on stock. Current quantity: ${inventoryItem.quantity} ${inventoryItem.unit}`,
              relatedEntity: 'inventory',
              entityId: inventoryItem._id,
              priority: 'medium',
              actionRequired: true
            });
            await notification.save();
          }
        } catch (notificationError) {
          console.error('Error creating low stock notification:', notificationError);
        }
      }
    }
    
    console.log('Inventory consumption completed for booking:', booking._id);
  } catch (error) {
    console.error('Error consuming inventory:', error);
    throw error;
  }
};

// Helper function to send booking cancellation notification
const sendBookingCancellationNotification = async (booking) => {
  try {
    // Populate booking details for notification
    await booking.populate([
      { path: 'houseOwner', select: 'username email mobile' },
      { path: 'service', select: 'name category basePrice' },
      { path: 'technician', select: 'username email mobile' }
    ]);

    // Create notification message
    let message = `A booking has been cancelled!\n\n`;
    message += `Service: ${booking.service.name}\n`;
    message += `Customer: ${booking.houseOwner.username}\n`;
    message += `Date: ${booking.scheduledDate.toLocaleDateString()}\n`;
    message += `Time: ${booking.scheduledTime}\n`;
    message += `Address: ${booking.address}\n`;
    
    if (booking.description) {
      message += `Description: ${booking.description}\n`;
    }
    
    message += `\nCancelled at: ${new Date().toLocaleString()}\n`;

    // Create notification
    const notification = await Notification.createNotification({
      recipient: booking.technician._id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: message,
      relatedEntity: 'booking',
      entityId: booking._id,
      priority: 'medium',
      actionRequired: false
    });

    console.log(`Cancellation notification sent to technician ${booking.technician.username}: ${notification._id}`);
    
    return notification;
  } catch (error) {
    console.error('Error creating cancellation notification:', error);
    throw error;
  }
};

// Helper function to create automatic feedback when booking is completed
const createAutoFeedback = async (booking, completionNotes = '') => {
  try {
    // Check if feedback already exists for this booking
    const existingFeedback = await Feedback.findOne({ booking: booking._id });
    if (existingFeedback) {
      console.log('Feedback already exists for booking:', booking._id);
      return existingFeedback;
    }

    // Create automatic feedback with default values
    const autoFeedback = new Feedback({
      houseOwner: booking.houseOwner,
      technician: booking.technician,
      service: booking.service,
      booking: booking._id,
      rating: 5, // Default 5-star rating for completed service
      comment: completionNotes || 'Service completed successfully. Thank you for choosing our service!',
      categories: [
        { category: 'quality', rating: 5 },
        { category: 'punctuality', rating: 5 },
        { category: 'communication', rating: 5 },
        { category: 'cleanliness', rating: 5 },
        { category: 'professionalism', rating: 5 },
        { category: 'value_for_money', rating: 5 }
      ],
      isAnonymous: false,
      isPublic: true,
      status: 'approved' // Auto-approve completed service feedback
    });

    await autoFeedback.save();

    // Populate feedback details
    await autoFeedback.populate([
      { path: 'houseOwner', select: 'username email' },
      { path: 'technician', select: 'username email' },
      { path: 'service', select: 'name category' },
      { path: 'booking', select: 'scheduledDate estimatedCost' }
    ]);

    console.log('Auto feedback created for booking:', booking._id);
    return autoFeedback;

  } catch (error) {
    console.error('Error creating auto feedback:', error);
    throw error;
  }
};

// Helper function to send technician assignment notification
const sendTechnicianAssignmentNotification = async (booking, technician) => {
  try {
    // Populate booking details for notification
    await booking.populate([
      { path: 'houseOwner', select: 'username email mobile' },
      { path: 'service', select: 'name category basePrice' }
    ]);

    // Create notification message
    let message = `You have been assigned to a new booking!\n\n`;
    message += `Service: ${booking.service.name}\n`;
    message += `Customer: ${booking.houseOwner.username}\n`;
    message += `Date: ${booking.scheduledDate.toLocaleDateString()}\n`;
    message += `Time: ${booking.scheduledTime}\n`;
    message += `Address: ${booking.address}\n`;
    
    if (booking.description) {
      message += `Description: ${booking.description}\n`;
    }
    
    if (booking.selectedInventory && booking.selectedInventory.length > 0) {
      message += `\nRequired Materials:\n`;
      booking.selectedInventory.forEach(item => {
        message += `• ${item.name} (${item.quantity} ${item.unit || 'pieces'}) - LKR ${item.totalPrice}\n`;
      });
      message += `\nTotal Materials Cost: LKR ${booking.selectedInventory.reduce((sum, item) => sum + item.totalPrice, 0)}\n`;
    }
    
    message += `\nService Cost: LKR ${booking.service.basePrice}\n`;
    message += `Total Cost: LKR ${booking.estimatedCost}\n`;
    message += `Payment Method: ${booking.paymentMethod.replace('_', ' ').toUpperCase()}\n`;
    
    if (booking.urgency !== 'normal') {
      message += `\nUrgency: ${booking.urgency.toUpperCase()}\n`;
    }

    // Create notification
    const notification = await Notification.createNotification({
      recipient: technician._id,
      type: 'booking_assigned',
      title: 'New Booking Assignment',
      message: message,
      relatedEntity: 'booking',
      entityId: booking._id,
      priority: booking.urgency === 'high' ? 'high' : 'medium',
      actionRequired: true,
      actionUrl: `/technician/bookings/${booking._id}`
    });

    console.log(`Notification sent to technician ${technician.username}: ${notification._id}`);
    
    // Note: Real-time notification via Socket.IO will be handled in the route handler
    // where req.app.get('io') is available

    return notification;
  } catch (error) {
    console.error('Error creating technician notification:', error);
    throw error;
  }
};

// Helper function to create notification for house owner when technician is assigned
const createTechnicianAssignmentNotification = async (booking, technician, adminUser, io = null) => {
  try {
    // Populate booking details
    await booking.populate([
      { path: 'houseOwner', select: 'username email mobile' },
      { path: 'service', select: 'name category basePrice' }
    ]);

    // Create notification for the specific house owner
    const notification = new Notification({
      recipient: booking.houseOwner._id,
      type: 'technician_assigned',
      title: `👨‍🔧 Technician Assigned - ${booking.service.name}`,
      message: `Dear ${booking.houseOwner.username},

👨‍🔧 Good news! A technician has been assigned to your service booking. The booking will be confirmed once the technician accepts it.

📋 Booking Details:
• Service: ${booking.service.name}
• Date: ${booking.scheduledDate.toLocaleDateString()}
• Time: ${booking.scheduledTime}
• Address: ${booking.address}
• Total Cost: LKR ${booking.estimatedCost}

👨‍🔧 Your Assigned Technician:
• Name: ${technician.username}
• Mobile: ${technician.mobile}
• Email: ${technician.email}
${technician.rating ? `• Rating: ${technician.rating.toFixed(1)}⭐` : ''}

📞 Important Notes:
• The technician will contact you directly before the scheduled time
• Please ensure someone is available at the address during the scheduled time
• You can contact the technician directly if you have any questions
• Payment will be collected after service completion

Thank you for choosing ServiceHub Sri Lanka!

Best regards,
ServiceHub Team`,
      relatedEntity: 'booking',
      entityId: booking._id,
      priority: 'high',
      actionRequired: false,
      isRead: false
    });

    await notification.save();

    console.log(`✅ Technician assignment notification sent to house owner ${booking.houseOwner.username}: ${notification._id}`);
    
    // Emit real-time notification to house owner if socket.io is available
    if (io) {
      io.to(booking.houseOwner._id.toString()).emit('newNotification', {
        notification: await notification.populate('recipient', 'username email')
      });
    }
    
    // Send SMS notification to house owner
    try {
      const smsMessage = `ServiceHub: Your ${booking.service.name} booking has been accepted! Technician: ${technician.username} (${technician.mobile}). Date: ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledTime}. Contact technician directly for any questions.`;
      
      await smsService.sendTechnicianAssignmentSMS(booking.houseOwner.mobile, {
        serviceName: booking.service.name,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        technicianName: technician.username,
        technicianMobile: technician.mobile
      });
      
      console.log(`SMS notification sent to house owner ${booking.houseOwner.username} at ${booking.houseOwner.mobile}`);
    } catch (smsError) {
      console.error('Failed to send SMS notification:', smsError);
      // Don't fail the notification if SMS fails
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating technician assignment notification:', error);
    throw error;
  }
};

// Helper function to find available technician
const findAvailableTechnician = async (scheduledDate, scheduledTime) => {
  try {
    console.log('Finding available technician for:', { scheduledDate, scheduledTime });
    
    // Find technicians who are not assigned to any booking at the specified time
    const conflictingBookings = await Booking.find({
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime,
      status: { $in: ['accepted', 'in_progress'] }
    }).select('technician');

    console.log('Conflicting bookings found:', conflictingBookings.length);

    const assignedTechnicianIds = conflictingBookings
      .map(booking => booking.technician)
      .filter(id => id);

    console.log('Assigned technician IDs:', assignedTechnicianIds);

    // Get all active technicians who are not assigned
    const availableTechnician = await User.findOne({
      role: 'technician',
      isActive: true,
      _id: { $nin: assignedTechnicianIds }
    }).select('username email mobile specialties rating');

    console.log('Available technician found:', availableTechnician ? availableTechnician.username : 'None');

    return availableTechnician;
  } catch (error) {
    console.error('Error finding available technician:', error);
    console.error('Error details:', error.message);
    return null;
  }
};

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      serviceId,
      scheduledDate,
      scheduledTime,
      address,
      description,
      urgency,
      paymentMethod,
      selectedPaymentMethod,
      cardDetails,
      selectedInventory
    } = req.body;

    // Validate required fields
    if (!serviceId || !scheduledDate || !scheduledTime || !address || !paymentMethod) {
      return res.status(400).json({
        message: 'Service, date, time, address, and payment method are required'
      });
    }

    // Check if service exists and is active
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if service is active - house owners cannot book inactive services
    if (!service.isActive) {
      return res.status(400).json({ message: 'This service is currently unavailable' });
    }

    // Calculate total cost including materials
    let materialsCost = 0;
    if (selectedInventory && selectedInventory.length > 0) {
      materialsCost = selectedInventory.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    }
    const totalCost = service.basePrice + materialsCost;

    // Create booking
    const booking = new Booking({
      houseOwner: req.user.id,
      service: serviceId,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      address,
      description: description || '',
      urgency: urgency || 'normal',
      paymentMethod,
      selectedPaymentMethod: selectedPaymentMethod || paymentMethod,
      cardDetails: cardDetails || null,
      status: 'pending',
      estimatedCost: totalCost,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      selectedInventory: selectedInventory || []
    });

    await booking.save();

    // Reduce inventory quantities for selected items
    if (selectedInventory && selectedInventory.length > 0) {
      console.log('🔧 Starting inventory reduction for booking:', booking._id);
      console.log('📦 Selected inventory items:', selectedInventory.length);
      
      const inventoryReduction = await reduceInventoryOnBooking(selectedInventory);
      
      console.log('📊 Inventory reduction result:', inventoryReduction);
      
      if (!inventoryReduction.success) {
        console.log('❌ Inventory reduction failed, deleting booking');
        // If inventory reduction failed, delete the booking and return error
        await Booking.findByIdAndDelete(booking._id);
        return res.status(400).json({
          message: 'Booking failed due to inventory issues',
          details: inventoryReduction.message,
          failedItems: inventoryReduction.failedItems || []
        });
      }
      
      console.log('✅ Inventory reduced successfully for booking:', booking._id);
    } else {
      console.log('ℹ️ No inventory items selected for booking:', booking._id);
    }

    // Populate service details
    await booking.populate('service', 'name category basePrice');

    // Create notification for admin
    try {
      // Find admin users
      const adminUsers = await User.find({ role: 'admin' });
      
      for (const admin of adminUsers) {
        const notification = new Notification({
          recipient: admin._id,
          type: 'booking_created',
          title: 'New Service Booking - Assign Technician',
          message: `${req.user.username} has booked ${service.name} for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}. Urgency: ${urgency}. Please assign a technician before accepting.`,
          relatedEntity: 'booking',
          entityId: booking._id,
          priority: urgency === 'high' ? 'high' : urgency === 'medium' ? 'medium' : 'low',
          actionRequired: true,
          isRead: false
        });
        
        await notification.save();

        // Emit real-time notification if socket.io is available
        if (req.app.get('io')) {
          const io = req.app.get('io');
          io.to(admin._id.toString()).emit('newNotification', {
            notification: await notification.populate('recipient', 'username email')
          });
        }

        // Credit card payments are not supported - only cash payments

        // Create cash payment notification (all payments are cash)
        const cashNotification = new Notification({
          recipient: admin._id,
          type: 'cash_payment',
          title: 'Cash Payment Expected',
          message: `Customer ${req.user.username} booked service for LKR ${booking.estimatedCost.toFixed(2)}. Collect cash when service is completed.`,
          relatedEntity: 'booking',
          entityId: booking._id,
          priority: 'medium',
          actionRequired: true,
          isRead: false,
          metadata: {
            paymentAmount: booking.estimatedCost,
            paymentMethod: 'cash',
            customerName: req.user.username,
            serviceDate: booking.scheduledDate,
            serviceTime: booking.scheduledTime
          }
        });
        
        await cashNotification.save();

        // Emit real-time notification for cash payment
        if (req.app.get('io')) {
          const io = req.app.get('io');
          io.to(admin._id.toString()).emit('newNotification', {
            notification: await cashNotification.populate('recipient', 'username email')
          });
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error during booking creation' });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings for the authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Filter by user role
    if (req.user.role === 'house_owner') {
      query.houseOwner = req.user.id;
    } else if (req.user.role === 'technician') {
      query.technician = req.user.id;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find(query)
      .populate('service', 'name category basePrice')
      .populate('houseOwner', 'username email mobile')
      .populate('technician', 'username email mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get a specific booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name category basePrice description')
      .populate('houseOwner', 'username email mobile address')
      .populate('technician', 'username email mobile specialties rating');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'technician' && booking.technician && booking.technician.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error while fetching booking' });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update a booking
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can update this booking
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates if booking is not completed or cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Cannot update completed or cancelled bookings' 
      });
    }

    const {
      scheduledDate,
      scheduledTime,
      address,
      description,
      urgency
    } = req.body;

    // Update fields
    if (scheduledDate) booking.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) booking.scheduledTime = scheduledTime;
    if (address) booking.address = address;
    if (description !== undefined) booking.description = description;
    if (urgency) booking.urgency = urgency;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error while updating booking' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, technicianNotes, completionNotes, rating, feedback } = req.body;
    
    console.log('Status update request:', {
      bookingId: req.params.id,
      newStatus: status,
      userRole: req.user.role,
      userId: req.user.id
    });
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    console.log('Current booking status:', booking.status);

    // Validate status transition
    const validTransitions = {
      pending: ['accepted', 'rejected', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      rejected: [],
      cancelled: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${booking.status} to ${status}` 
      });
    }

    // Update status and related fields
    booking.status = status;
    
    if (status === 'accepted') {
      // Only admin can accept bookings
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Only admin can accept bookings' 
        });
      }
      
      // Check if technician is assigned before accepting
      if (!booking.technician) {
        return res.status(400).json({ 
          message: 'Cannot accept booking without assigning a technician first' 
        });
      }
      
      // Send notification to assigned technician
      try {
        await booking.populate('technician', 'username email mobile');
        await sendTechnicianAssignmentNotification(booking, booking.technician);
        
        // Create notification for house owner with technician details
        const io = req.app.get('io');
        await createTechnicianAssignmentNotification(booking, booking.technician, req.user, io);
        if (io) {
          io.to(booking.technician._id.toString()).emit('notification', {
            type: 'booking_assigned',
            title: 'New Booking Assignment',
            message: `You have been assigned to ${booking.service?.name || 'a service'} on ${booking.scheduledDate.toLocaleDateString()}`,
            bookingId: booking._id,
            priority: booking.urgency === 'high' ? 'high' : 'medium'
          });
        }
      } catch (notificationError) {
        console.error('Failed to send technician notification or create announcement:', notificationError);
        // Don't fail the booking acceptance if notification fails
      }
      
      booking.acceptedAt = new Date();
    }
    
    if (status === 'in_progress') {
      booking.startedAt = new Date();
    }
    
    if (status === 'completed') {
      booking.completedAt = new Date();
      if (completionNotes) booking.completionNotes = completionNotes;
      if (rating) booking.rating = rating;
      if (feedback) booking.feedback = feedback;
      
      // Consume inventory items when booking is completed
      try {
        await consumeInventory(booking);
      } catch (error) {
        console.error('Error consuming inventory:', error);
        // Don't fail the booking completion if inventory consumption fails
        // but log the error for admin review
      }
      
      // Automatically create feedback for completed booking
      try {
        await createAutoFeedback(booking, completionNotes);
      } catch (error) {
        console.error('Error creating auto feedback:', error);
        // Don't fail the booking completion if feedback creation fails
      }
    }
    
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user.id;
      
      // Restore inventory quantities when booking is cancelled
      if (booking.selectedInventory && booking.selectedInventory.length > 0) {
        try {
          const inventoryRestoration = await restoreInventoryOnCancellation(booking.selectedInventory);
          if (inventoryRestoration.success) {
            console.log('Inventory restored successfully for cancelled booking:', booking._id);
          } else {
            console.error('Failed to restore inventory for cancelled booking:', inventoryRestoration.message);
            // Log error but don't fail the cancellation
          }
        } catch (error) {
          console.error('Error restoring inventory on cancellation:', error);
          // Don't fail the cancellation if inventory restoration fails
        }
      }
      
      // Send notification to technician if they were assigned
      if (booking.technician) {
        try {
          await sendBookingCancellationNotification(booking);
          
          // Send real-time notification via Socket.IO
          const io = req.app.get('io');
          if (io) {
            io.to(booking.technician.toString()).emit('notification', {
              type: 'booking_cancelled',
              title: 'Booking Cancelled',
              message: `A booking has been cancelled for ${booking.service?.name || 'a service'}`,
              bookingId: booking._id,
              priority: 'medium'
            });
          }
        } catch (notificationError) {
          console.error('Failed to send cancellation notification:', notificationError);
          // Don't fail the cancellation if notification fails
        }
      }
    }
    
    if (technicianNotes) booking.technicianNotes = technicianNotes;

    await booking.save();

    // Populate technician details if assigned
    if (booking.technician) {
      await booking.populate('technician', 'username email mobile');
    }

    console.log('Booking status updated successfully:', booking.status);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Update status error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error while updating status',
      error: error.message 
    });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can cancel this booking
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation if booking is pending or accepted
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking in current status' 
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
});

// @route   GET /api/bookings/available
// @desc    Get available bookings for technicians
// @access  Private (Technicians only)
router.get('/available', protect, async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const { category, page = 1, limit = 10 } = req.query;
    
    let query = { status: 'pending' };
    
    if (category) {
      query['service.category'] = category;
    }

    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find(query)
      .populate('service', 'name category basePrice description')
      .populate('houseOwner', 'username email mobile')
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get available bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching available bookings' });
  }
});

// @route   POST /api/bookings/:id/accept
// @desc    Accept a booking (for technicians)
// @access  Private (Technicians only)
router.post('/:id/accept', protect, async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not available for acceptance' });
    }

    // Check if technician is already assigned to another booking at the same time
    const conflictingBooking = await Booking.findOne({
      technician: req.user.id,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      status: { $in: ['accepted', 'in_progress'] }
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'You have another booking at the same time' 
      });
    }

    booking.status = 'accepted';
    booking.technician = req.user.id;
    booking.acceptedAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      booking
    });

  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({ message: 'Server error while accepting booking' });
  }
});

// @route   PUT /api/bookings/:id/assign-technician
// @desc    Assign technician to a booking (Admin only)
// @access  Private (Admin only)
router.put('/:id/assign-technician', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { technicianId } = req.body;
    
    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if technician exists and has technician role
    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({ message: 'Invalid technician' });
    }

    // Check if technician is already assigned to another booking at the same time
    const conflictingBooking = await Booking.findOne({
      technician: technicianId,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      status: { $in: ['accepted', 'in_progress'] },
      _id: { $ne: booking._id }
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'Technician is already assigned to another booking at the same time' 
      });
    }

    // Assign technician but keep status as pending
    booking.technician = technicianId;
    // Status remains 'pending' until explicitly accepted

    await booking.save();

    // Create notification for assigned technician
    try {
      const notification = new Notification({
        recipient: technicianId,
        type: 'booking_assigned',
        title: 'New Service Assignment - Pending Acceptance',
        message: `You have been assigned to ${booking.service.name} on ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledTime}. Address: ${booking.address}. Please accept this booking to confirm your assignment.`,
        relatedEntity: 'booking',
        entityId: booking._id,
        priority: booking.urgency === 'high' ? 'high' : booking.urgency === 'medium' ? 'medium' : 'low',
        actionRequired: true,
        isRead: false
      });
      
      await notification.save();

      // Create notification for house owner with technician details
      const io = req.app.get('io');
      await createTechnicianAssignmentNotification(booking, technician, req.user, io);

      // Emit real-time notification if socket.io is available
      if (io) {
        io.to(technicianId.toString()).emit('newNotification', {
          notification: await notification.populate('recipient', 'username email')
        });
      }
    } catch (notificationError) {
      console.error('Error creating notification or announcement:', notificationError);
      // Don't fail the assignment if notification fails
    }

    // Populate the updated booking
    await booking.populate('technician', 'username email mobile');

    res.json({
      success: true,
      message: 'Technician assigned successfully. Booking remains pending until technician accepts.',
      booking
    });

  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({ message: 'Server error while assigning technician' });
  }
});

// @route   PUT /api/bookings/:id/payment-status
// @desc    Update payment status for a booking
// @access  Private
router.put('/:id/payment-status', protect, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to update this booking's payment status
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate payment status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        message: 'Invalid payment status' 
      });
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error while updating payment status' });
  }
});

// @route   GET /api/bookings/technicians/available
// @desc    Get available technicians for a specific date and time
// @access  Private (Admin only)
router.get('/technicians/available', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { date, time } = req.query;
    
    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    // Find technicians who are not assigned to any booking at the specified time
    const conflictingBookings = await Booking.find({
      scheduledDate: new Date(date),
      scheduledTime: time,
      status: { $in: ['accepted', 'in_progress'] }
    }).select('technician');

    const assignedTechnicianIds = conflictingBookings
      .map(booking => booking.technician)
      .filter(id => id);

    // Get all active technicians who are not assigned
    const availableTechnicians = await User.find({
      role: 'technician',
      isActive: true,
      _id: { $nin: assignedTechnicianIds }
    }).select('username email mobile specialties rating');

    res.json({
      success: true,
      technicians: availableTechnicians
    });

  } catch (error) {
    console.error('Get available technicians error:', error);
    res.status(500).json({ message: 'Server error while fetching available technicians' });
  }
});

// @route   GET /api/bookings/admin/pending
// @desc    Get all pending bookings for admin management
// @access  Private (Admin only)
router.get('/admin/pending', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find({ status: 'pending' })
      .populate('service', 'name category basePrice')
      .populate('houseOwner', 'username email mobile')
      .populate('technician', 'username email mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching pending bookings' });
  }
});

module.exports = router;
