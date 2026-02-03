const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/Token');
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationCodeEmail } = require('../utils/email');

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security reasons
      return res.status(200).json({
        success: true,
        message: 'If a user with this email exists, a password reset link has been sent'
      });
    }

    // Delete old verification codes for this email
    await VerificationCode.deleteMany({ 
      email, 
      type: 'password_reset' 
    });

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save verification code to database
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 15);

    await new VerificationCode({
      email,
      code,
      type: 'password_reset',
      expires_at: codeExpiry
    }).save();

    // Send verification code email
    const emailSent = await sendVerificationCodeEmail(email, code, 'password_reset');
    
    if (!emailSent) {
      console.error('Failed to send verification code email');
      // Continue anyway as the verification code is saved in the database
    }

    res.status(200).json({
      success: true,
      message: 'If a user with this email exists, a verification code has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
      error: error.message
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code and password are required'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if there are too many failed attempts
    const recentFailedAttempts = await VerificationCode.countDocuments({
      email,
      type: 'password_reset',
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
    });

    if (recentFailedAttempts > 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please try again later.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find verification code
    const verificationCodeRecord = await VerificationCode.findOne({
      email,
      code,
      type: 'password_reset'
    });

    if (!verificationCodeRecord || verificationCodeRecord.isExpired()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Update password
    user.password = password;
    await user.save();

    // Delete verification code
    await VerificationCode.deleteOne({ _id: verificationCodeRecord._id });

    // Delete all refresh tokens for this user (force re-login)
    await Token.deleteMany({ user_id: user._id, type: 'refresh' });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: error.message
    });
  }
});

module.exports = router;
