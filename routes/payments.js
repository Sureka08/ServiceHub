const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const stripe = require('../config/stripe');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   POST /api/payments/create-payment-intent
// @desc    Create a payment intent for Stripe
// @access  Private
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({
        message: 'Payment gateway not available. Please use cash payment.'
      });
    }

    const { bookingId, amount, currency = 'lkr' } = req.body;

    // Validate required fields
    if (!bookingId || !amount) {
      return res.status(400).json({
        message: 'Booking ID and amount are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('houseOwner', 'username email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.houseOwner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking is in a valid state for payment
    if (!['pending', 'accepted', 'in_progress'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Booking is not in a valid state for payment' 
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: bookingId,
        userId: req.user.id,
        serviceName: booking.service?.name || 'Service'
      },
      description: `Payment for booking ${bookingId}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      message: 'Error creating payment intent',
      error: error.message 
    });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update booking status
// @access  Private
router.post('/confirm-payment', protect, async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({
        message: 'Payment gateway not available. Please use cash payment.'
      });
    }

    const { paymentIntentId, bookingId } = req.body;

    // Validate required fields
    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        message: 'Payment intent ID and booking ID are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('houseOwner service');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.houseOwner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      // Update booking payment status
      booking.paymentStatus = 'paid';
      booking.paymentMethod = 'credit_card';
      booking.paymentCompletedAt = new Date();
      booking.stripePaymentIntentId = paymentIntentId;
      
      await booking.save();

      // Create notification for admin
      try {
        const adminUsers = await User.find({ role: 'admin' });
        
        for (const admin of adminUsers) {
          const notification = new Notification({
            recipient: admin._id,
            type: 'payment_received',
            title: 'Payment Received',
            message: `Payment of LKR ${(paymentIntent.amount / 100).toFixed(2)} received for booking ${bookingId} from ${booking.houseOwner.username}`,
            relatedEntity: 'booking',
            entityId: booking._id,
            priority: 'medium',
            actionRequired: false,
            isRead: false,
            metadata: {
              paymentAmount: paymentIntent.amount,
              paymentMethod: 'credit_card',
              stripePaymentIntentId: paymentIntentId
            }
          });
          
          await notification.save();

          // Emit real-time notification
          if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(admin._id.toString()).emit('newNotification', {
              notification: await notification.populate('recipient', 'username email')
            });
          }
        }
      } catch (notificationError) {
        console.error('Error creating payment notification:', notificationError);
      }

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        paymentStatus: 'succeeded',
        booking: booking
      });

    } else if (paymentIntent.status === 'requires_payment_method') {
      res.status(400).json({
        message: 'Payment requires a valid payment method',
        paymentStatus: 'requires_payment_method'
      });
    } else if (paymentIntent.status === 'requires_confirmation') {
      res.status(400).json({
        message: 'Payment requires confirmation',
        paymentStatus: 'requires_confirmation'
      });
    } else {
      res.status(400).json({
        message: 'Payment failed',
        paymentStatus: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      message: 'Error confirming payment',
      error: error.message 
    });
  }
});

// @route   GET /api/payments/payment-status/:bookingId
// @desc    Get payment status for a booking
// @access  Private
router.get('/payment-status/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.houseOwner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let paymentStatus = null;
    
    // If there's a Stripe payment intent, get its status
    if (booking.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
        paymentStatus = {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created
        };
      } catch (stripeError) {
        console.error('Error retrieving payment intent:', stripeError);
      }
    }

    res.json({
      bookingId: bookingId,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      paymentCompletedAt: booking.paymentCompletedAt,
      stripePaymentStatus: paymentStatus
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ 
      message: 'Error retrieving payment status',
      error: error.message 
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public (but verified with webhook secret)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({
      message: 'Payment gateway not available'
    });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update booking payment status
      try {
        const booking = await Booking.findOne({ 
          stripePaymentIntentId: paymentIntent.id 
        });
        
        if (booking) {
          booking.paymentStatus = 'paid';
          booking.paymentCompletedAt = new Date();
          await booking.save();
          
          console.log('Booking payment status updated:', booking._id);
        }
      } catch (error) {
        console.error('Error updating booking payment status:', error);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      // Update booking payment status
      try {
        const booking = await Booking.findOne({ 
          stripePaymentIntentId: failedPayment.id 
        });
        
        if (booking) {
          booking.paymentStatus = 'failed';
          await booking.save();
          
          console.log('Booking payment status updated to failed:', booking._id);
        }
      } catch (error) {
        console.error('Error updating booking payment status:', error);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// @route   POST /api/payments/confirm-cash-payment
// @desc    Confirm cash payment collection
// @access  Private (Admin only)
router.post('/confirm-cash-payment', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { bookingId, collectedAmount, notes } = req.body;

    // Validate required fields
    if (!bookingId || !collectedAmount) {
      return res.status(400).json({
        message: 'Booking ID and collected amount are required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('houseOwner service');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is in a valid state for cash payment
    if (!['accepted', 'in_progress', 'completed'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Booking is not in a valid state for cash payment collection' 
      });
    }

    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'cash';
    booking.paymentCompletedAt = new Date();
    booking.cashPaymentDetails = {
      collectedAmount: collectedAmount,
      collectedAt: new Date(),
      collectedBy: req.user.id,
      notes: notes || ''
    };
    
    await booking.save();

    // Create notification for customer
    try {
      const customerNotification = new Notification({
        recipient: booking.houseOwner._id,
        type: 'payment_confirmed',
        title: 'Cash Payment Confirmed',
        message: `Your cash payment of LKR ${collectedAmount.toFixed(2)} has been confirmed for booking ${bookingId}. Thank you for your payment!`,
        relatedEntity: 'booking',
        entityId: booking._id,
        priority: 'low',
        actionRequired: false,
        isRead: false,
        metadata: {
          paymentAmount: collectedAmount,
          paymentMethod: 'cash',
          confirmedBy: req.user.username
        }
      });
      
      await customerNotification.save();

      // Emit real-time notification to customer
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(booking.houseOwner._id.toString()).emit('newNotification', {
          notification: await customerNotification.populate('recipient', 'username email')
        });
      }
    } catch (notificationError) {
      console.error('Error creating customer notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Cash payment confirmed successfully',
      booking: booking
    });

  } catch (error) {
    console.error('Cash payment confirmation error:', error);
    res.status(500).json({ 
      message: 'Error confirming cash payment',
      error: error.message 
    });
  }
});

// @route   GET /api/payments/cash-payments
// @desc    Get all pending cash payments
// @access  Private (Admin only)
router.get('/cash-payments', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status = 'pending' } = req.query;

    // Find bookings with cash payments
    const query = {
      paymentMethod: 'cash',
      paymentStatus: status
    };

    const bookings = await Booking.find(query)
      .populate('houseOwner', 'username email mobile')
      .populate('service', 'name category basePrice')
      .populate('technician', 'username email mobile')
      .sort({ createdAt: -1 });

    // Calculate total pending cash amount
    const totalPendingAmount = bookings.reduce((sum, booking) => {
      return sum + (booking.estimatedCost || 0);
    }, 0);

    res.json({
      success: true,
      bookings: bookings,
      totalPendingAmount: totalPendingAmount,
      count: bookings.length
    });

  } catch (error) {
    console.error('Error fetching cash payments:', error);
    res.status(500).json({ 
      message: 'Error fetching cash payments',
      error: error.message 
    });
  }
});

module.exports = router;
