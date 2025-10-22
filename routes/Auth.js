const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email Transporter Configuration (reuse from UserRoutes pattern)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Google Authentication route
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error('No email provided from Google');
    }
    
    // Check if user exists
    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
      // Create new user with Google profile picture
      user = await User.create({
        email: payload.email,
        firstName: payload.given_name || 'User',
        lastName: payload.family_name || '',
        googleId: payload.sub,
        avatar: payload.picture || '', // Add Google profile picture
        isVerified: true, // Google users are verified by default
        verified: payload.email_verified || true,
        isEmailVerified: true, // Google email is pre-verified
        isPhoneVerified: false, // Phone not provided by Google
        role: 'user'
      });
    } else {
      // Update existing Google user
      let needsUpdate = false;
      
      // Update avatar if not present
      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
        needsUpdate = true;
      }
      
      // Ensure Google users have proper verification flags
      if (user.isEmailVerified === undefined || user.isEmailVerified === false) {
        user.isEmailVerified = true; // Google email is verified
        needsUpdate = true;
      }
      
      if (user.isPhoneVerified === undefined) {
        user.isPhoneVerified = false; // Phone not provided by Google
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
      }
    }
    
    // Generate JWT token (exclude avatar from JWT to avoid large headers)
    const token = jwt.sign(
      { 
        user: { 
          id: user._id, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || "user",
          isVerified: user.isVerified
        } 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar || '',
        isVerified: user.isVerified,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        role: user.role || "user"
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Google authentication failed' 
    });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    
    // Set token expiration (15 minutes)
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Remove any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });

    // Save reset token
    await PasswordReset.create({
      email: user.email,
      resetToken: hashedToken,
      tokenExpires,
      userId: user._id
    });

    // Create reset URL (adjust based on your frontend URL)
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send reset email
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetURL}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link expires in 15 minutes.<br>
            If you didn't request this password reset, please ignore this email.
          </p>
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${resetURL}
          </p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Validate required fields
    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, email, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find the reset token
    const resetRecord = await PasswordReset.findOne({ 
      email,
      tokenExpires: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Verify the token
    const isValidToken = await bcrypt.compare(token, resetRecord.resetToken);
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Find the user
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Delete the used reset token
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    // Send confirmation email
    try {
      await transporter.sendMail({
        to: email,
        subject: 'Password Reset Successful',
        text: `Your password has been successfully reset. If you didn't make this change, please contact support immediately.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <p>You can now log in with your new password.</p>
            <p style="color: #666; font-size: 14px;">
              If you didn't make this change, please contact support immediately.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Don't fail the password reset if confirmation email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cleanup expired password reset tokens (runs every hour)
setInterval(async () => {
  try {
    const result = await PasswordReset.deleteMany({
      tokenExpires: { $lt: new Date() }
    });
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} expired password reset tokens`);
    }
  } catch (error) {
    console.error("Error cleaning up expired password reset tokens:", error);
  }
}, 60 * 60 * 1000); // Run every hour

module.exports = router;