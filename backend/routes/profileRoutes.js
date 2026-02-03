const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/Token');
const { authenticate } = require('../middleware/auth');

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: req.user._id,
          user_name: req.user.user_name,
          email: req.user.email,
          avatar: req.user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting user information',
      error: error.message
    });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { user_name, avatar, email } = req.body;

    // Check if username is already taken by another user
    if (user_name && user_name !== req.user.user_name) {
      const existingUser = await User.findOne({ 
        user_name,
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email,
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    console.log('before req.user: ',req.user)
    // Update user
    if (user_name) req.user.user_name = user_name;
    if (email) req.user.email = email;
    //if (avatar) req.user.avatar = avatar; //not used
    // Check if avatar is explicitly provided in the request body
    if ('avatar' in req.body) {
      req.user.avatar = avatar;
      console.log('Updating avatar to: ', avatar)
    }
    console.log('after req.user: ',req.user)
    await req.user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: req.user._id,
          user_name: req.user.user_name,
          email: req.user.email,
          avatar: req.user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
});

// Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Verify current password
    const isPasswordValid = await req.user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    // Delete all refresh tokens for this user (force re-login)
    await Token.deleteMany({ user_id: req.user._id, type: 'refresh' });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: error.message
    });
  }
});

module.exports = router;
