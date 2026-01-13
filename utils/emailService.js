const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Only create transporter if email credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  // Send verification email
  async sendVerificationEmail(email, username, verificationCode) {
    // Check if email service is configured
    if (!this.transporter) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 EMAIL SERVICE NOT CONFIGURED');
      console.log('='.repeat(60));
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Username: ${username}`);
      console.log(`🔐 Verification Code: ${verificationCode}`);
      console.log('⏰ Code expires in 10 minutes');
      console.log('💡 To enable real emails, configure Gmail credentials in .env file');
      console.log('='.repeat(60) + '\n');
      return true; // Return true to avoid blocking registration
    }

    const mailOptions = {
      from: `"Service Booking App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - Service Booking App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Service Booking App</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Hello ${username}!</h2>
            <p>Thank you for registering with our Service Booking App. To complete your registration, please use the verification code below:</p>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
            <p>Best regards,<br>Service Booking Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, username, resetCode) {
    // Check if email service is configured
    if (!this.transporter) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 PASSWORD RESET EMAIL NOT CONFIGURED');
      console.log('='.repeat(60));
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Username: ${username}`);
      console.log(`🔐 Reset Code: ${resetCode}`);
      console.log('⏰ Code expires in 10 minutes');
      console.log('💡 To enable real emails, configure Gmail credentials in .env file');
      console.log('='.repeat(60) + '\n');
      return true; // Return true to avoid blocking password reset
    }
    
    const mailOptions = {
      from: `"Service Booking App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Code - Service Booking App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset Code</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Hello ${username}!</h2>
            <p>You requested a password reset for your Service Booking App account. Use the verification code below to reset your password:</p>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${resetCode}</h1>
            </div>
            <p>Enter this code in the password reset form to create your new password.</p>
            <p>This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email.</p>
            <p>Best regards,<br>Service Booking Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  // Send booking confirmation email
  async sendBookingConfirmation(email, username, bookingDetails) {
    const mailOptions = {
      from: `"Service Booking App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Booking Confirmation - Service Booking App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Hello ${username}!</h2>
            <p>Your service booking has been confirmed. Here are the details:</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">Service Details</h3>
              <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
              <p><strong>Date:</strong> ${new Date(bookingDetails.scheduledDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${bookingDetails.scheduledTime}</p>
              <p><strong>Address:</strong> ${bookingDetails.address}</p>
              <p><strong>Total Amount:</strong> $${bookingDetails.totalAmount}</p>
            </div>
            <p>We'll notify you once a technician is assigned to your booking.</p>
            <p>Best regards,<br>Service Booking Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  // Send login verification email
  async sendLoginVerificationEmail(email, username, verificationCode) {
    // Check if email service is configured
    if (!this.transporter) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 LOGIN VERIFICATION EMAIL NOT CONFIGURED');
      console.log('='.repeat(60));
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Username: ${username}`);
      console.log(`🔐 Verification Code: ${verificationCode}`);
      console.log('⏰ Code expires in 10 minutes');
      console.log('💡 To enable real emails, configure Gmail credentials in .env file');
      console.log('='.repeat(60) + '\n');
      return true; // Return true to avoid blocking login
    }

    const mailOptions = {
      from: `"Service Booking App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Login Verification Code - Service Booking App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Login Verification</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Hello ${username}!</h2>
            <p>You are logging into your Service Booking App account. To complete the login process, please use the verification code below:</p>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 10 minutes. If you didn't request this login, please ignore this email and secure your account.</p>
            <p>Best regards,<br>Service Booking Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  // Send notification email
  async sendNotificationEmail(email, username, notification) {
    const mailOptions = {
      from: `"Service Booking App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Notification</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Hello ${username}!</h2>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">${notification.title}</h3>
              <p>${notification.message}</p>
            </div>
            <p>Best regards,<br>Service Booking Team</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
