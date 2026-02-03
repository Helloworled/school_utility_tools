const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/Token');
const VerificationCode = require('../models/VerificationCode');
const jwt = require('../utils/jwt');
const { sendVerificationCodeEmail } = require('../utils/email');

// Send verification code
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email, type } = req.body;

    // Validate input
    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: 'Email and type are required'
      });
    }

    // Validate type
    if (!['login', 'password_reset'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "login" or "password_reset"'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security reasons
      return res.status(200).json({
        success: true,
        message: 'If a user with this email exists, a verification code has been sent'
      });
    }

    // Delete old verification codes for this email and type
    await VerificationCode.deleteMany({ 
      email, 
      type 
    });

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save verification code to database
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 15);

    await new VerificationCode({
      email,
      code,
      type,
      expires_at: codeExpiry
    }).save();

    // Send verification code email
    const emailSent = await sendVerificationCodeEmail(email, code, type);
    
    if (!emailSent) {
      console.error('Failed to send verification code email');
      // Continue anyway as the verification code is saved in the database
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to email'
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending verification code',
      error: error.message
    });
  }
});

// Email login
router.post('/email-login', async (req, res) => {
  try {
    const { email, code, rememberMe } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Check if there are too many failed attempts
    const recentFailedAttempts = await VerificationCode.countDocuments({
      email,
      type: 'login',
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
        message: 'Invalid email or verification code'
      });
    }

    // Find verification code
    const verificationCodeRecord = await VerificationCode.findOne({
      email,
      code,
      type: 'login'
    });

    if (!verificationCodeRecord || verificationCodeRecord.isExpired()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Delete verification code after use
    await VerificationCode.deleteOne({ _id: verificationCodeRecord._id });

    // Generate tokens
    const accessToken = jwt.generateAccessToken(user._id);
    const refreshToken = jwt.generateRefreshToken(user._id);

    // Save refresh token to database
    const refreshTokenExpiry = new Date();
    const expiryDays = rememberMe ? 30 : 7;
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + expiryDays);

    await new Token({
      user_id: user._id,
      token: refreshToken,
      type: 'refresh',
      expires_at: refreshTokenExpiry
    }).save();

    // Return user data and tokens
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          user_name: user.user_name,
          email: user.email,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email login',
      error: error.message
    });
  }
});

module.exports = router;
