const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Address sub-schema
const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'India'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  instructions: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isGoogleUser;
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    required: function() {
      return !this.isGoogleUser;
    },
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['admin', 'technician', 'house_owner'],
    default: 'house_owner'
  },
  // Additional profile fields
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  bio: {
    type: String,
    maxlength: 500
  },
  specialties: [{
    type: String,
    trim: true
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isMobileVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: String,
  mobileVerificationCode: String,
  verificationCodeExpiry: Date,
  profilePicture: {
    type: String,
    default: ''
  },
  // Multiple addresses support
  addresses: [addressSchema],
  // Legacy single address field (for backward compatibility)
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Password reset fields
  passwordResetCode: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate verification codes
userSchema.methods.generateVerificationCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Method to check if verification code is expired
userSchema.methods.isVerificationCodeExpired = function() {
  if (!this.verificationCodeExpiry) return true;
  return Date.now() > this.verificationCodeExpiry;
};

// Method to generate password reset code
userSchema.methods.generatePasswordResetCode = function() {
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set the code and expiry time (10 minutes)
  this.passwordResetCode = resetCode;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetCode;
};

// Method to check if password reset code is expired
userSchema.methods.isPasswordResetCodeExpired = function() {
  if (!this.passwordResetExpires) return true;
  return Date.now() > this.passwordResetExpires;
};

module.exports = mongoose.model('User', userSchema);
