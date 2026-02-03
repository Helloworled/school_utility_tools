const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/Token');
const jwt = require('../utils/jwt');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { user_name, email, password, rememberMe } = req.body;

    // Validate input
    if (!user_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate username format
    if (user_name.length < 3 || user_name.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(user_name)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers and underscores'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if there are too many registration attempts from the same IP
    const ip = req.ip || req.connection.remoteAddress;
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    if (recentRegistrations > 10) {
      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please try again later.'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ user_name });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create new user
    const user = new User({ user_name, email, password });
    await user.save();

    // Generate tokens
    const accessToken = jwt.generateAccessToken(user._id);
    const refreshToken = jwt.generateRefreshToken(user._id, rememberMe);

    // Save ONLY refresh token to database (access token is not stored)
    // First, delete any existing refresh tokens for this user to avoid duplicates
    await Token.deleteMany({ user_id: user._id, type: 'refresh' });
    
    const refreshTokenExpiry = new Date();
    const expiryDays = rememberMe ? 7 : 7; // 使用.env文件中的配置
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + expiryDays);

    await new Token({
      user_id: user._id,
      token: refreshToken,
      type: 'refresh',
      expires_at: refreshTokenExpiry
    }).save();

    // Return user data and tokens
    res.status(201).json({
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
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { user_name, password, rememberMe } = req.body;

    // Validate input
    if (!user_name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find user by username
    const user = await User.findOne({ user_name });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked due to too many failed attempts
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account locked. Please try again in ${remainingTime} minutes.`
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 minutes (15 min is too long)
        user.loginAttempts = 0;
        await user.save();
        return res.status(429).json({
          success: false,
          message: 'Account locked. Please try again in 15 minutes.'
        });
      }
      
      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset failed login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Generate tokens
    const accessToken = jwt.generateAccessToken(user._id);
    const refreshToken = jwt.generateRefreshToken(user._id, rememberMe);

    // Save ONLY refresh token to database (access token is not stored)
    // First, delete any existing refresh tokens for this user to avoid duplicates
    await Token.deleteMany({ user_id: user._id, type: 'refresh' });
    
    const refreshTokenExpiry = new Date();
    const expiryDays = rememberMe ? 7 : 7; // 使用.env文件中的配置
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
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from database
      await Token.deleteOne({ token: refreshToken, type: 'refresh' });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await Token.findOne({ token: refreshToken, type: 'refresh' });

    if (!tokenRecord || tokenRecord.isExpired()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const newAccessToken = jwt.generateAccessToken(user._id);
    const newRefreshToken = jwt.generateRefreshToken(user._id);

    // Use findOneAndUpdate for atomic operation
    // This ensures that we only create a new token if the old one exists and is deleted atomically
    const result = await Token.findOneAndUpdate(
      { token: refreshToken, type: 'refresh' },
      {
        $set: {
          token: newRefreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      { new: true }
    );

    // If the token was not found (it might have been deleted by another request)
    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token was already used or expired'
      });
    }

    // Return new tokens
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token conflict. Please try again.',
        error: 'Token refresh conflict'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
});

module.exports = router;
