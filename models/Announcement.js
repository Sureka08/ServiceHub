const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['general', 'offer', 'maintenance', 'feedback', 'festival', 'urgent'],
    default: 'general'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'customers', 'technicians', 'admins'],
    default: 'all'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: function() {
      return this.type === 'offer' || this.type === 'festival';
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // For feedback-related announcements
  relatedFeedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  // For offer announcements
  offerDetails: {
    discount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    validServices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }],
    minOrderValue: Number
  }
}, {
  timestamps: true
});

// Indexes for better query performance
announcementSchema.index({ targetAudience: 1, isActive: 1, startDate: 1, endDate: 1 });
announcementSchema.index({ type: 1, priority: 1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for announcement status
announcementSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isActive) return 'inactive';
  if (this.endDate && now > this.endDate) return 'expired';
  if (now < this.startDate) return 'scheduled';
  return 'active';
});

// Method to mark as read by user
announcementSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if user has read this announcement
announcementSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Static method to get active announcements for user
announcementSchema.statics.getActiveForUser = function(userRole, userId) {
  const now = new Date();
  const query = {
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: now } }
    ]
  };

  // Filter by target audience
  if (userRole === 'house_owner') {
    query.targetAudience = { $in: ['all', 'customers'] };
  } else if (userRole === 'technician') {
    query.targetAudience = { $in: ['all', 'technicians'] };
  } else if (userRole === 'admin') {
    query.targetAudience = { $in: ['all', 'admins'] };
  }

  return this.find(query)
    .populate('createdBy', 'username email')
    .populate('relatedFeedback')
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to get announcement statistics
announcementSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [
              {
                $and: [
                  '$isActive',
                  { $lte: ['$startDate', new Date()] },
                  {
                    $or: [
                      { $not: '$endDate' },
                      { $gt: ['$endDate', new Date()] }
                    ]
                  }
                ]
              },
              1,
              0
            ]
          }
        },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Announcement', announcementSchema);