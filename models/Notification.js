const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['booking_created', 'booking_assigned', 'booking_started', 'booking_completed', 'booking_cancelled', 'feedback_received', 'feedback_assigned', 'feedback_reply', 'announcement', 'inventory_alert', 'payment_reminder']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedEntity: {
    type: String,
    enum: ['booking', 'feedback', 'inventory', 'user', 'service'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: String,
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const ageInMs = now.getTime() - this.createdAt.getTime();
  const ageInMinutes = Math.floor(ageInMs / (1000 * 60));
  
  if (ageInMinutes < 60) {
    return `${ageInMinutes} minute${ageInMinutes !== 1 ? 's' : ''} ago`;
  } else if (ageInMinutes < 1440) {
    const ageInHours = Math.floor(ageInMinutes / 60);
    return `${ageInHours} hour${ageInHours !== 1 ? 's' : ''} ago`;
  } else {
    const ageInDays = Math.floor(ageInMinutes / 1440);
    return `${ageInDays} day${ageInDays !== 1 ? 's' : ''} ago`;
  }
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to check if notification is expired
notificationSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create({
    recipient: data.recipient,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedEntity: data.relatedEntity,
    entityId: data.entityId,
    priority: data.priority || 'medium',
    actionRequired: data.actionRequired || false,
    actionUrl: data.actionUrl,
    expiresAt: data.expiresAt
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
