const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  houseOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  address: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  urgency: {
    type: String,
    enum: ['normal', 'medium', 'high'],
    default: 'normal'
  },
  budget: {
    type: Number,
    min: 0
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  technicianNotes: String,
  completionNotes: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  selectedInventory: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    unit: {
      type: String
    },
    image: {
      type: String
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card'],
    default: 'cash'
  },
  selectedPaymentMethod: {
    type: String,
    enum: ['cash', 'credit_card'],
    default: 'cash'
  },
  cardDetails: {
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    cardholderName: String
  },
  stripePaymentIntentId: String,
  paymentCompletedAt: Date,
  cashPaymentDetails: {
    collectedAmount: Number,
    collectedAt: Date,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ houseOwner: 1, status: 1 });
bookingSchema.index({ technician: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: 1 });

// Virtual for formatted scheduled date
bookingSchema.virtual('formattedScheduledDate').get(function() {
  return this.scheduledDate.toLocaleDateString();
});

// Virtual for formatted scheduled time
bookingSchema.virtual('formattedScheduledTime').get(function() {
  return this.scheduledTime;
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const scheduledDateTime = new Date(this.scheduledDate);
  const timeDiff = scheduledDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  return hoursDiff > 2 && ['pending', 'accepted'].includes(this.status);
};

// Method to check if booking can be edited
bookingSchema.methods.canBeEdited = function() {
  return ['pending', 'accepted'].includes(this.status);
};

module.exports = mongoose.model('Booking', bookingSchema);













