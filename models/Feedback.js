const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  houseOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  categories: [{
    category: {
      type: String,
      enum: ['quality', 'punctuality', 'communication', 'cleanliness', 'professionalism', 'value_for_money']
    },
    rating: {
      type: Number,
      // Allow category ratings to be optional or zero; overall rating is validated separately
      min: 0,
      max: 5
    }
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  adminResponse: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
feedbackSchema.index({ technician: 1, rating: 1 });
feedbackSchema.index({ service: 1, rating: 1 });
feedbackSchema.index({ houseOwner: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });

// Virtual for average category rating
feedbackSchema.virtual('averageCategoryRating').get(function() {
  if (!this.categories || this.categories.length === 0) return this.rating;
  
  const total = this.categories.reduce((sum, cat) => sum + cat.rating, 0);
  return (total / this.categories.length).toFixed(1);
});

// Virtual for feedback age
feedbackSchema.virtual('age').get(function() {
  const now = new Date();
  const ageInMs = now.getTime() - this.createdAt.getTime();
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  
  if (ageInDays === 0) return 'Today';
  if (ageInDays === 1) return 'Yesterday';
  if (ageInDays < 7) return `${ageInDays} days ago`;
  if (ageInDays < 30) return `${Math.floor(ageInDays / 7)} weeks ago`;
  return `${Math.floor(ageInDays / 30)} months ago`;
});

// Method to check if feedback can be edited
feedbackSchema.methods.canBeEdited = function() {
  const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation < 24; // Can edit within 24 hours
};

// Method to mark as helpful
feedbackSchema.methods.markAsHelpful = function() {
  this.helpfulCount += 1;
  return this.save();
};

// Method to report feedback
feedbackSchema.methods.report = function() {
  this.reportedCount += 1;
  if (this.reportedCount >= 5) {
    this.status = 'hidden';
  }
  return this.save();
};

// Static method to get average rating for technician
feedbackSchema.statics.getTechnicianAverageRating = function(technicianId) {
  return this.aggregate([
    { $match: { technician: technicianId, status: 'approved' } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalFeedbacks: { $sum: 1 } } }
  ]);
};

// Static method to get feedback statistics
feedbackSchema.statics.getFeedbackStats = function() {
  return this.aggregate([
    { $match: { status: 'approved' } },
    { $group: { 
      _id: null, 
      totalFeedbacks: { $sum: 1 },
      avgRating: { $avg: '$rating' },
      ratingDistribution: {
        $push: '$rating'
      }
    } }
  ]);
};

module.exports = mongoose.model('Feedback', feedbackSchema);
