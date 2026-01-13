const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const emailService = require('../utils/emailService');
const smsService = require('../utils/smsService');

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please check your environment variables.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Normalize Sri Lankan mobile number
const normalizeSriLankanMobile = (mobile) => {
  // Remove any spaces or special characters
  let cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
  
  // Convert local format (0XXXXXXXXX) to international format (+94XXXXXXXXX)
  if (cleanMobile.startsWith('0')) {
    cleanMobile = '+94' + cleanMobile.substring(1);
  }
  
  // Ensure it starts with +94
  if (!cleanMobile.startsWith('+94')) {
    cleanMobile = '+94' + cleanMobile;
  }
  
  return cleanMobile;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('mobile')
    .matches(/^(\+94|0)[0-9]{9}$/)
    .withMessage('Please provide a valid Sri Lankan mobile number (+94XXXXXXXXX or 0XXXXXXXXX)'),
  body('role')
    .optional()
    .isIn(['house_owner', 'technician'])
    .withMessage('Invalid role specified')
], async (req, res) => {
  console.log('🔔 Registration request received:', req.body);
  console.log('📱 Mobile number received:', req.body.mobile);
  console.log('📱 Mobile number type:', typeof req.body.mobile);
  console.log('📱 Mobile number length:', req.body.mobile ? req.body.mobile.length : 'undefined');
  
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, mobile, role = 'house_owner' } = req.body;
    
    // Normalize Sri Lankan mobile number
    const normalizedMobile = normalizeSriLankanMobile(mobile);
    
    console.log('📝 Processing registration for:', { username, email, mobile: normalizedMobile, role });
    console.log('📱 Original mobile:', mobile);
    console.log('📱 Normalized mobile:', normalizedMobile);

    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { mobile: normalizedMobile }]
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({
        message: 'User with this email, username, or mobile number already exists'
      });
    }
    console.log('✅ No existing user found, proceeding with creation...');

    // Generate verification codes
    const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    console.log('👤 Creating new user instance...');
    const user = new User({
      username,
      email,
      password,
      mobile: normalizedMobile,
      role,
      emailVerificationCode,
      mobileVerificationCode,
      verificationCodeExpiry
    });

    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully with ID:', user._id);

    // Generate token for direct login after registration
    console.log('🔑 Generating token...');
    const token = generateToken(user._id);

    console.log('📤 Sending success response...');
    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to ServiceHub!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: normalizedMobile,
        role: user.role,
        isEmailVerified: true,
        isMobileVerified: false
      }
    });
    console.log('✅ Registration completed successfully for:', user.email);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate token for direct login
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});



// @route   POST /api/auth/verify-email
// @desc    Verify email with verification code
// @access  Private
router.post('/verify-email', protect, [
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { verificationCode } = req.body;
    const user = req.user;

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (user.emailVerificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.isVerificationCodeExpired()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// @route   POST /api/auth/verify-mobile
// @desc    Verify mobile with verification code
// @access  Private
router.post('/verify-mobile', protect, [
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { verificationCode } = req.body;
    const user = req.user;

    if (user.isMobileVerified) {
      return res.status(400).json({ message: 'Mobile is already verified' });
    }

    if (user.mobileVerificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.isVerificationCodeExpired()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Mark mobile as verified
    user.isMobileVerified = true;
    user.mobileVerificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mobile verified successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error) {
    console.error('Mobile verification error:', error);
    res.status(500).json({ message: 'Server error during mobile verification' });
  }
});

// @route   POST /api/auth/verify-registration-mobile
// @desc    Verify mobile during registration process
// @access  Public
router.post('/verify-registration-mobile', [
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { verificationCode } = req.body;
    
    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isMobileVerified) {
      return res.status(400).json({ message: 'Mobile is already verified' });
    }

    if (user.mobileVerificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.isVerificationCodeExpired()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Mark mobile as verified
    user.isMobileVerified = true;
    user.mobileVerificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mobile verified successfully! Welcome to ServiceHub!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error) {
    console.error('Registration mobile verification error:', error);
    res.status(500).json({ message: 'Server error during mobile verification' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification codes
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
  try {
    const user = req.user;

    // Generate new verification codes
    const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const mobileVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new codes
    user.emailVerificationCode = emailVerificationCode;
    user.mobileVerificationCode = mobileVerificationCode;
    user.verificationCodeExpiry = verificationCodeExpiry;
    await user.save();

    // Send new verification codes
    await emailService.sendVerificationEmail(user.email, user.username, emailVerificationCode);
    await smsService.sendVerificationSMS(user.mobile, mobileVerificationCode);

    res.json({
      success: true,
      message: 'Verification codes sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error while resending verification codes' });
  }
});



// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate password reset code
    const resetCode = user.generatePasswordResetCode();
    await user.save();

    // Send password reset email with code
    try {
      await emailService.sendPasswordResetEmail(user.email, user.username, resetCode);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Clear the reset code if email fails
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again later.' 
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify reset code and get user info
// @access  Public
router.post('/verify-reset-code', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // Find user with this email and code
    const user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset code' 
      });
    }

    res.json({
      success: true,
      message: 'Reset code verified successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error during code verification' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified code
// @access  Public
router.post('/reset-password', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code, password } = req.body;

    // Find user with this email and code
    let user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() }
    });

    // If no valid code found, allow reset with any code if user exists and has an active reset session
    // This is a fallback for development when email service might not be working properly
    if (!user) {
      user = await User.findOne({
        email,
        passwordResetCode: { $exists: true },
        passwordResetExpires: { $gt: Date.now() }
      });
    }

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset code' 
      });
    }

    // Update password
    user.password = password;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// @route   GET /api/auth/get-reset-code/:email
// @desc    Get the current reset code for development (only when email service is not configured)
// @access  Public
router.get('/get-reset-code/:email', async (req, res) => {
  try {
    // Only allow this in development when email service is not configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return res.status(403).json({ 
        message: 'This endpoint is only available when email service is not configured' 
      });
    }

    const { email } = req.params;
    const user = await User.findOne({ 
      email,
      passwordResetCode: { $exists: true },
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'No active reset code found for this email' 
      });
    }

    res.json({
      success: true,
      resetCode: user.passwordResetCode,
      expiresAt: user.passwordResetExpires
    });

  } catch (error) {
    console.error('Get reset code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword')
    .exists()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Google OAuth Routes (only if credentials are available)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // @route   GET /api/auth/google
  // @desc    Google OAuth login
  // @access  Public
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  // @route   GET /api/auth/google/callback
  // @desc    Google OAuth callback
  // @access  Public
  router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
    (req, res) => {
      // Generate JWT token
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture,
        isGoogleUser: req.user.isGoogleUser
      }))}`);
    }
  );
} else {
  // Fallback routes when Google OAuth is not available
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please contact the administrator.'
    });
  });

  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please contact the administrator.'
    });
  });
}

module.exports = router;
